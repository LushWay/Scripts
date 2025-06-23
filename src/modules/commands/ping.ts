import { system } from '@minecraft/server'
import { t } from 'lib/text'

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
  .setDescription(t`Показывает пинг сервера`)
  .setPermissions('member')
  .executes(async ctx => {
    ctx.player.info(t`Понг! Проверяем...`)
    const ticks = await getServerTPS()

    ctx.player.info(
      t`TPS сервера ${ticks > 18 ? t`§aхороший` : ticks > 13 ? t`§gнормальный` : t`§cплохой`}§f: ${ticks}`,
    )
  })
