import { system, TicksPerSecond, world } from '@minecraft/server'
import { Settings } from 'lib'
import { emoji } from 'lib/assets/emoji'

const socials = [
  [`${emoji.custom.socials.discord} §9Discord§7: §b§ldsc.gg/lushway`, 'discord'],
  [`${emoji.custom.socials.telegram} §bTelegram§7: §l§ft.me/lushway`, 'telegram', 'tg'],
  [`${emoji.custom.socials.twitch} §dTwitch§7: §f§ltwitch.tv/shp1natqp`, 'twitch'],
] as [string, string, ...string[]][]

for (const [text, command, ...aliases] of socials) {
  new Command(command)
    .setAliases(...aliases)
    .setDescription(text)
    .setPermissions('everybody')
    .executes(ctx => ctx.reply(text))
}

let interval = 0
const settings = Settings.world(...Settings.worldCommon, {
  socialAd: {
    name: 'Интервал рекламы соцсетей в чате (в минутах)',
    description: '0 чтобы отключить',
    value: 0,
    onChange() {
      if (settings.socialAd === 0) return interval && system.clearRun(interval)

      let i = 0
      interval = system.runInterval(
        () => {
          i++
          if (i >= socials.length) i = 0

          const social = socials[i]
          if (social) world.say(social[0])
        },
        'social ad',
        ~~(TicksPerSecond * 60 * settings.socialAd),
      )
    },
  },
})
