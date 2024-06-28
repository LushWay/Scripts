import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { RadiusRegion, RadiusRegionOptions } from './radius'

interface SafeAreaRegionOptions extends RadiusRegionOptions {
  safeAreaName?: string
  allowUsageOfCraftingTable?: boolean
}

export class SafeAreaRegion extends RadiusRegion {
  protected readonly saveable = false

  protected readonly defaultPermissions = {
    allowedEntities: [
      MinecraftEntityTypes.Player,
      MinecraftEntityTypes.Npc,
      MinecraftEntityTypes.ArmorStand,
      MinecraftEntityTypes.Chicken,
      MinecraftEntityTypes.ChestMinecart,
      'minecraft:painting',
      'minecraft:item',
    ],
    doorsAndSwitches: false,
    openContainers: false,
    pvp: false,
    owners: [],
  }

  readonly allowUsageOfCraftingTable: boolean = false

  readonly safeAreaName?: string

  constructor(options: SafeAreaRegionOptions, key: string) {
    super(options, key)
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
