import {
  Block,
  GameMode,
  ItemStack,
  LocationInUnloadedChunkError,
  LocationOutOfWorldBoundariesError,
  Player,
  TicksPerSecond,
  system,
  world,
} from '@minecraft/server'
import { MinecraftCameraPresetsTypes } from '@minecraft/vanilla-data'
import { dedupe } from 'lib/dedupe'
import { Vec } from 'lib/vector'
import { PersistentSet } from '../database/persistent-set'
import { getRole } from '../roles'
import { VectorInDimension } from './point'

/** Checks if block on specified location is loaded (e.g. we can operate with blocks/entities on it) and returns it */
export function getBlockStatus({ location, dimensionType }: VectorInDimension) {
  try {
    const block = world[dimensionType].getBlock(location)
    if (!block?.isValid) return 'unloaded'

    return block
  } catch (e) {
    if (e instanceof LocationInUnloadedChunkError) return 'unloaded'
    throw e
  }
}

/**
 * Checks if provided object is instance of {@link LocationInUnloadedChunkError} or
 * {@link LocationOutOfWorldBoundariesError}
 */
export function isLocationError(
  error: unknown,
): error is LocationInUnloadedChunkError | LocationOutOfWorldBoundariesError {
  return error instanceof LocationInUnloadedChunkError || error instanceof LocationOutOfWorldBoundariesError
}

/**
 * Restores player camera with easing and nice animation.
 *
 * @param player - Player to restore camera to
 * @param animTime - Time of the animation
 */
export function restorePlayerCamera(player: Player, animTime = 1) {
  const headLocation = player.getHeadLocation()
  player.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
    location: Vec.add(headLocation, Vec.multiply(player.getViewDirection(), 0.5)),
    facingLocation: Vec.add(headLocation, Vec.multiply(player.getViewDirection(), 10)),
    easeOptions: {
      easeTime: animTime,
      // easeType: EasingType.OutCubic,
    },
  })

  system.runTimeout(
    () => {
      if (Vec.distance(player.getHeadLocation(), headLocation) > 0.3) {
        // Apply animation again because player had moved
        restorePlayerCamera(player, animTime * 0.5)
      } else player.camera.setCamera(MinecraftCameraPresetsTypes.FirstPerson)
    },
    restorePlayerCamera.name,
    animTime * TicksPerSecond,
  )
}

export const CURRENT_BUILDERS = new PersistentSet<string>('onlineBuilderList')
const buildingGameModes = [GameMode.Creative, GameMode.Spectator]

/**
 * Check if player is currently building. Building player is player who is in the creative and whose role isn't member
 *
 * @param player - Player to check
 * @param uptodate - If true, it will force get players status, if false, which is default, will get from cache
 * @returns - Whenether player is building or not
 */
export function isNotPlaying(player: Player, uptodate = false) {
  if (uptodate) return buildingGameModes.includes(player.getGameMode()) && getRole(player) !== 'member'
  return CURRENT_BUILDERS.has(player.id)
}

/**
 * Tries to load chunk at provided location by adding tickingarea and trying to get block at location 100 times. If
 * chunk is still unloaded, returns false. If chunk is finally loaded, returns block.
 *
 * This function can be called only once concurrently. For example, if it was earlier called in the other part of script
 * and you call it here, it will wait for previous function to finish loading chunk and only then will execute. That is
 * for preventing overload
 */
export const loadChunk = dedupe(async function loadChunk(location: Vector3) {
  world.overworld.runCommand(`tickingarea remove ldchnk`)
  world.overworld.runCommand(`tickingarea add ${Vec.string(location)} ${Vec.string(location)} ldchnk`)

  let i = 100
  return new Promise<false | Block>(resolve => {
    function done(result: false | Block) {
      system.clearRun(interval)
      world.overworld.runCommand(`tickingarea remove ldchnk`)
      resolve(result)
    }

    const interval = system.runInterval(
      () => {
        if (i < 0) return done(false)

        const status = getBlockStatus({ location, dimensionType: 'overworld' })
        if (status === 'unloaded') return i--

        return done(status)
      },
      'loadChunk',
      5,
    )
  })
})

export async function getTopmostSolidBlock(location: Vector3) {
  if (await loadChunk(location)) {
    const hit = world.overworld.getBlockFromRay(location, Vec.down, { includeLiquidBlocks: true })
    if (!hit) return false

    const { block } = hit
    if (!block.isValid || block.isLiquid || block.isAir) {
      return false
    } else return block.location
  } else return false
}

/**
 * Generates a random 2D vector within a circle of a specified radius.
 *
 * @param radius - The radius of the circle from which you want to generate a random vector.
 * @returns - An object with properties `x` and `z`, representing a random vector within a circle of the specified
 *   radius.
 */
export function getRandomXZInCircle(radius: number): { x: number; z: number } {
  const angle = Math.randomFloat(0, 2 * Math.PI)
  const distance = Math.randomFloat(100, radius)
  const result = {
    x: distance * Math.cos(angle),
    z: distance * Math.sin(angle),
  }

  return result
}

export function copyAllItemPropertiesExceptEnchants(item: ItemStack, newitem: ItemStack) {
  newitem.nameTag = item.nameTag
  newitem.amount = item.amount
  if (newitem.durability && item.durability) newitem.durability.damage = item.durability.damage
  newitem.setLore(item.getLore())
  newitem.setCanDestroy(item.getCanDestroy())
  newitem.setCanPlaceOn(item.getCanPlaceOn())
  newitem.keepOnDeath = item.keepOnDeath
  newitem.lockMode = item.lockMode
  for (const prop of item.getDynamicPropertyIds()) newitem.setDynamicProperty(prop, item.getDynamicProperty(prop))
}
