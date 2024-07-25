import { playerJson } from './player-json'

export const PlayerProperties = Object.fromEntries(
  Object.keys(playerJson['minecraft:entity'].description.properties).map(e => [e, e]),
)
