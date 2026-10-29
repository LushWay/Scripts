import { PlayerCursorInventoryComponent, world } from '@minecraft/server'

world.afterEvents.playerSpawn.subscribe(event => {
  const component = event.player.getComponent(PlayerCursorInventoryComponent.componentId)
  if (!component) return console.log(`No cursor component for ${event.player.name}`)
  if (!component.item) return

  console.log(`Player ${event.player.name} tried to dupe ${component.item.typeId} with amount ${component.item.amount}`)
  component.clear()
})
