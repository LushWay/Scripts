import { GameMode, system } from '@minecraft/server'
import { Airdrop, Compass, Join, prompt } from 'lib'
import { Quest } from 'lib/quest'
import { Anarchy } from 'modules/places/anarchy/anarchy'
import { Spawn } from 'modules/places/spawn'
import { updateBuilderStatus } from 'modules/world-edit/builder'

new Command('wipe')
  .setDescription('Очищает все данные (для тестов)')
  .setPermissions('tester')
  .executes(ctx => {
    prompt(
      ctx.player,
      'Вы уверены, что хотите очистить инвентарь анархии и ваше место? Полезно для тестирования обучения.',
      '§cДа',
      () => {
        ctx.player.setGameMode(GameMode.survival)
        updateBuilderStatus(ctx.player)

        delete ctx.player.database.survival.rtpElytra

        ctx.player.database.quests?.active.forEach(e => Quest.quests.get(e.id)?.exit(ctx.player))
        delete ctx.player.database.quests

        Compass.setFor(ctx.player, undefined)
        Airdrop.instances.filter(a => a.for === ctx.player.id).forEach(a => a.delete())

        delete ctx.player.database.survival.anarchy
        Anarchy.inventoryStore.remove(ctx.player.id)
        Spawn.loadInventory(ctx.player)
        Spawn.portal?.teleport(ctx.player)
        ctx.player.scores.money = 0
        ctx.player.scores.anarchyOnlineTime = 0
        ctx.player.database.survival.newbie = 1

        system.runTimeout(
          () => {
            Join.emitFirstJoin(ctx.player)
          },
          'clear',
          30,
        )
      },
    )
  })
