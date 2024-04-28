export const CONFIG = {
  commandPrefixes: ['.', '-'],
  /**
   * Time in ms to mark SM.state.first_load
   *
   * @type {number}
   */
  firstPlayerJoinTime: 5000,
  singlePlayerHostId: '-4294967295',
}

export const CUSTOM_ITEMS = {
  menu: 'sm:menu',
  brush: 'we:brush',
  dash: 'we:dash',
  shovel: 'we:shovel',
  tool: 'we:tool',
  wand: 'we:wand',
  compassPrefix: 'sm:compass',
  money: 'sm:money',
}

export const CUSTOM_ENTITIES = {
  database: 'rubedo:database',
  sit: 'sm:sit',
  floatingText: 'f:t',
}

export const SOUNDS = {
  levelup: 'random.levelup',
  /** Note.pling */
  success: 'note.pling',
  /** Random.orb */
  action: 'random.orb',
  click: 'note.hat',
  fail: 'block.false_permissions',
}
