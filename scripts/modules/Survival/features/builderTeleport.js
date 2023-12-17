import { Player, Vector } from '@minecraft/server'
import { tpMenu } from 'modules/Commands/tp.js'
import { EditableLocation, Portal } from 'smapi.js'

const TP_LOCATION = new EditableLocation('builders_portal').safe

/**
 * @type {Set<string>}
 */
const SENT = new Set()
if (TP_LOCATION.valid) {
  new Portal(
    'tp',
    Vector.add(TP_LOCATION, { x: 0, y: -1, z: -1 }),
    Vector.add(TP_LOCATION, { x: 0, y: 1, z: 1 }),
    tpMenuOnce
  )
}

/**
 * @param {Player} player
 */
export function tpMenuOnce(player) {
  if (!SENT.has(player.id)) {
    tpMenu(player).then(() => SENT.delete(player.id))
    SENT.add(player.id)
  }
}
