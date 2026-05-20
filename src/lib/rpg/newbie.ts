import { Player } from '@minecraft/server'
import { ask } from 'lib/form/message'
import { i18n } from 'lib/i18n/text'
import { createLogger } from 'lib/utils/logger'

const logger = createLogger('Newbie')

export function isNewbie(player: Player) {
  return !!player.database.survival.newbie
}

export function enterNewbieMode(player: Player) {
  player.database.survival.newbie = 1
}

function exitNewbieMode(player: Player, reason: Text) {
  if (!isNewbie(player)) return

  player.warn(i18n.warn`Вы ${reason}, поэтому вышли из режима новичка.`)
  delete player.database.survival.newbie

  logger.player(player).info`Exited newbie mode because ${reason}`
}

export function askForExitingNewbieMode(
  player: Player,
  reason: Text,
  callback: VoidFunction,
  back: VoidFunction = () => player.success(i18n`Успешно отменено`),
) {
  if (!isNewbie(player)) return callback()

  ask(
    player,
    i18n`Если вы совершите это действие, вы потеряете статус новичка:
 - Другие игроки смогут наносить вам урон
 - Другие игроки смогут забирать ваш лут после смерти`,
    i18n.error`Я больше не новичок`,
    () => {
      exitNewbieMode(player, reason)
      callback()
    },
    i18n`НЕТ, НАЗАД`,
    back,
  )
}

new Command('newbie')
  .setPermissions('member')
  .setDescription(i18n`Используйте, чтобы выйти из режима новичка`)
  .executes(ctx => {
    if (isNewbie(ctx.player)) {
      askForExitingNewbieMode(ctx.player, i18n`использовали команду`, () => void 0)
    } else return ctx.error(i18n`Вы не находитесь в режиме новичка.`)
  })
  .overload('set')
  .setPermissions('techAdmin')
  .setDescription(i18n`Вводит в режим новичка`)
  .executes(ctx => {
    enterNewbieMode(ctx.player)
    ctx.player.success()
  })

// const newbieTime = ms.from('hour', 2)

// system.runPlayerInterval(player => {
//   if (isNewbie(player) && player.scores.anarchyOnlineTime * 2.5 > newbieTime)
//     exitNewbieMode(player, i18n.warn`провели на анархии больше 2 часов`)
// }, 'newbie mode exit')
