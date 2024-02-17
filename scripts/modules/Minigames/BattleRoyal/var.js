import { Player } from '@minecraft/server'
import { Settings } from 'lib.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { EventSignal } from 'lib/EventSignal.js'

export const BATTLE_ROYAL_EVENTS = {
  /** @type {EventSignal<Player>} */
  join: new EventSignal(),
  /** @type {EventSignal<Player>} */
  death: new EventSignal(),
}

/**
 * @type {Record<string, boolean>}
 */
export const BR_QUENE = {}

export const BR_CONFIG = Settings.world('BattleRoyal', {
  gamepos: { desc: 'x y', value: '', name: 'Центр игры' },
  time: {
    desc: 'Время игры в формате MM:SS (15:00)',
    value: '15:00',
    name: 'Время игры',
  },
})

export const BR_DB = new DynamicPropertyDB('BattleRoyal')
