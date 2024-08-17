import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Area } from '../areas/area'
import { Region, RegionCreationOptions } from './region'

interface SafeAreaRegionOptions extends RegionCreationOptions {
  safeAreaName?: string
  allowUsageOfCraftingTable?: boolean
}

export class SafeAreaRegion extends Region {
  protected readonly saveable = false

  protected readonly defaultPermissions = {
    allowedEntities: [
      MinecraftEntityTypes.Player,
      MinecraftEntityTypes.ArmorStand,
      MinecraftEntityTypes.Chicken,
      'minecraft:painting',
    ],
    doorsAndSwitches: false,
    openContainers: false,
    pvp: false,
    owners: [],
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
