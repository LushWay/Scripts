import { system } from '@minecraft/server'
import { Join } from 'modules/PlayerJoin/playerJoin.js'
import { Anarchy } from 'modules/Survival/Place/Anarchy.js'
import { Spawn } from 'modules/Survival/Place/Spawn.js'
import { Airdrop, EventSignal, prompt } from 'smapi.js'

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
