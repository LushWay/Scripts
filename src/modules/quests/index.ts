import { system } from '@minecraft/server'
import './learning/index'

system.runInterval(
  () => {
    console.error('Huh?')
  },
  's',
  20,
)
