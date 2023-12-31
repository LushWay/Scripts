import { Player, system } from '@minecraft/server'

/**
 * @type {((player: Player) => string | false)[]}
 */
export const PLAYER_NAME_TAG_MODIFIERS = [player => `\n${player.name}`]

system.runPlayerInterval(
  player => {
    player.nameTag = PLAYER_NAME_TAG_MODIFIERS.map(modifier => modifier(player))
      .filter(result => result !== false)
      .join('')
  },
  'player.nameTag modifiers',
  20
)
