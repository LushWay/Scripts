import { GameMode, system } from '@minecraft/server'
import { Airdrop, Compass, Join, prompt } from 'lib'
import { Quest } from 'lib/quest'
import { Anarchy } from 'modules/places/anarchy'
import { Spawn } from 'modules/places/spawn'

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

        delete ctx.player.database.survival.bn
        delete ctx.player.database.survival.rtpElytra

        ctx.player.database.quests?.active.forEach(e => Quest.quests.get(e.id)?.exit(ctx.player))
        delete ctx.player.database.quests

        Compass.setFor(ctx.player, undefined)
        Anarchy.inventoryStore.remove(ctx.player.id)
        ctx.player.database.inv = 'anarchy'
        Spawn.switchInventory(ctx.player)
        Spawn.portal?.teleport(ctx.player)
        Anarchy.inventoryStore.remove(ctx.player.id)
        Airdrop.instances.filter(a => a.for === ctx.player.id).forEach(a => a.delete())

        system.runTimeout(
          () => {
            delete ctx.player.database.survival.anarchy
            Join.emitFirstJoin(ctx.player)
          },
          'clear',
          30,
        )
      },
    )
  })
