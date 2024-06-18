import { Settings } from 'lib'
import { table } from 'lib/database/abstract'
import { EventSignal } from 'lib/event-signal'

export const BATTLE_ROYAL_EVENTS = {
  join: new EventSignal(),
  death: new EventSignal(),
}

export const BR_QUENE: Record<string, boolean> = {}

export const BR_CONFIG = Settings.world('BattleRoyal', 'BattleRoyal', {
  gamepos: { description: 'x y', value: '', name: 'Центр игры' },
  time: {
    description: 'Время игры в формате MM:SS (15:00)',
    value: '15:00',
    name: 'Время игры',
  },
})

export const BR_DB = table('battleRoyal')
