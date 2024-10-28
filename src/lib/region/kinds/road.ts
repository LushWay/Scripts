import { MinecraftEffectTypes } from '@minecraft/vanilla-data'
import { RegionEvents } from '../events'
import { registerCreateableRegion, registerSaveableRegion } from '../index'
import { Region, RegionPermissions } from './region'

export class RoadRegion extends Region {
  protected defaultPermissions: RegionPermissions = {
    pvp: 'pve',
    owners: [],

    doors: true,
    gates: true,
    switches: true,
    trapdoors: true,
    openContainers: true,

    allowedAllItem: true,
    allowedEntities: 'all',
  }

  protected priority = -1

  get displayName(): string | undefined {
    return 'Дорога'
  }
}

registerSaveableRegion('road', RoadRegion)
registerCreateableRegion('Дороги', RoadRegion)

RegionEvents.onPlayerRegionsChange.subscribe(({ player, newest }) => {
  if (newest.some(e => e instanceof RoadRegion)) {
    player.addEffect(MinecraftEffectTypes.Speed, 40, { showParticles: false, amplifier: 2 })
  }
})
