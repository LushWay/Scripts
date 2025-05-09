import {
  Block,
  BlockPermutation,
  EasingType,
  Entity,
  GameMode,
  LocationInUnloadedChunkError,
  LocationOutOfWorldBoundariesError,
  Player,
  TicksPerSecond,
  system,
  world,
} from '@minecraft/server'
import { BlockStateMapping, MinecraftCameraPresetsTypes } from '@minecraft/vanilla-data'
import { dedupe } from 'lib/dedupe'
import { ConfigurableLocation } from 'lib/location'
import { Vector } from 'lib/vector'
import { PersistentSet } from './database/persistent-set'
import { getRole } from './roles'

/** Represents location in the specific dimension */
export interface LocationInDimension {
  /** Location of the place */
  location: Vector3 | ConfigurableLocation<Vector3>
  /** Dimension of the location */
  dimensionId: DimensionType
}

/** Checks if block on specified location is loaded (e.g. we can operate with blocks/entities on it) and returns it */
export function getBlockStatus({ location, dimensionId }: LocationInDimension) {
  try {
    if ('valid' in location && !location.valid) return 'unloaded'

    const block = world[dimensionId].getBlock(location)
    if (!block?.isValid) return 'unloaded'

    return block
  } catch (e) {
    if (e instanceof LocationInUnloadedChunkError) return 'unloaded'
    throw e
  }
}

/** Checks if chunks is loaded (e.g. we can operate with blocks/entities on it) */
export function isChunkUnloaded(options: LocationInDimension) {
  return getBlockStatus(options) === 'unloaded'
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
  player.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
    location: Vector.add(player.getHeadLocation(), Vector.multiply(player.getViewDirection(), 0.3)),
    facingLocation: Vector.add(player.getHeadLocation(), Vector.multiply(player.getViewDirection(), 10)),
    easeOptions: {
      easeTime: animTime,
      easeType: EasingType.OutCubic,
    },
  })

  system.runTimeout(
    () => player.camera.setCamera(MinecraftCameraPresetsTypes.FirstPerson),
    restorePlayerCamera.name,
    animTime * TicksPerSecond,
  )
}

export const CURRENT_BUILDERS = new PersistentSet<string>('onlineBuilderList')
const buildingGameModes = [GameMode.creative, GameMode.spectator]

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
  world.overworld.runCommand(`tickingarea add ${Vector.string(location)} ${Vector.string(location)} ldchnk`)

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

        const status = getBlockStatus({ location, dimensionId: 'overworld' })
        if (status === 'unloaded') return i--

        return done(status)
      },
      'loadChunk',
      5,
    )
  })
})

/**
 * Generates a random 2D vector within a circle of a specified radius.
 *
 * @param radius - The radius of the circle from which you want to generate a random vector.
 * @returns - An object with properties `x` and `z`, representing a random vector within a circle of the specified
 *   radius.
 */
export function getRandomVectorInCircle(radius: number): { x: number; z: number } {
  const angle = Math.randomFloat(0, 2 * Math.PI)
  const distance = Math.randomFloat(100, radius)
  const result = {
    x: distance * Math.cos(angle),
    z: distance * Math.sin(angle),
  }

  return result
}
export async function getTopmostSolidBlock(location: Vector3) {
  if (await loadChunk(location)) {
    const hit = world.overworld.getBlockFromRay(location, Vector.down, { includeLiquidBlocks: true })
    if (!hit) return false

    const { block } = hit
    if (!block.isValid || block.isLiquid || block.isAir) {
      return false
    } else return block.location
  } else return false
}

export function withState<Name extends keyof BlockStateMapping>(
  name: Name,
  states: BlockStateMapping[Name],
): Parameters<(typeof BlockPermutation)['resolve']> {
  return [name, states]
}

interface DimensionLocation {
  /** Representing the location of a block in the world */
  vector: Vector3

  /** Specific dimension in the world. It is used to specify the dimension in which the block location is located. */
  dimensionType: DimensionType
}

export type AbstractPoint = DimensionLocation | Entity | Block

export function toPoint(abstractPoint: AbstractPoint): DimensionLocation {
  if (abstractPoint instanceof Entity || abstractPoint instanceof Block) {
    return { vector: abstractPoint.location, dimensionType: abstractPoint.dimension.type }
  } else return abstractPoint
}

export function createPoint(
  x: number,
  y: number,
  z: number,
  dimensionType: DimensionType = 'overworld',
): DimensionLocation {
  return { vector: { x, y, z }, dimensionType }
}
