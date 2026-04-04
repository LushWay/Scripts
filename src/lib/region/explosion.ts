import { Block, world } from '@minecraft/server'
import { Region } from './kinds/region'
import { SafeAreaRegion } from './kinds/safe-area'

world.beforeEvents.explosion.subscribe(event => {
  event.setImpactedBlocks(event.getImpactedBlocks().filter(canBlockExplode))
})

function canBlockExplode(block: Block) {
  const region = Region.getAt(block)
  if (region instanceof SafeAreaRegion) return false

  return true
}
