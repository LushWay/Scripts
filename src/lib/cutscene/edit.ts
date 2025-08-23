/* i18n-ignore */

import { Container, ItemStack, MolangVariableMap, Player } from '@minecraft/server'
import { Vec } from 'lib/vector'

import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Items } from 'lib/assets/custom-items'
import { Cooldown } from 'lib/cooldown'
import { i18n } from 'lib/i18n/text'
import { Temporary } from 'lib/temporary'
import { util } from 'lib/util'
import { isLocationError } from 'lib/utils/game'
import { Cutscene } from './cutscene'
import { cutscene as cusceneCommand } from './menu'

/** List of items that controls the editing process */
const controls: Record<
  string,
  [slot: number, item: ItemStack, onUse: (player: Player, cutscene: Cutscene, temp: Temporary) => void]
> = {
  create: [
    3,
    new ItemStack(Items.WeTool).setInfo('§r§6> §fСоздать точку', 'используй предмет, чтобы создать точку катсцены.'),
    (player, cutscene) => {
      if (!cutscene.sections[0]) cutscene.withNewSection(cutscene.sections, {})

      cutscene.withNewPoint(player, { sections: cutscene.sections, warn: true })
      player.info(
        `Точка добавлена. Точек в секции: §f${cutscene.sections[cutscene.sections.length - 1]?.points.length}`,
      )
    },
  ],
  createSection: [
    4,
    new ItemStack(MinecraftItemTypes.ChainCommandBlock).setInfo(
      '§r§3> §fСоздать секцию',
      'используй предмет, чтобы создать секцию катсцены (множество точек).',
    ),
    (player, cutscene) => {
      cutscene.withNewSection(cutscene.sections, {})
      player.info(`Секция добавлена. Секций всего: §f${cutscene.sections.length}`)
    },
  ],
  cancel: [
    7,
    new ItemStack(MinecraftItemTypes.Barrier).setInfo(
      '§r§c> §fОтмена',
      'используйте предмет, чтобы отменить редактироание катсцены и вернуть все в исходное состояние.',
    ),
    (player, cutscene, temp) => {
      // Restore bakcup
      const backup = EditingCutscene.get(player.id)
      if (backup) cutscene.sections = backup.cutsceneSectionsBackup

      temp.cleanup()
      player.success('Успешно отменено!')
    },
  ],
  saveAndExit: [
    8,
    new ItemStack(MinecraftItemTypes.HoneyBottle).setInfo(
      '§r§6> §fСохранить и выйти',
      'используй предмет, чтобы выйти из меню катсцены.',
    ),
    (player, cutscene, temp) => {
      temp.cleanup()
      player.success(i18n`Сохранено. Проверить: ${cusceneCommand}§f play ${cutscene.id}`)
    },
  ],
}

/**
 * Checks if the cutscene location is valid, then teleports the player to that location and backs up player inventory
 * and cutscene data.
 *
 * @param player - The player who is editing the cutscene.
 * @param cutscene - The cutscene cene to be edited
 */
export function editCatcutscene(player: Player, cutscene: Cutscene) {
  backupPlayerInventoryAndCutscene(player, cutscene)

  new Temporary(({ world, system, temporary }) => {
    system.runInterval(
      () => {
        for (const section of cutscene.sections) {
          if (!section) continue

          for (const point of section.points) particle(point, blueParticle)
        }
      },
      'cutscene section edges particles',
      30,
    )

    const controller = { cancel: false }
    util.catch(async function visualize() {
      while (!temporary.cleaned) {
        await system.sleep(10)

        const sections = cutscene.withNewPoint(player)
        if (!sections) return

        await cutscene.forEachPoint(
          point => {
            if (!Vec.isValid(point)) return
            particle(point, whiteParticle)
          },
          { controller, sections, intervalTime: 1 },
        )
      }
    })

    const cooldown = new Cooldown(1000)

    world.beforeEvents.itemUse.subscribe(event => {
      if (event.source.id !== player.id) return
      if (!cooldown.isExpired(player)) return

      for (const [, control, onUse] of Object.values(controls)) {
        if (control.is(event.itemStack)) {
          event.cancel = true
          system.delay(() => onUse(player, cutscene, temporary))
        }
      }
    })

    world.beforeEvents.playerLeave.subscribe(event => {
      if (event.player.id === player.id) system.delay(() => temporary.cleanup())
    })

    function particle(point: Vector3 | undefined, vars: MolangVariableMap) {
      if (!point) return
      try {
        player.dimension.spawnParticle('minecraft:wax_particle', point, vars)
      } catch (e) {
        if (isLocationError(e)) return
        if (e instanceof TypeError && e.message.includes('Native optional type conversion')) return

        console.error(e)
      }
    }

    return {
      cleanup() {
        const editingPlayer = EditingCutscene.get(player.id)
        if (!editingPlayer) return

        const { hotbarSlots, position } = editingPlayer

        if (player.isValid) {
          forEachHotbarSlot(player, (i, container) => container.setItem(i, hotbarSlots[i]))
          player.teleport(position)
        }

        EditingCutscene.delete(player.id)
        cutscene.save()
      },
    }
  })
}

const blueParticle = new MolangVariableMap()
blueParticle.setColorRGBA('color', {
  red: 0.5,
  green: 0.5,
  blue: 1,
  alpha: 0,
})

const whiteParticle = new MolangVariableMap()
whiteParticle.setColorRGBA('color', {
  red: 1,
  green: 1,
  blue: 1,
  alpha: 0,
})

interface EditingCutscenePlayer {
  hotbarSlots: (ItemStack | undefined)[]
  position: Vector3
  cutsceneSectionsBackup: Cutscene['sections']
}

/** Map of player id to player editing cutscene */
const EditingCutscene = new Map<string, EditingCutscenePlayer>()

function backupPlayerInventoryAndCutscene(player: Player, cutscene: Cutscene) {
  EditingCutscene.set(player.id, {
    hotbarSlots: backupPlayerInventory(player),
    position: Vec.floor(player.location),
    cutsceneSectionsBackup: cutscene.sections.slice(),
  })

  cutscene.sections = []
}

function backupPlayerInventory(player: Player) {
  const hotbarSlots: EditingCutscenePlayer['hotbarSlots'] = []
  const container = forEachHotbarSlot(player, (i, container) => {
    hotbarSlots[i] = container.getItem(i)
    container.setItem(i, undefined)
  })

  for (const [slot, item] of Object.values(controls)) {
    container.setItem(slot, item)
  }

  return hotbarSlots
}

/**
 * Iterates over the player's hotbar slots and performs a specified action on each slot.
 *
 * @param player - Target player to get hotbar from
 * @param callback - Callback function that will be called for each hotbar slot. It takes two arguments: the index of
 *   the current slot (from 0 to 8) and the container` object belonging to the player.
 */
function forEachHotbarSlot(player: Player, callback: (i: number, container: Container) => void) {
  const { container } = player
  if (!container) throw new ReferenceError('Player has no container!')

  for (let i = 0; i < 9; i++) {
    callback(i, container)
  }

  return container
}
