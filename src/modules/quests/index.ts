import './quest-menu'

import './learning/index'

import './lib/cutscene'
import './lib/cutscene-menu'

import { system } from '@minecraft/server'
import '../places/stone-quarry/quests/investigating'

system.runInterval(
  () => {
    throw new TypeError('Test scripts error!')
  },
  'aaa',
  40,
)
