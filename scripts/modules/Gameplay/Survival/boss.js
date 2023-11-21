/**
 * To add boss
 * "minecraft:boss": {
    "should_darken_sky": false,
    "hud_range": 25
}
 */

export class Boss {
  /**
   * @param {object} o
   * @param {string} o.id Script id used for location
   * @param {string} o.entityId
   * @param {string} o.displayName
   */
  constructor({ id, entityId, displayName }) {
    this.name = id
    this.entityId = entityId
    this.displayName = displayName
  }
}
