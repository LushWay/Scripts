import { world } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { Cooldown, Settings, getRoleAndName, util } from 'lib.js'
import { sendPacketToStdout } from 'lib/BDS/api.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'

export class ChatBuilder {
  db = new DynamicPropertyDB('chatCD', { /** @type {Record<string, string} */ type: {} }).proxy()
  settings = Settings.world('chat', {
    cooldown: {
      name: 'Задержка',
      desc: '0 что бы отключить',
      value: 0,
    },
    range: {
      name: 'Радиус',
      desc: 'Радиус для затемнения сообщений дальних игроков',
      value: 30,
    },
    ranks: { desc: 'Ранги в чате', value: true, name: 'Ранги' },
  })
  playerSettings = Settings.player('Чат', 'chat', {
    hightlightMessages: {
      name: 'Подсветка моих сообщений',
      desc: 'Если включено, вы будете видеть свои сообщения в чате так: §l§6Я: §r§fСообщение§r',
      value: true,
    },
    disableSound: {
      name: 'Выключение звука',
      desc: 'Выключение звука чужих сообщений',
      value: false,
    },
  })

  constructor() {
    world.afterEvents.chatSend.subscribe(event => {
      if (Command.isCommand(event.message)) return

      try {
        const cooldownTime = this.settings.cooldown
        if (cooldownTime > 0) {
          const cooldown = new Cooldown(this.db, 'CD', event.sender, this.settings.cooldown)

          // Player is under chat cooldown, show error message
          if (cooldown.tellIfExpired()) return
          cooldown.update()
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
        const messageText = event.message.replace(/\\n/g, '\n')
        const message = `${getRoleAndName(event.sender, { nameColor: '§7' })}§r: ${messageText}`

        if (util.settings.BDSMode) {
          // This is handled/parsed by ServerCore
          // Dont really want to do APICall each time here
          sendPacketToStdout('chatMessage', {
            name: event.sender.name,
            role: getRoleAndName(event.sender, { name: false }),
            print: message,
            message: messageText,
          })
        }

        for (const near of nearPlayers) {
          near.tell(message)
          if (!this.playerSettings(near).disableSound) near.playSound(SOUNDS.click)
        }

        for (const outranged of otherPlayers) {
          outranged.tell(`${getRoleAndName(event.sender, { nameColor: '§8' })}§7: ${messageText}`)
        }

        const doHightlight = this.playerSettings(event.sender).hightlightMessages
        event.sender.tell(doHightlight ? `§6§lЯ§r: §f${messageText}` : message)
      } catch (error) {
        util.error(error)
      }
    })
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Chat = new ChatBuilder()
