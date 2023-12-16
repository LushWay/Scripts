import { world } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { Cooldown, ROLES, Settings, getRole, util } from 'smapi.js'
import { CONFIG } from '../../config.js'

export class ChatBuilder {
  db = new DynamicPropertyDB('chat', { /** @type {Record<string, string} */ type: {} }).proxy()
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
    world.afterEvents.chatSend.subscribe(data => {
      if (data.message.startsWith(CONFIG.commandPrefix) && data.message !== CONFIG.commandPrefix) return

      try {
        const cooldown = this.settings.cooldown

        // Is cooldown enabled?
        if (cooldown) {
          const cool = new Cooldown(this.db, 'CD', data.sender, cooldown)

          // Player is under chat cooldown, show error message
          if (cool.isExpired()) return
          cool.update()
        }

        const playerRole = getRole(data.sender)

        let role = ''
        if (this.settings.ranks && playerRole !== 'member') {
          role = ROLES[playerRole] + ' '
        }

        const allPlayers = world.getAllPlayers()

        // Players that are near message sender
        const nearPlayers = data.sender.dimension
          .getPlayers({
            location: data.sender.location,
            maxDistance: this.settings.range,
          })
          .filter(e => e.id !== data.sender.id)

        // Array with ranged players (include sender id)
        const nID = nearPlayers.map(e => e.id)
        nID.push(data.sender.id)

        // Outranged players
        const otherPlayers = allPlayers.filter(e => !nID.includes(e.id))
        const messageText = data.message.replace(/\\n/g, '\n')
        const message = `${role}§7${data.sender.name}§r: ${messageText}`
        if (util.settings.BDSMode) console.info(message)

        for (const near of nearPlayers) {
          near.tell(message)

          if (!this.playerSettings(near).disableSound) near.playSound(SOUNDS.click)
        }

        for (const outranged of otherPlayers) outranged.tell(`${role}§8${data.sender.name}§7: ${messageText}`)

        const hightlight = this.playerSettings(data.sender).hightlightMessages
        data.sender.tell(hightlight ? `§6§lЯ§r: §f${messageText}` : message)
      } catch (error) {
        util.error(error)
      }
    })
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Chat = new ChatBuilder()
