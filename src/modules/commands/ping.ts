import { system } from '@minecraft/server'
import { i18n } from 'lib/i18n/text'

async function getServerTPS(): Promise<number> {
  const startTime = Date.now()
  let ticks = 0
  return new Promise(resolve => {
    system.run(function tick() {
      if (Date.now() - startTime < 1000) {
        ticks++
        system.run(tick)
      } else {
        resolve(ticks)
      }
    })
  })
}

new Command('ping')
  .setDescription(i18n`Показывает пинг сервера`)
  .setPermissions('member')
  .executes(async ctx => {
    ctx.player.info(i18n`Понг! Проверяем...`)
    const ticks = await getServerTPS()

    ctx.player.info(
      i18n`TPS сервера ${ticks > 18 ? i18n`§aхороший` : ticks > 13 ? i18n`§gнормальный` : i18n`§cплохой`}§f: ${ticks}`,
    )
  })
