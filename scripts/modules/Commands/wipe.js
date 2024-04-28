import { system } from '@minecraft/server'
import { Airdrop, prompt } from 'lib.js'
import { Join } from 'lib/PlayerJoin.js'
import { Anarchy } from 'modules/Places/Anarchy.js'
import { Spawn } from 'modules/Places/Spawn.js'

new Command({
  name: 'wipe',
  description: 'Очищает все данные (для тестов)',
  role: 'tester',
}).executes(ctx => {
  prompt(
    ctx.sender,
    'Вы уверены, что хотите очистить инвентарь анархии и ваше место? Полезно для тестирования обучения.',
    '§cДа',
    () => {
      ctx.sender.runCommand('gamemode s')

      delete ctx.sender.database.survival.bn
      delete ctx.sender.database.survival.rtpElytra
      delete ctx.sender.database.quests

      Anarchy.inventoryStore.remove(ctx.sender.id)
      ctx.sender.database.inv = 'anarchy'
      Spawn.loadInventory(ctx.sender)
      Spawn.portal?.teleport(ctx.sender)
      Anarchy.inventoryStore.remove(ctx.sender.id)

      Airdrop.instances.filter(a => a.for === ctx.sender.id).forEach(a => a.delete())

      system.runTimeout(
        () => {
          delete ctx.sender.database.survival.anarchy
          Join.emitFirstJoin(ctx.sender)
        },
        'clear',
        30,
      )
    },
    'Отмена',
    () => {},
  )
})
