import { MolangVariableMap, Vector, world } from '@minecraft/server'

export const WE_CONFIG = {
  BRUSH_LOCATOR: '§c │ \n§c─┼─\n§c │',

  STRUCTURE_CHUNK_SIZE: { x: 64, y: 128, z: 64 },
  FILL_CHUNK_SIZE: { x: 32, y: 32, z: 32 },
  COPY_FILE_NAME: 'copy',
  BACKUP_PREFIX: 'backup',

  /**
   * The max ammount of times it will save
   * your history and will remove the oldest
   * backup when a new one is added
   */
  MAX_HISTORY_LIMIT: 25,

  /**
   * The ammout of blocks in a generation
   * before it will check servers speed to delay
   * the loading of a generation
   */
  BLOCKS_BEFORE_AWAIT: 10000,

  /**
   * The ammout of ticks to delay during
   * a heavy proccess generation
   */
  TICKS_TO_SLEEP: 1,

  DRAW_SELECTION_DEFAULT: true,
  DRAW_SELECTION_PARTICLE: 'minecraft:balloon_gas_particle',
  DRAW_SELECTION_MAX_SIZE: 5000,
  DRAW_SELECTION_PARTICLE_OPTIONS: new MolangVariableMap(),
}

WE_CONFIG.DRAW_SELECTION_PARTICLE_OPTIONS.setVector3('direction', {
  x: 0,
  y: 0,
  z: 0,
})

/**
 *
 * @param {Vector3} pos1
 * @param {Vector3} pos2
 * @param {object} [param2]
 * @param {Vector3} [param2.min]
 * @param {Vector3} [param2.max]
 */
export function spawnParticlesInArea(pos1, pos2, { min = Vector.min(pos1, pos2), max = Vector.max(pos1, pos2) } = {}) {
  for (const { x, y, z } of Vector.foreach(min, max)) {
    const isEdge =
      ((x == min.x || x == max.x) && (y == min.y || y == max.y)) ||
      ((y == min.y || y == max.y) && (z == min.z || z == max.z)) ||
      ((z == min.z || z == max.z) && (x == min.x || x == max.x))

    if (isEdge) {
      world.overworld.spawnParticle(
        WE_CONFIG.DRAW_SELECTION_PARTICLE,
        { x, y, z },
        WE_CONFIG.DRAW_SELECTION_PARTICLE_OPTIONS
      )
    }
  }
}
