import { world } from '@minecraft/server'
import { Sounds } from 'lib/assets/custom-sounds'
import { sendPacketToStdout } from 'lib/bds/api'
import { Cooldown } from 'lib/cooldown'
import { table } from 'lib/database/abstract'
import { getFullname } from 'lib/get-fullname'
import { i18n, noI18n } from 'lib/i18n/text'
import { Settings } from 'lib/settings'
import { muteInfo } from './mute'

export class Chat {
  static muteDb = table<{ mutedUntil: number; reason?: string }>('chatMute')

  static settings = Settings.world(...Settings.worldCommon, {
    cooldown: {
      name: 'Задержка чата (миллисекунды)',
      description: '0 что бы отключить',
      value: 0,
      onChange: () => this.updateCooldown(),
    },
    range: {
      name: 'Радиус чата',
      description: 'Радиус для скрытия сообщений дальних игроков',
      value: 30,
    },
    capsLimit: {
      name: 'Макс больших букв в сообщении',
      description: 'Не разрешает отправлять сообщения где слишком много капса',
      value: 5,
    },
    role: {
      name: 'Роли в чате',
      value: true,
    },
  })

  static playerSettings = Settings.player(i18n`Чат\n§7Звуки и внешний вид чата`, 'chat', {
    sound: {
      name: i18n`Звук`,
      description: i18n`Звука сообщений от игроков поблизости`,
      value: true,
    },
  })

  private static cooldown: Cooldown

  private static updateCooldown() {
    this.cooldown = new Cooldown(this.settings.cooldown, true, {})
  }

  static {
    this.updateCooldown()
    Command.chatSendListener = event => {
      if (Command.isCommand(event.message)) return

      try {
        if (!this.cooldown.isExpired(event.sender)) return
        const player = event.sender

        if (!this.cooldown.isExpired(event.sender)) {
          console.log('Spam chat', player.name, event.message)
          return
        }

        const mute = this.muteDb.getImmutable(event.sender.id)
        if (mute) {
          if (mute.mutedUntil > Date.now()) {
            console.log('Muted chat', player.name, event.message)
            return muteInfo(player, mute)
          }
        }

        const messageText = event.message.replace(/\\n/g, '\n').replace(/§./g, '').trim()

        const caps = messageText.split('').reduce((p, c) => (c === c.toUpperCase() ? p + 1 : p), 0)
        if (caps > this.settings.capsLimit) {
          return event.sender.fail(noI18n.error`В сообщении слишком много капса (${caps}/${this.settings.capsLimit})`)
        }

        const allPlayers = world.getAllPlayers()

        // Players that are near message sender
        const nearPlayers = event.sender.dimension
          .getPlayers({
            location: event.sender.location,
            maxDistance: this.settings.range,
          })
          .filter(e => e.id !== event.sender.id)

        // Array with ranged players (include sender id)
        const nID = nearPlayers.map(e => e.id)
        nID.push(event.sender.id)

        // Outranged players
        const otherPlayers = allPlayers.filter(e => !nID.includes(e.id))
        const message = `${getFullname(event.sender, { nameColor: '§7', equippment: true })}§r: ${messageText}`
        const fullrole = getFullname(event.sender, { name: false })

        if (__SERVER__) {
          // This is handled/parsed by ServerCore
          // Dont really want to do request each time here
          sendPacketToStdout('chatMessage', {
            name: event.sender.name,
            role: fullrole,
            print: message,
            message: messageText,
          })
        }

        for (const near of nearPlayers) {
          near.tell(message)
          if (this.playerSettings(near).sound) near.playSound(Sounds.Click)
        }

        for (const outranged of otherPlayers) {
          outranged.tell(`${getFullname(event.sender, { nameColor: '§8' })}§7: ${messageText}`)
        }

        event.sender.tell(message)
      } catch (error) {
        console.error(error)
      }
    }
  }
}
