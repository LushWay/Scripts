export const WE_CONFIG = {
  BRUSH_LOCATOR: '§c │ \n§c─┼─\n§c │',

  STRUCTURE_CHUNK_SIZE: { x: 64, y: 64, z: 64 },
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
  DRAW_SELECTION_PARTICLE: 'minecraft:endrod',
  DRAW_SELECTION_MAX_SIZE: 5000,
}
