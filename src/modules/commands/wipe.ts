import { system } from '@minecraft/server'
import { Airdrop, prompt } from 'lib'
import { Join } from 'lib/player-join'
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
        ctx.player.runCommand('gamemode s')

        delete ctx.player.database.survival.bn
        delete ctx.player.database.survival.rtpElytra
        delete ctx.player.database.quests

        Anarchy.inventoryStore.remove(ctx.player.id)
        ctx.player.database.inv = 'anarchy'
        Spawn.loadInventory(ctx.player)
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
