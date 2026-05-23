import { ItemStack, system } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'

import { form } from 'lib/form/new'
import { i18n, i18nShared, noI18n } from 'lib/i18n/text'
import { anyPlayerNearRegion } from 'lib/player-move'
import {
  actionGuard,
  ActionGuardOrder,
  disableAdventureNear,
  PVP_ENTITIES,
  Region,
  RegionPermissions,
  registerSaveableRegion,
} from 'lib/region'
import { noGroup } from 'lib/rpg/place'
import { rollChance } from 'lib/rpg/random'
import { ItemResource, ResourceLocationRegion, ResourcesSource } from 'lib/rpg/resource-source'
import { onLoad } from 'lib/utils/load-ref'
import { createLogger } from 'lib/utils/logger'
import { fromMsToTicks, ms } from 'lib/utils/ms'
import { Vec } from 'lib/vector'
import { BaseItem } from '../base/base'

const logger = createLogger('warden')

class WardenDungeonRegion extends Region {
  static resources = new ResourcesSource()

  static place = noGroup.place('warden').name(i18nShared.nocolor`§5Варден`)

  protected priority = 3

  protected defaultPermissions: RegionPermissions = {
    allowedAllItem: true,
    allowedEntities: [...PVP_ENTITIES, MinecraftEntityTypes.Warden],

    doors: true,
    gates: true,
    pvp: true,
    switches: true,
    trapdoors: true,

    owners: [],
    openContainers: false,
  }

  protected onCreate(): void {
    this.onRestore()
  }

  protected onRestore(): void {
    WardenDungeonRegion.resources.addLocation(new ResourceLocationRegion(WardenDungeonRegion.place, this))
  }

  get displayName(): Text {
    return WardenDungeonRegion.place.name
  }
}
registerSaveableRegion('wardenDungeon', WardenDungeonRegion)
WardenDungeonRegion.register(noI18n`Данж вардена`)

onLoad(() => {
  WardenDungeonRegion.resources.add(
    new ItemResource(new ItemStack(MinecraftItemTypes.AncientDebris)).setDescription(
      i18n`Лежит группами по 5-10 блоков рядом с сундуками`,
    ),
  )
  WardenDungeonRegion.resources.add(
    new ItemResource(BaseItem.blueprint).setDescription(i18n`Может появиться в сундуке внутри кучи древних обломков`),
  )
})

interface LinkedDatabase extends JsonObject {
  selected: boolean
  cleaned: boolean
  blocks: { x: number; y: number; z: number }[]
}

class WardenDungeonLootRegion extends Region {
  protected priority = 4
  get displayName(): Text | undefined {
    return i18n.nocolor`§dНезеритовая жила`
  }
  ldb: LinkedDatabase = { selected: false, blocks: [], cleaned: false }

  protected defaultPermissions: RegionPermissions = {
    allowedAllItem: true,
    allowedEntities: PVP_ENTITIES,

    doors: true,
    gates: true,
    pvp: true,
    switches: true,
    trapdoors: true,

    owners: [],
    openContainers: true,
  }

  protected onCreate(): void {
    this.area.forEachVector((vector, isIn, dimension) => {
      if (isIn) {
        dimension.setBlockType(vector, MinecraftBlockTypes.Air)
      }
    })
  }
}
registerSaveableRegion('wardenDungeonLoot', WardenDungeonLootRegion)
WardenDungeonLootRegion.register(noI18n`Лут данжа вардена`)
disableAdventureNear.push(WardenDungeonLootRegion)

actionGuard((player, region, ctx) => {
  if (region instanceof WardenDungeonLootRegion) {
    if (ctx.type === 'break' || ctx.type === 'interactWithBlock') {
      logger.player(player).debug('Break')
      return true
    }
  }
}, ActionGuardOrder.Feature)

system.runInterval(
  () => {
    let regions = WardenDungeonLootRegion.getAll()
    if (!regions.length) return

    const dungeonRegions = WardenDungeonRegion.getAll()
    if (!dungeonRegions[0] || !anyPlayerNearRegion(dungeonRegions[0], 20)) return

    regions.forEach(e => ((e.ldb.selected = false), (e.ldb.cleaned = false), e.save()))

    const percent = 50
    const amount = Math.floor(regions.length * (percent / 100))

    const selectedRegions: WardenDungeonLootRegion[] = []
    while (selectedRegions.length <= amount) {
      const newRegion = regions.randomElement()
      regions = regions.filter(e => e !== newRegion)
      newRegion.ldb.selected = true
      console.log('Debris select', Vec.string(newRegion.area.center, false))
      selectedRegions.push(newRegion)
    }
  },
  'wardenDungeonUpdateLoot',
  fromMsToTicks(ms.from('min', 1)),
)

system.runInterval(
  () => {
    const regions = WardenDungeonLootRegion.getAll().slice()
    if (!regions.length) return

    const dungeonRegions = WardenDungeonRegion.getAll()
    if (!dungeonRegions[0] || !anyPlayerNearRegion(dungeonRegions[0], 20)) return

    for (const region of regions) {
      if (!anyPlayerNearRegion(region, 10)) continue

      if (!region.ldb.cleaned) {
        region.ldb.cleaned = true
        for (const location of region.ldb.blocks) {
          const block = region.dimension.getBlock(location)
          const container = block?.getComponent('inventory')?.container
          if (container) container.clearAll()
          block?.setType(MinecraftBlockTypes.Air)
        }
        region.ldb.blocks = []
        region.save()
      }

      if (!region.ldb.selected || region.ldb.blocks.length) continue

      let chest = false
      region.area.forEachVector((location, isIn) => {
        if (!isIn) return
        if (Vec.distance(location, region.area.center) > region.area.radius) return

        const below = region.dimension.getBlock(Vec.add(location, Vec.down))
        if (!below || below.isAir) return

        let chance = 50
        if (below.typeId === MinecraftBlockTypes.AncientDebris) chance -= 20
        else if (below.typeId === MinecraftBlockTypes.Chest) chance = 100

        if (!chest && rollChance(10)) {
          chest = true
          const block = region.dimension.getBlock(location)
          block?.setType(MinecraftBlockTypes.Chest)
          const container = block?.getComponent('inventory')?.container
          if (container) container.setItem(15, BaseItem.blueprint)
        } else {
          if (chance !== 100 && !rollChance(chance)) return
          region.dimension.setBlockType(location, MinecraftBlockTypes.AncientDebris)
        }
        region.ldb.blocks.push(location)
        region.save()
      }, 1000)
    }
  },
  'wardenDungeonUpdateLoot',
  fromMsToTicks(ms.from('sec', 3)),
)

const cmd = new Command('warden').setPermissions('techAdmin').executes(ctx => {
  ctx.player.teleport(WardenDungeonRegion.getAll()[0]?.area.center ?? ctx.player.location)
  ctx.reply('Tp to location')
})

const lootForm = form((f, { player }) => {
  f.title('loot')
  for (const region of WardenDungeonLootRegion.getAll().sort((a, b) =>
    a.ldb.selected && b.ldb.selected ? 0 : a.ldb.selected && !b.ldb.selected ? 1 : -1,
  )) {
    f.button((region.ldb.selected ? '§aA!§r ' : '') + region.area.toString(), () => {
      player.teleport(region.area.center)
    })
  }
})

cmd.overload('loot').executes(lootForm.command)
