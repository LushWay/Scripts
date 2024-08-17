import { playerJson } from './generated'

export const PlayerProperties = Object.fromEntries(
  Object.keys(playerJson['minecraft:entity'].description.properties).map(e => [e, e]),
)

export const PlayerEvents = Object.fromEntries(Object.keys(playerJson['minecraft:entity'].events).map(e => [e, e]))
