import { world } from '@minecraft/server'
import { Cooldown, Settings } from 'lib'
import { Sounds } from 'lib/assets/custom-sounds'
import { sendPacketToStdout } from 'lib/bds/api'
import { table } from 'lib/database/abstract'
import { getFullname } from 'lib/get-fullname'
import { i18n } from 'lib/i18n/text'

class ChatBuilder {
  db = table<Record<string, number>>('chatCooldown', () => ({}))

  settings = Settings.world(...Settings.worldCommon, {
    cooldown: {
      name: 'Задержка чата',
      description: '0 что бы отключить',
      value: 0,
      onChange: () => this.updateCooldown(),
    },
    range: {
      name: 'Радиус чата',
      description: 'Радиус для затемнения сообщений дальних игроков',
      value: 30,
    },
    role: {
      name: 'Роли в чате',
      value: true,
    },
    armorAndSword: {
      name: 'Эмодзи уровня экипировки в чате',
      value: true,
    },
  })

  playerSettings = Settings.player(i18n`Чат\n§7Звуки и внешний вид чата`, 'chat', {
    hightlightMessages: {
      name: i18n`Подсветка моих сообщений`,
      description: i18n`Если включено, вы будете видеть свои сообщения в чате так: §l§6Я: §r§fСообщение§r`,
      value: true,
    },
    disableSound: {
      name: i18n`Выключение звука`,
      description: i18n`Выключение звука чужих сообщений`,
      value: false,
    },
  })

  // @ts-expect-error It is initialized
  private cooldown: Cooldown

  private updateCooldown() {
    this.cooldown = new Cooldown(this.settings.cooldown, true, this.db.get('cooldown'))
  }

  constructor() {
    this.updateCooldown()
    Command.chatSendListener = event => {
      if (Command.isCommand(event.message)) return

      try {
        if (!this.cooldown.isExpired(event.sender)) return

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
        const messageText = event.message.replace(/\\n/g, '\n')
        const message = `${getFullname(event.sender, { nameColor: '§7', equippment: this.settings.armorAndSword })}§r: ${messageText}`
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
          if (!this.playerSettings(near).disableSound) near.playSound(Sounds.Click)
        }

        for (const outranged of otherPlayers) {
          outranged.tell(`${getFullname(event.sender, { nameColor: '§8' })}§7: ${messageText}`)
        }

        const doHightlight = this.playerSettings(event.sender).hightlightMessages
        event.sender.tell(
          doHightlight ? i18n.nocolor`${fullrole ? fullrole + ' ' : fullrole}§6§lЯ§r: §f${messageText}` : message,
        )
      } catch (error) {
        console.error(error)
      }
    }
  }
}

export const Chat = new ChatBuilder()
