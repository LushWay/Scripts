import { Entity, Player } from '@minecraft/server'

export const PVP = {
  /**
   * Array of player ids who wouldn't get pvp lock
   * @type {string[]}
   */
  disabled: [],
  /**
   * @type {Record<string, number>}
   */
  lock_display: {},
  /**
   * @type {((entity: Entity) => string | false)[]}
   */
  name_modifiers: [
    entity => {
      if (!(entity instanceof Player)) return false

      return `\n${entity.name}`
    },
  ],
}
