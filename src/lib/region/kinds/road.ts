import { Player, system } from '@minecraft/server'
import { MinecraftEffectTypes } from '@minecraft/vanilla-data'
import { i18n, noI18n } from 'lib/i18n/text'
import { RegionEvents } from '../events'
import { registerRegionType, registerSaveableRegion } from '../index'
import { Region, RegionPermissions } from './region'

export class RoadRegion extends Region {
  protected defaultPermissions: RegionPermissions = {
    pvp: 'pve',
    owners: [],

    doors: true,
    gates: false,
    switches: true,
    trapdoors: false,
    openContainers: false,

    allowedAllItem: true,
    allowedEntities: 'all',
  }

  protected priority = -1

  get displayName(): Text | undefined {
    return i18n`Дорога`
  }
}

registerSaveableRegion('road', RoadRegion)
registerRegionType(noI18n`Дороги`, RoadRegion)

RegionEvents.onPlayerRegionsChange.subscribe(({ player, newest }) => {
  speed(player, newest)
})

system.runPlayerInterval(
  player => {
    const regions = RegionEvents.playerInRegionsCache.get(player)

    if (!regions) return

    speed(player, regions)
  },
  'road skin region',
  20,
)

function speed(player: Player, regions: Region[]) {
  if (regions.some(e => e instanceof RoadRegion)) {
    player.addEffect(MinecraftEffectTypes.Speed, 40, { showParticles: false, amplifier: 2 })
  }
}
