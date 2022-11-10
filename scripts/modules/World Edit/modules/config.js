export const configuration = {
  MAX_HISTORY_LIMIT: 25, // this is the max ammount of times it will save your history and will remove the oldest backup when a new one is added
  STRUCTURE_CHUNK_SIZE: { x: 64, y: 64, z: 64 },
  FILL_CHUNK_SIZE: { x: 32, y: 32, z: 32 },
  COPY_FILE_NAME: "copy",
  DATA_PREFIX: "we",
  BACKUP_PREFIX: "backup",
  DRAW_SELECTION_PARTICLE: "minecraft:endrod",
  BLOCKS_BEFORE_AWAIT: 10000, // this is the ammout of blocks in a generation before it will check servers speed to delay the loading of a generation
  PING_AT_AWAIT: 25, // this a value that if the servers ping gets higer than this number during generation it will slow down the generation
  TICKS_TO_SLEEP: 1, // this is the ammout of ticks to delay durring a heavy proccess generation
  DRAW_SELECTION_DEFAULT: true,
  DRAW_SELECTION1_NAME: "§e╔═╗\n§e►1◄\n§e╚═╝",
  DRAW_SELECTION2_NAME: "§d╔═╗\n§d►2◄\n§d╚═╝",
};
