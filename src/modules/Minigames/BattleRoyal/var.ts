import { Player } from '@minecraft/server'
import { Settings } from 'lib'
import { DynamicPropertyDB } from 'lib/database/properties'
import { EventSignal } from 'lib/EventSignal'

export const BATTLE_ROYAL_EVENTS = {
  /** @type {EventSignal<Player>} */
  join: new EventSignal(),
  /** @type {EventSignal<Player>} */
  death: new EventSignal(),
}

/** @type {Record<string, boolean>} */
export const BR_QUENE = {}

export const BR_CONFIG = Settings.world('BattleRoyal', {
  gamepos: { description: 'x y', value: '', name: 'Центр игры' },
  time: {
    description: 'Время игры в формате MM:SS (15:00)',
    value: '15:00',
    name: 'Время игры',
  },
})

export const BR_DB = new DynamicPropertyDB('BattleRoyal')
