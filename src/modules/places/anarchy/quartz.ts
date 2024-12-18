import { ItemStack, system } from '@minecraft/server'

import { MinecraftBlockTypes, MinecraftEffectTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { isKeyof, ms } from 'lib'
import { actionGuard, ActionGuardOrder } from 'lib/region/index'
import { TechCity } from 'modules/places/tech-city/tech-city'
import { scheduleBlockPlace } from 'modules/survival/scheduled-block-place'

const quartzTypeId = MinecraftBlockTypes.ChiseledQuartzBlock

const HoeEffectLevels: Record<string, number> = {
  [MinecraftItemTypes.WoodenHoe]: 1,
  [MinecraftItemTypes.StoneHoe]: 1,
  [MinecraftItemTypes.IronHoe]: 2,
  [MinecraftItemTypes.GoldenHoe]: 2,
  [MinecraftItemTypes.DiamondHoe]: 3,
  [MinecraftItemTypes.NetheriteHoe]: 3,
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
    region !== TechCity.safeArea ||
    // Check block

    ctx.event.block.typeId !== quartzTypeId ||
    // Check item

    !ctx.event.itemStack?.typeId ||
    !(ctx.event.itemStack.typeId in HoeEffectLevels)
  )
    return

  scheduleBlockPlace({
    dimension: ctx.event.dimension.type,
    location: ctx.event.block.location,
    typeId: ctx.event.block.typeId,
    states: ctx.event.block.permutation.getAllStates(),
    restoreTime: ms.from('min', 2),
  })

  system.delay(() => {
    ctx.event.dimension.spawnItem(new ItemStack(MinecraftItemTypes.Quartz), ctx.event.block.location)
  })

  return true
}, ActionGuardOrder.Feature)
