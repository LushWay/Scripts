import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { RadiusRegion, RadiusRegionOptions } from './RadiusRegion'

interface SafeAreaRegionOptions extends RadiusRegionOptions {
  safeAreaName?: string
  allowUsageOfCraftingTable?: boolean
}

export class SafeAreaRegion extends RadiusRegion {
  static readonly kind = 'safe'

  protected readonly saveable = false

  private readonly safeAreaName

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

  constructor(options: SafeAreaRegionOptions, key: string) {
    super(options, key)
    this.safeAreaName = options.safeAreaName
    this.allowUsageOfCraftingTable = options.allowUsageOfCraftingTable ?? true
  }

  get name() {
    return this.safeAreaName ? `Безопасная зона ${this.safeAreaName}` : super.name
  }
}
