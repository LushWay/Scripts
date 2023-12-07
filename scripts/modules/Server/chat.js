import { world } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { Cooldown, ROLES, Settings, getRole, util } from 'smapi.js'
import { CONFIG } from '../../config.js'

const SETTINGS = Settings.world('chat', {
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

/** @type {DynamicPropertyDB<string, string>} */
const COOLDOWN_PROPERTY = new DynamicPropertyDB('chat')
const COOLDOWN_DB = COOLDOWN_PROPERTY.proxy()

const PLAYER_OPTIONS = Settings.player('Чат', 'chat', {
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

world.afterEvents.chatSend.subscribe(data => {
  if (
    data.message.startsWith(CONFIG.commandPrefix) &&
    data.message !== CONFIG.commandPrefix
  )
    return

  try {
    const cooldown = SETTINGS.cooldown

    // Is cooldown enabled?
    if (cooldown) {
      const cool = new Cooldown(COOLDOWN_DB, 'CLDW', data.sender, cooldown)

      if (cool.statusTime !== 'EXPIRED') {
        // Player is under chat cooldown, show error message
        const time = Cooldown.getRemainingTime(cooldown - Date.now())
        return data.sender.tell(
          `§c► Подожди еще §b${time.parsedTime}§c ${time.type}`
        )
      }
    }

    const playerRole = getRole(data.sender)

    let role = ''
    if (SETTINGS.ranks && playerRole !== 'member') {
      role = ' ' + ROLES[playerRole]
    }

    const allPlayers = world.getAllPlayers()

    // Players that are near message sender
    const nearPlayers = data.sender.dimension
      .getPlayers({
        location: data.sender.location,
        maxDistance: SETTINGS.range,
      })
      .filter(e => e.id !== data.sender.id)

    // Array with ranged players (include sender id)
    const nID = nearPlayers.map(e => e.id)
    nID.push(data.sender.id)

    // Outranged players
    const otherPlayers = allPlayers.filter(e => !nID.includes(e.id))

    for (const n of nearPlayers) {
      const message = `${role}§7${data.sender.name}§r: ${data.message}`
      n.tell(message)
      if (util.settings.BDSMode) console.info(message)

      if (!PLAYER_OPTIONS(n).disableSound) n.playSound(SOUNDS.click)
    }

    for (const o of otherPlayers)
      o.tell(`${role}§8${data.sender.name}§7: ${data.message}`)

    const hightlight = PLAYER_OPTIONS(data.sender).hightlightMessages
    data.sender.tell(
      !hightlight
        ? `${role ? role + ' ' : ''}§7${data.sender.name}§r: ${data.message}`
        : `§6§lЯ§r: §f${data.message.replace(/\\n/g, '\n')}`
    )
  } catch (error) {
    util.error(error)
  }
})
