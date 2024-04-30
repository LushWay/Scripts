import { Container, ItemStack, MolangVariableMap, Player, Vector } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { Cooldown, Temporary, invalidLocation, util } from 'lib.js'
import { CONFIG } from 'lib/Assets/config.js'
import { Cutscene } from './Cutscene.js'

/**
 * List of items that controls the editing process
 *
 * @type {Record<
 *   string,
 *   [slot: number, item: ItemStack, onUse: (player: Player, cutscene: Cutscene, temp: Temporary) => void]
 * >}
 */
const controls = {
  create: [
    3,
    new ItemStack('we:tool').setInfo('§r§6> §fСоздать точку', 'используй предмет, чтобы создать точку катсцены.'),
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
      const backup = EDITING_CUTSCENE[player.id]
      cutscene.sections = backup.cutsceneSectionsBackup

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
      player.success(`Сохранено. Проверить: §7${CONFIG.commandPrefixes[0]}cutscene play ${cutscene.id}`)
    },
  ],
}

/**
 * Checks if the cutscene location is valid, then teleports the player to that location and backs up player inventory
 * and cutscene data.
 *
 * @param {Player} player - The player who is editing the cutscene.
 * @param {Cutscene} cutscene - The cutscene cene to be edited
 */
export function editCatcutscene(player, cutscene) {
  backupPlayerInventoryAndCutscene(player, cutscene)

  new Temporary(({ world, system, temp }) => {
    system.runInterval(
      () => {
        for (const section of cutscene.sections) {
          if (!section) continue

          for (const point of section.points) {
            particle(point, blueParticle)
          }
        }
      },
      'cutscene section edges particles',
      30,
    )

    const controller = { cancel: false }
    util.catch(async function visualize() {
      while (!temp.cleaned) {
        await nextTick

        const sections = cutscene.withNewPoint(player)
        if (!sections) return

        await cutscene.forEachPoint(
          point => {
            if (!Vector.valid(point)) return
            particle(point, whiteParticle)
          },
          { controller, sections, intervalTime: 1 },
        )
      }
    })

    const cooldown = new Cooldown({}, '', player, 1000, false)
    world.beforeEvents.itemUse.subscribe(event => {
      if (event.source.id !== player.id) return

      if (!cooldown.isExpired) return
      cooldown.start()

      for (const [, control, onUse] of Object.values(controls)) {
        if (control.is(event.itemStack)) {
          event.cancel = true
          system.delay(() => onUse(player, cutscene, temp))
        }
      }
    })

    world.beforeEvents.playerLeave.subscribe(event => {
      if (event.player.id === player.id) temp.cleanup()
    })

    /**
     * @param {Vector3 | undefined} point
     * @param {MolangVariableMap} vars
     */
    function particle(point, vars) {
      if (!point) return
      try {
        player.dimension.spawnParticle('minecraft:wax_particle', point, vars)
      } catch (e) {
        if (invalidLocation(e)) return
        if (e instanceof TypeError && e.message.includes('Native optional type conversion')) return
        console.error(e)
      }
    }

    return {
      cleanup() {
        const { hotbarSlots: slots, position } = EDITING_CUTSCENE[player.id]

        if (player.isValid()) {
          forEachHotbarSlot(player, (i, container) => {
            container.setItem(i, undefined)
            container.setItem(i, slots[i])
          })

          player.teleport(position)
        }

        delete EDITING_CUTSCENE[player.id]
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

/**
 * @typedef {{
 *   hotbarSlots: (ItemStack | undefined)[]
 *   position: Vector3
 *   cutsceneSectionsBackup: Cutscene['sections']
 * }} EditingCutscenePlayer
 */

/**
 * Map of player id to player editing cutscene
 *
 * @type {Record<string, EditingCutscenePlayer>}
 */
const EDITING_CUTSCENE = {}

/**
 * @param {Player} player
 * @param {Cutscene} cutscene
 */
function backupPlayerInventoryAndCutscene(player, cutscene) {
  EDITING_CUTSCENE[player.id] = {
    hotbarSlots: backupPlayerInventory(player),
    position: Vector.floor(player.location),
    cutsceneSectionsBackup: cutscene.sections.slice(),
  }

  cutscene.sections = []
}

/** @param {Player} player */
function backupPlayerInventory(player) {
  /** @type {EditingCutscenePlayer['hotbarSlots']} */
  const hotbarSlots = []
  const container = forEachHotbarSlot(player, (i, container) => {
    hotbarSlots[i] = container.getItem(i)
    container.setItem(i, undefined)
  })

  for (const [slot, item] of Object.values(controls)) {
    container?.setItem(slot, item)
  }

  return hotbarSlots
}

/**
 * Iterates over the player's hotbar slots and performs a specified action on each slot.
 *
 * @param {Player} player - Target player to get hotbar from
 * @param {(i: number, container: Container) => void} callback - Callback function that will be called for each hotbar
 *   slot. It takes two arguments: the index of the current slot (from 0 to 8) and the container` object belonging to
 *   the player.
 */
function forEachHotbarSlot(player, callback) {
  const { container } = player
  if (!container) throw new ReferenceError('Player has no container!')

  for (let i = 0; i < 9; i++) {
    callback(i, container)
  }

  return container
}
