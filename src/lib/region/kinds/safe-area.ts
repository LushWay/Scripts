import { GameMode, Player, system } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { toPoint } from 'lib/game-utils'
import { registerCreateableRegion } from 'lib/region/command'
import { Area } from '../areas/area'
import { RegionEvents } from '../events'
import { BossArenaRegion } from './boss-arena'
import { Region, RegionCreationOptions, RegionPermissions } from './region'

interface SafeAreaRegionOptions extends RegionCreationOptions {
  safeAreaName?: string
  allowUsageOfCraftingTable?: boolean
}

export class SafeAreaRegion extends Region {
  protected readonly defaultPermissions: RegionPermissions = {
    allowedEntities: [
      MinecraftEntityTypes.Player,
      MinecraftEntityTypes.ArmorStand,
      MinecraftEntityTypes.Chicken,
      'minecraft:painting',
      'minecraft:leash_knot',
    ],
    doors: true,
    switches: false,
    gates: false,
    trapdoors: false,
    openContainers: false,
    pvp: false,
    owners: [],
    allowedAllItem: true,
  }

  readonly allowUsageOfCraftingTable: boolean = false

  readonly safeAreaName?: string

  constructor(area: Area, options: SafeAreaRegionOptions, key: string) {
    super(area, options, key)
    this.safeAreaName = options.safeAreaName
    this.allowUsageOfCraftingTable = options.allowUsageOfCraftingTable ?? true
  }

  get name() {
    return this.safeAreaName ? `Безопасная зона ${this.safeAreaName}` : super.name
  }

  get displayName() {
    return this.safeAreaName
  }
}
registerCreateableRegion('Мирные зоны', SafeAreaRegion)
export const disableAdventureNear: (typeof Region)[] = []
export const adventureModeRegions: (typeof Region)[] = []

function nearDisabledAdventureRegions(player: Player): boolean {
  return disableAdventureNear.some(e => e.getNear(toPoint(player), 6).length)
}

function adventureModeRegion(region: Region) {
  return region instanceof SafeAreaRegion || region instanceof BossArenaRegion
}

system.runPlayerInterval(
  player => {
    const regions = RegionEvents.playerInRegionsCache.get(player)
    if (!regions?.length) return

    const near = nearDisabledAdventureRegions(player)
    console.log({ r: regions.length, near })
    if (near && player.getGameMode() === GameMode.adventure) {
      player.setGameMode(GameMode.survival)
    } else if (adventureModeRegion(regions[0])) {
      player.setGameMode(GameMode.adventure)
    }
  },
  'safeAreaDisableAdventureNear',
  40,
)

RegionEvents.onPlayerRegionsChange.subscribe(({ player, previous, newest }) => {
  const been = previous.length && adventureModeRegion(previous[0])
  const now = newest.length && (adventureModeRegion(newest[0]) || !nearDisabledAdventureRegions(player))

  const gamemode = player.getGameMode()
  const adventure = gamemode === GameMode.adventure
  const survival = gamemode === GameMode.survival

  if (been && adventure && !now) {
    player.setGameMode(GameMode.survival)
  } else if (now && survival) {
    player.setGameMode(GameMode.adventure)
  }
})
