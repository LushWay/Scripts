import { world } from '@minecraft/server'
import { OBJECTIVES } from './var.js'

for (const { id, name, watch } of OBJECTIVES) {
  try {
    world.scoreboard.addObjective(id, name ?? id)
    if (watch) world.say('§cAdded objective with id ' + id)
  } catch (e) {}
}
