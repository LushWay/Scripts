import { system, world } from '@minecraft/server'

function interval() {
  try {
    for (const player of world.getAllPlayers()) {
      // TODO Increase on rank
      const freeSlots = 9

      // There is no way to access this thing without command lol

      for (let i = 0; i < freeSlots; i++) {
        player.runCommand(
          `replaceitem entity @s[hasitem={location=slot.enderchest,slot=${i},item=barrier}] slot.enderchest ${i} air`,
        )
      }

      for (let i = freeSlots; i <= 26; i++) {
        player.runCommand(
          `replaceitem entity @s slot.enderchest ${i} barrier 1 0 {"item_lock":{"mode":"lock_in_inventory"}}`,
        )
      }
    }
  } catch (e) {
    console.error('Unable to set player ender chest:', e)
  } finally {
    system.runTimeout(interval, 'ender_chest', 10)
  }
}

system.delay(interval)
