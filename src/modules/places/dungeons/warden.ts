import { system } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import {
  actionGuard,
  ActionGuardOrder,
  fromMsToTicks,
  ms,
  Region,
  RegionPermissions,
  registerRegionType,
  registerSaveableRegion,
} from 'lib'
import { i18n, noI18n } from 'lib/i18n/text'
import { anyPlayerNearRegion } from 'lib/player-move'
import { ScheduleBlockPlace } from 'lib/scheduled-block-place'
import { createLogger } from 'lib/utils/logger'

// TODO Add chest generation
const logger = createLogger('warden')

class WardenDungeonRegion extends Region {
  protected priority = 3

  get displayName(): Text | undefined {
    return i18n.nocolor`§5Варден`
  }
}
registerSaveableRegion('wardenDungeon', WardenDungeonRegion)
registerRegionType(noI18n`Данж вардена`, WardenDungeonRegion)

interface LinkedDatabase extends JsonObject {
  blocks: { x: number; y: number; z: number }[]
}

class WardenDungeonLootRegion extends Region {
  protected priority = 4
  get displayName(): Text | undefined {
    return i18n.nocolor`§dНезеритовая жила`
  }
  ldb: LinkedDatabase = { blocks: [] }

  protected defaultPermissions: RegionPermissions = {
    allowedAllItem: true,
    allowedEntities: 'all',

    doors: true,
    gates: true,
    pvp: true,
    switches: true,
    trapdoors: true,

    owners: [],
    openContainers: false,
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
registerRegionType(noI18n`Лут данжа вардена`, WardenDungeonLootRegion)

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
    const regions = WardenDungeonLootRegion.getAll()
    if (!regions.length) return

    const dungeonRegions = WardenDungeonRegion.getAll()
    if (!dungeonRegions[0] || !anyPlayerNearRegion(dungeonRegions[0], 20)) return

    const placedBefore = regions.find(e => !!e.ldb.blocks.length)

    if (placedBefore) {
      for (const location of placedBefore.ldb.blocks) {
        if (!ScheduleBlockPlace.deleteAt(location, placedBefore.dimensionType))
          ScheduleBlockPlace.setAir(location, placedBefore.dimensionType, 0)
      }
      placedBefore.ldb.blocks = []
      placedBefore.save()
    }

    const newRegion = regions.randomElement()
    newRegion.area.forEachVector((location, isIn) => {
      if (!isIn) return
      if (Math.randomInt(0, 2) === 1) return

      ScheduleBlockPlace.set({
        restoreTime: 0,
        dimension: newRegion.dimensionType,
        typeId: MinecraftBlockTypes.AncientDebris,
        location,
      })
      newRegion.ldb.blocks.push(location)
      newRegion.save()
    }, 1000)
  },
  'wardenDungeonUpdateLoot',
  fromMsToTicks(ms.from('min', 1)),
)
