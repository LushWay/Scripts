import { ItemStack, system } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftEffectTypes, MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { actionGuard } from 'lib/Region/index.js'
import { TechCity } from 'modules/Survival/Place/TechCity.js'
import { scheduleBlockPlace } from 'modules/Survival/utils/scheduledBlockPlace.js'
import { withState } from 'modules/WorldEdit/utils/blocksSet.js'
import { util } from 'smapi.js'

const [quartzTypeId, states] = withState(MinecraftBlockTypes.QuartzBlock, {
  chisel_type: 'smooth',
})

/** @type {Record<string, number>} */
const HoeEffectLevels = {
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
    if (typeId && typeId in HoeEffectLevels) {
      player.addEffect(MinecraftEffectTypes.Haste, 2, {
        amplifier: HoeEffectLevels[typeId],
        showParticles: false,
      })
    }
  },
  'quartz feature, hoe haste effect',
  2
)

actionGuard((player, region, ctx) => {
  // TODO Maybe allow breaking quartz outside of the region
  if (
    ctx.type !== 'break' ||
    region !== TechCity.safeArea ||
    // Check block
    ctx.event.block.typeId !== quartzTypeId ||
    ctx.event.block.permutation.getState('chisel_type') !== 'smooth' ||
    // Check item
    !ctx.event.itemStack?.typeId ||
    !(ctx.event.itemStack?.typeId in HoeEffectLevels)
  )
    return

  scheduleBlockPlace({
    dimension: ctx.event.dimension.type,
    location: ctx.event.block.location,
    typeId: ctx.event.block.typeId,
    states: ctx.event.block.permutation.getAllStates(),
    restoreTime: util.ms.from('min', 2),
  })

  system.delay(() => {
    ctx.event.dimension.spawnItem(new ItemStack(MinecraftItemTypes.Quartz), ctx.event.block.location)
  })

  return true
})
