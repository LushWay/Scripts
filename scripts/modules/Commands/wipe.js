import { system } from '@minecraft/server'
import { Airdrop, EventSignal, prompt } from 'lib.js'
import { Anarchy } from 'modules/Places/Anarchy.js'
import { Spawn } from 'modules/Places/Spawn.js'
import { Join } from 'modules/PlayerJoin/playerJoin.js'

new Command({
  name: 'wipe',
  description: 'Очищает все данные (для тестеров)',
}).executes(ctx => {
  prompt(
    ctx.sender,
    'Вы уверены, что хотите очистить инвентарь анархии и ваше место?',
    'ДА',
    () => {
      ctx.sender.runCommand('gamemode s')

      delete ctx.sender.database.survival.bn
      delete ctx.sender.database.survival.rtpElytra
      delete ctx.sender.database.quest
      Spawn.portal?.teleport(ctx.sender)
      Anarchy.inventoryStore.remove(ctx.sender.id)
      Airdrop.instances.filter(a => a.for === ctx.sender.id).forEach(a => a.delete())
      system.runTimeout(
        () => {
          delete ctx.sender.database.survival.anarchy
          EventSignal.emit(Join.onMoveAfterJoin, { player: ctx.sender, joinCounts: 1, firstJoin: true })
        },
        'clear',
        30
      )
    },
    'Нет',
    () => {}
  )
})
