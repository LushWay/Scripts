import { system, TicksPerSecond, world } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Achievement, CountingAchievement } from 'lib/achievements/achievement'
import { i18n, i18nShared } from 'lib/i18n/text'
import { Rewards } from 'lib/utils/rewards'
import { gravestoneEntityTypeId, gravestoneGetOwner } from 'modules/survival/death-quest-and-gravestone'

for (const num of [10, 100, 1000, 10000]) {
  CountingAchievement.createV()
    .value(num)
    .id(v => `woodchopper${v}`)
    .name(v => i18nShared`Дровосек: нарубите ${v} дерева`)
    .creator(ctx => {
      ctx.break(
        Object.values(MinecraftBlockTypes).filter(e => e.endsWith('_wood') || e.endsWith('_log')),
        player => ctx.add(player, 1),
      )
    })
    .reward(new Rewards().item(MinecraftBlockTypes.BirchWood, num / 10).money(num * 10))
}

for (const num of [100, 1000, 10000]) {
  CountingAchievement.createV()
    .value(num)
    .id(v => `miner${v}`)
    .name(v => i18nShared`Шахтер: накопайте ${v} камня`)
    .creator(ctx => {
      ctx.break(MinecraftBlockTypes.Stone, player => ctx.add(player, 1))
    })
    .reward(new Rewards().money(num * 10))
}

for (const num of [10, 100, 1000, 10000]) {
  CountingAchievement.createV()
    .value(num)
    .id(v => `minerCoal${v}`)
    .name(v => i18nShared`Угольный шахтер: накопайте ${v} угля`)
    .creator(ctx => {
      ctx.break(MinecraftBlockTypes.CoalOre, player => ctx.add(player, 1))
    })
    .reward(new Rewards().money(num * 10))
}

for (const num of [10, 100, 1000, 10000]) {
  CountingAchievement.createV()
    .value(num)
    .id(v => `minerIron${v}`)
    .name(v => i18nShared`Железный шахтер: накопайте ${v} железа`)
    .creator(ctx => {
      ctx.break(MinecraftBlockTypes.IronOre, player => ctx.add(player, 1))
    })
    .reward(new Rewards().money(num * 10))
}

Achievement.create()
  .id('activeCoal')
  .name(i18nShared`Активированный уголь`)
  .defaultStorage(() => undefined)
  .creator(ctx => {
    function toBlockFunction(leverDirection: string) {
      switch (leverDirection) {
        case 'south':
          return 'north'
        case 'north':
          return 'south'
        case 'west':
          return 'east'
        case 'east':
          return 'west'
        case 'below':
          return 'above'
        case 'above':
          return 'below'
        default:
          return 'above'
      }
    }

    world.afterEvents.leverAction.subscribe(event => {
      if (!event.isPowered || ctx.isDone(event.player)) return

      const leverDirection = event.block.permutation.getState('lever_direction')?.split('_')[0]
      if (!leverDirection) return

      const coalBlock = event.block[toBlockFunction(leverDirection)](1)
      if (!coalBlock?.isValid || coalBlock.typeId !== MinecraftBlockTypes.CoalBlock) return

      ctx.done(event.player)
    })
  })
  .reward(new Rewards().item(MinecraftBlockTypes.CoalBlock, 20))

Achievement.create()
  .id('madeMyself')
  .name(i18nShared`Сделал себя сам: Получи первые 10.000 монет`)
  .defaultStorage(() => undefined)
  .creator(ctx => {
    system.runPlayerInterval(
      player => {
        if (player.scores.money >= 10000) ctx.done(player)
      },
      'madeMyselfAchiev',
      TicksPerSecond * 10,
    )
  })

Achievement.create()
  .id('gravestoner')
  .name(i18nShared`Гробовщик: открой 10 могил разных игроков`)
  .defaultStorage(() => [] as string[])
  .creator(ctx => {
    world.afterEvents.playerInteractWithEntity.subscribe(event => {
      if (event.target.typeId !== gravestoneEntityTypeId || ctx.isDone(event.player)) return
      const owner = gravestoneGetOwner(event.target)
      if (!owner) return

      const storage = ctx.storage(event.player)
      if (!storage.includes(owner)) storage.push(owner)

      if (storage.length >= 10) ctx.done(event.player)
    })
  })
  .reward(new Rewards().item(MinecraftItemTypes.RoseBush, 1, i18n`Гробовщику посвящается`))
