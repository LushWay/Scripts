import { GameMode, Player, system } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { i18n, noI18n } from 'lib/i18n/text'
import { registerRegionType } from 'lib/region/command'
import { toPoint } from 'lib/utils/point'
import { Area } from '../areas/area'
import { RegionEvents } from '../events'
import { Region, RegionCreationOptions, RegionPermissions } from './region'

interface SafeAreaRegionOptions extends RegionCreationOptions {
  safeAreaName?: Text
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

  readonly safeAreaName?: Text

  constructor(area: Area, options: SafeAreaRegionOptions, key: string) {
    super(area, options, key)
    this.safeAreaName = options.safeAreaName
    this.allowUsageOfCraftingTable = options.allowUsageOfCraftingTable ?? true
  }

  get name() {
    return this.safeAreaName ? i18n.nocolor`Безопасная зона ${this.safeAreaName}` : super.name
  }

  get displayName() {
    return this.safeAreaName
  }
}
registerRegionType(noI18n`Мирные зоны`, SafeAreaRegion)
export const disableAdventureNear: (typeof Region)[] = []
export const adventureModeRegions: (typeof Region)[] = [SafeAreaRegion]

function nearDisabledAdventureRegions(player: Player): boolean {
  return Region.getNear(toPoint(player), 6).some(region => disableAdventureNear.some(type => region instanceof type))
}

function adventureModeRegion(region: Region) {
  return adventureModeRegions.some(e => region instanceof e)
}

system.runPlayerInterval(
  player => {
    const regions = RegionEvents.playerInRegionsCache.get(player)
    if (!regions) return

    const region = regions[0] as Region | undefined

    const gamemode = player.getGameMode()
    const adventure = gamemode === GameMode.Adventure
    const survival = gamemode === GameMode.Survival

    if (adventure && (!region || nearDisabledAdventureRegions(player))) {
      player.setGameMode(GameMode.Survival)
    } else if (survival && region && adventureModeRegion(region)) {
      player.setGameMode(GameMode.Adventure)
    }
  },
  'safeAreaDisableAdventureNear',
  40,
)

RegionEvents.onPlayerRegionsChange.subscribe(({ player, previous, newest }) => {
  const been = previous[0] && adventureModeRegion(previous[0])
  const now = newest[0] && (adventureModeRegion(newest[0]) || !nearDisabledAdventureRegions(player))

  const gamemode = player.getGameMode()
  const adventure = gamemode === GameMode.Adventure
  const survival = gamemode === GameMode.Survival

  if (been && adventure && !now) {
    player.setGameMode(GameMode.Survival)
  } else if (now && survival) {
    player.setGameMode(GameMode.Adventure)
  }
})
