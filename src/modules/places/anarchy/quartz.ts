import { ItemStack, system } from '@minecraft/server'

import { MinecraftBlockTypes, MinecraftEffectTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { isKeyof, ms } from 'lib'
import { i18n } from 'lib/i18n/text'
import { RegionEvents } from 'lib/region/events'
import { actionGuard, ActionGuardOrder, disableAdventureNear, Region, RegionPermissions } from 'lib/region/index'
import { ScheduleBlockPlace } from 'lib/scheduled-block-place'
import { TechCity } from '../tech-city/tech-city'

export class QuartzMineRegion extends Region {
  protected priority = 100

  permissions: RegionPermissions = {
    doors: false,
    switches: false,
    gates: false,
    trapdoors: false,
    openContainers: false,
    pvp: false,
    allowedEntities: 'all',
    allowedAllItem: true,
    owners: [],
  }

  get displayName(): Text | undefined {
    return i18n.nocolor`Кварцевое озеро`
  }
}
disableAdventureNear.push(QuartzMineRegion)

const quartzTypeId = MinecraftBlockTypes.SmoothQuartz

const HoeEffectLevels: Record<string, number> = {
  [MinecraftItemTypes.WoodenHoe]: 2,
  [MinecraftItemTypes.StoneHoe]: 2,
  [MinecraftItemTypes.IronHoe]: 3,
  [MinecraftItemTypes.GoldenHoe]: 3,
  [MinecraftItemTypes.DiamondHoe]: 4,
  [MinecraftItemTypes.NetheriteHoe]: 4,
}

system.runPlayerInterval(
  player => {
    const { typeId } = player.mainhand()

    if (typeId && isKeyof(typeId, HoeEffectLevels)) {
      const inQuartzMine = RegionEvents.playerInRegionsCache
        .get(player)
        ?.some(e => e === TechCity.safeArea || e instanceof QuartzMineRegion)

      if (inQuartzMine) {
        player.addEffect(MinecraftEffectTypes.Haste, 2, {
          amplifier: HoeEffectLevels[typeId],
          showParticles: false,
        })
      }
    }
  },
  'quartz feature, hoe haste effect',
  2,
)

actionGuard((_, region, ctx) => {
  if (ctx.type !== 'break') return
  if (region !== TechCity.safeArea && !(region instanceof QuartzMineRegion)) return
  if (ctx.event.block.typeId !== quartzTypeId) return
  if (!ctx.event.itemStack?.typeId || !(ctx.event.itemStack.typeId in HoeEffectLevels)) return

  ScheduleBlockPlace.setBlock(ctx.event.block, ms.from('min', 2))

  system.delay(() => {
    ctx.event.dimension.spawnItem(new ItemStack(MinecraftItemTypes.Quartz), ctx.event.block.location)
  })

  return true
}, ActionGuardOrder.Feature)
