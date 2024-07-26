import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Airdrop } from 'lib'
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
      ...Airdrop.entities,
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
