import { ItemStack, system } from '@minecraft/server'

import { MinecraftBlockTypes, MinecraftEffectTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { isKeyof, ms } from 'lib'
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

  get displayName(): string | undefined {
    return 'Озеро Технограда'
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

    // TODO Maybe check for region or inv type
    if (typeId && isKeyof(typeId, HoeEffectLevels)) {
      player.addEffect(MinecraftEffectTypes.Haste, 2, {
        amplifier: HoeEffectLevels[typeId],
        showParticles: false,
      })
    }
  },
  'quartz feature, hoe haste effect',
  2,
)

actionGuard((player, region, ctx) => {
  if (
    ctx.type !== 'break' ||
    (region !== TechCity.safeArea && !(region instanceof QuartzMineRegion)) ||
    // Check block
    ctx.event.block.typeId !== quartzTypeId ||
    // Check item
    !ctx.event.itemStack?.typeId ||
    !(ctx.event.itemStack.typeId in HoeEffectLevels)
  )
    return

  ScheduleBlockPlace.setBlock(ctx.event.block, ms.from('min', 2))

  system.delay(() => {
    ctx.event.dimension.spawnItem(new ItemStack(MinecraftItemTypes.Quartz), ctx.event.block.location)
  })

  return true
}, ActionGuardOrder.Feature)
