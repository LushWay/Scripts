import { system } from '@minecraft/server'

/** @returns {Promise<number>} */
async function getServerTPS() {
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

// @ts-expect-error TS(2304) FIXME: Cannot find name 'Command'.
new Command('ping')
  .setDescription('Показывает пинг сервера')
  .setPermissions('member')
  .executes(async ctx => {
    ctx.reply('§b> §3Понг! Проверяем...')
    const ticks = await getServerTPS()

    // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
    ctx.reply(`§b> §3TPS сервера ${ticks > 18 ? '§aхороший' : ticks > 13 ? '§gнормальный' : '§cплохой'}§f: ${ticks}`)
  })
