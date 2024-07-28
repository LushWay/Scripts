import { world } from '@minecraft/server'
import { Cooldown, Settings } from 'lib'
import { Sounds } from 'lib/assets/config'
import { sendPacketToStdout } from 'lib/bds/api'
import { table } from 'lib/database/abstract'
import { getFullname } from 'lib/get-fullname'

class ChatBuilder {
  db = table<string>('chatCooldown')

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
    ranks: {
      name: 'Ранги в чате',
      description: 'Ранги в чате',
      value: true,
    },
  })

  playerSettings = Settings.player('Чат\n§7Звуки и внешний вид чата', 'chat', {
    hightlightMessages: {
      name: 'Подсветка моих сообщений',
      description: 'Если включено, вы будете видеть свои сообщения в чате так: §l§6Я: §r§fСообщение§r',
      value: true,
    },
    disableSound: {
      name: 'Выключение звука',
      description: 'Выключение звука чужих сообщений',
      value: false,
    },
  })

  // @ts-expect-error It is initialized
  private cooldown: Cooldown

  private updateCooldown() {
    this.cooldown = new Cooldown(this.settings.cooldown, true, this.db)
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
        const message = `${getFullname(event.sender, { nameColor: '§7' })}§r: ${messageText}`

        if (__SERVER__) {
          // This is handled/parsed by ServerCore
          // Dont really want to do request each time here
          sendPacketToStdout('chatMessage', {
            name: event.sender.name,
            role: getFullname(event.sender, { name: false }),
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
          doHightlight
            ? `${getFullname(event.sender, { name: false, nameSpacing: true })}§6§lЯ§r: §f${messageText}`
            : message,
        )
      } catch (error) {
        console.error(error)
      }
    }
  }
}

export const Chat = new ChatBuilder()
