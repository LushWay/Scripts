import {
  Container,
  ItemStack,
  LocationInUnloadedChunkError,
  MolangVariableMap,
  Player,
  Vector,
} from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { CONFIG } from 'config.js'
import { EditableLocation, Temporary, util } from 'lib.js'
import { settingsGroupMenu } from 'modules/Commands/settings.js'
import { Scene } from './Scene.js'

/**
 * @typedef {{
 *  hotbarSlots: (ItemStack | undefined)[];
 *  position: Vector3;
 *  sceneDotsBeforeEdit: import('modules/Quests/lib/Scene/Scene.js').SceneDot[];
 * }} EditingScenePlayer
 */

/**
 * Map of player id to player editing scene
 * @type {Record<string, EditingScenePlayer>}
 */
export const EDITING_SCENE = {}

/**
 * @param {Player} player
 * @param {Scene} scene
 */
function backupPlayerInventoryAndScene(player, scene) {
  if (!scene.location.valid) return

  EDITING_SCENE[player.id] = {
    hotbarSlots: backupPlayerInventory(player),
    position: Vector.floor(player.location),
    sceneDotsBeforeEdit: scene.dots.slice(),
  }

  player.teleport(scene.location)
  scene.dots = []
}

/**
 * @param {Player} player
 */
function backupPlayerInventory(player) {
  /** @type {EditingScenePlayer['hotbarSlots']} */
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
 *
 * @param {Player} player
 * @param {Temporary} temp
 * @param {Scene} scene
 */
function exitSceneEditing(player, temp, scene) {
  const { hotbarSlots: slots, position } = EDITING_SCENE[player.id]
  forEachHotbarSlot(player, (i, container) => {
    container.setItem(i, undefined)
    container.setItem(i, slots[i])
  })
  player.teleport(position)
  delete EDITING_SCENE[player.id]
  temp.cleanup()
  scene.save()
}

/**
 * Iterates over the player's hotbar slots and performs a specified
 * action on each slot.
 * @param {Player} player - Target player to get hotbar from
 * @param {(i: number, container: Container) => void} callback - Callback function
 * that will be called for each hotbar slot. It takes two arguments: the index of the current slot
 * (from 0 to 8) and the container` object belonging to the player.
 */
function forEachHotbarSlot(player, callback) {
  const { container } = player
  if (!container) throw new ReferenceError('Player has no container!')

  for (let i = 0; i < 9; i++) {
    callback(i, container)
  }

  return container
}

/**
 * List of items that controls the editing process
 * @type {Record<string,
 *   [
 *     slot: number,
 *     item: ItemStack,
 *     onUse: (player: Player, scene: Scene, temp: Temporary) => void
 *   ]
 * >}
 */
const controls = {
  cancel: [
    0,
    new ItemStack(MinecraftItemTypes.Barrier).setInfo(
      '§r§c> §fОтмена',
      'используйте предмет, чтобы отменить редактироание катсцены и вернуть все в исходное состояние.'
    ),
    (player, scene, temp) => {
      const backup = EDITING_SCENE[player.id]
      scene.dots = backup.sceneDotsBeforeEdit
      exitSceneEditing(player, temp, scene)
      player.success('Успешно отменено!')
    },
  ],
  create: [
    4,
    new ItemStack('we:tool').setInfo('§r§6> §fСоздать точку', 'используй предмет, чтобы создать точку катсцены.'),
    (player, scene) => {
      if (!scene.location.valid) return

      scene.dots.push(getRelativeVector5(player, scene.location))
      player.info('Точка добавлена.')
    },
  ],
  saveAndExit: [
    8,
    new ItemStack(MinecraftItemTypes.HoneyBottle).setInfo(
      '§r§6> §fСохранить и выйти',
      'используй предмет, чтобы выйти из меню катсцены.'
    ),
    (player, scene, temp) => {
      exitSceneEditing(player, temp, scene)
      player.success(`Сохранено. Проверить: §7${CONFIG.commandPrefixes[0]}scene play ${scene.name}`)
    },
  ],
}

/**
 * Checks if the scene location is valid, then teleports the player to that
 * location and backs up player inventory and scene data.
 * @param {Player} player - The player who is editing the scene.
 * @param {Scene} scene - The scene cene to be edited
 */
export function editCatscene(player, scene) {
  if (!scene.location.valid) {
    return settingsGroupMenu(player, EditableLocation.key, false, {
      [scene.location.id]: '§6Установите базовую точку катсцены.',
    })
  }

  backupPlayerInventoryAndScene(player, scene)

  new Temporary(({ world, system, temp }) => {
    system.runInterval(
      () => {
        if (!scene.location.valid) return
        for (const dot of scene.dots) {
          try {
            player.dimension.spawnParticle('minecraft:wax_particle', Vector.add(scene.location, dot), blueParticle)
          } catch (e) {
            if (e instanceof LocationInUnloadedChunkError) continue
          }
        }
      },
      'scene particle',
      20
    )

    util.catch(async function visualize() {
      if (!scene.location.valid) return
      while (!temp.cleaned) {
        await nextTick
        const vectors = scene.dots.concat(getRelativeVector5(player, scene.location))
        for (const location of scene.curve({ vectors, step: 0.5 / 4 })) {
          if (temp.cleaned) return
          if (!Vector.valid(location)) continue
          try {
            player.dimension.spawnParticle(
              'minecraft:wax_particle',
              Vector.add(scene.location, location),
              whiteParticle
            )

            await system.sleep(~~(scene.intervalTime / 4))
          } catch (e) {
            if (e instanceof LocationInUnloadedChunkError) continue
            util.error(e)
          }
        }
      }
    })

    world.beforeEvents.itemUse.subscribe(event => {
      if (event.source.id !== player.id) return

      for (const [, control, onUse] of Object.values(controls)) {
        if (control.is(event.itemStack)) {
          event.cancel = true
          system.delay(() => {
            onUse(player, scene, temp)
          })
        }
      }
    })

    world.beforeEvents.playerLeave.subscribe(event => {
      if (event.player.id === player.id) temp.cleanup()
    })
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
 * @param {Player} player
 * @param {Vector3} relativeBase
 */
export function getRelativeVector5(player, relativeBase) {
  const { x: rx, y: ry } = player.getRotation()
  const { x, y, z } = Vector.subtract(Vector.floor(player.getHeadLocation()), relativeBase)
  return { x, y, z, rx: Math.floor(rx), ry: Math.floor(ry) }
}
