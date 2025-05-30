import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Rewards } from 'lib/shop/rewards'
import { Achievement, CountingAchievement } from './achievement'
import { world } from '@minecraft/server'
import { isKeyof } from 'lib/util'

for (const num of [10, 100, 1000, 10000]) {
  CountingAchievement.createV()
    .value(num)
    .id(v => `woodchopper${v}`)
    .name(v => `Дровосек: нарубите ${v} дерева`)
    .creator(ctx => {
      ctx.break(
        Object.values(MinecraftBlockTypes).filter(e => e.endsWith('_wood') || e.endsWith('_log')),
        player => ctx.diff(player, 1),
      )
    })
    .reward(new Rewards().item(MinecraftBlockTypes.BirchWood, num / 10).money(num * 10))
}

for (const num of [100, 1000, 10000]) {
  CountingAchievement.createV()
    .value(num)
    .id(v => `miner${v}`)
    .name(v => `Шахтер: накопайте ${v} камня`)
    .creator(ctx => {
      ctx.break(MinecraftBlockTypes.Stone, player => ctx.diff(player, 1))
    })
    .reward(new Rewards().money(num * 10))
}

for (const num of [10, 100, 1000, 10000]) {
  CountingAchievement.createV()
    .value(num)
    .id(v => `minerCoal${v}`)
    .name(v => `Угольный шахтер: накопайте ${v} угля`)
    .creator(ctx => {
      ctx.break(MinecraftBlockTypes.CoalOre, player => ctx.diff(player, 1))
    })
    .reward(new Rewards().money(num * 10))
}

for (const num of [10, 100, 1000, 10000]) {
  CountingAchievement.createV()
    .value(num)
    .id(v => `minerIron${v}`)
    .name(v => `Железный шахтер: накопайте ${v} железа`)
    .creator(ctx => {
      ctx.break(MinecraftBlockTypes.IronOre, player => ctx.diff(player, 1))
    })
    .reward(new Rewards().money(num * 10))
}

Achievement.create()
  .id('activeCoal')
  .name('Активированный уголь')
  .defaultStorage(() => undefined)
  .creator(ctx => {
    const directions = {
      north: 'south',
      south: 'north',
      east: 'west',
      west: 'east',
      up: 'below',
      down: 'above',
    } as const

    world.afterEvents.leverAction.subscribe(event => {
      console.log(event.isPowered)
      if (!event.isPowered) return

      const leverDirection = event.block.permutation.getState('lever_direction')?.split('_')[0]
      if (!leverDirection || !isKeyof(leverDirection, directions)) return

      const coalBlock = event.block[directions[leverDirection]](1)
      if (!coalBlock?.isValid || coalBlock.typeId !== MinecraftBlockTypes.CoalBlock) return

      ctx.done(event.player)
    })
  })
  .reward(new Rewards().item(MinecraftBlockTypes.CoalBlock, 20))
