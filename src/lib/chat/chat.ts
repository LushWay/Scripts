import { ChatSendBeforeEvent, Player, system, world } from '@minecraft/server'
import { Cooldown } from 'lib/cooldown'
import { table } from 'lib/database/abstract'
import { i18n, noI18n } from 'lib/i18n/text'
import { Settings } from 'lib/settings'
import { msold } from 'lib/utils/ms-old'
import './command'

export declare namespace Chat {
  interface MuteInfo {
    mutedUntil: number
    reason?: string
  }

  interface Context {
    sender: Player
    text: string
    nearPlayers: Player[]
    farPlayers: Player[]
  }
}

export abstract class Chat {
  private static instance?: Chat

  static getInstance(): Chat {
    if (!this.instance) throw new Error('Chat.getInstance: Chat is not configured!')
    return this.instance
  }

  muteDb = table<Chat.MuteInfo>('chatMute')

  settings = Settings.world(...Settings.worldCommon, {
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

  playerSettings = Settings.player(i18n`Чат\n§7Звуки и внешний вид чата`, 'chat', {
    sound: {
      name: i18n`Звук`,
      description: i18n`Звука сообщений от игроков поблизости`,
      value: true,
    },
  })

  private cooldown!: Cooldown

  private updateCooldown() {
    this.cooldown = new Cooldown(this.settings.cooldown, true, {})
  }

  informAboutMute(player: Player, mute: Chat.MuteInfo): void {
    const timeText = msold.remaining(mute.mutedUntil - Date.now())

    return player.fail(
      noI18n.error`Вы замьючены в чате на ${timeText.value} ${timeText.type} по причине: ${mute.reason}`,
    )
  }

  registerChatListener() {
    world.beforeEvents.chatSend.subscribe(this.chatListener)
  }

  chatListener: (arg0: ChatSendBeforeEvent) => void

  constructor() {
    if (Chat.instance) throw new Error('Chat was already initialized!')
    Chat.instance = this

    world.afterEvents.worldLoad.subscribe(() => {
      this.updateCooldown()
    })

    this.chatListener = event => {
      event.cancel = true
      system.delay(() => {
        try {
          const player = event.sender

          if (!this.cooldown.isExpired(event.sender)) {
            console.log('Spam chat', player.name, event.message)
            return
          }

          const mute = this.muteDb.getImmutable(event.sender.id)
          if (mute) {
            if (mute.mutedUntil > Date.now()) {
              console.log('Muted chat', player.name, event.message)
              return this.informAboutMute(player, mute)
            }
          }

          const text = event.message.replace(/\\n/g, '\n').replace(/§./g, '').replace(/%/g, '%%').trim()

          const caps = text.split('').reduce((p, c) => (c !== c.toLowerCase() ? p + 1 : p), 0)
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
            .filter(e => e.id !== event.sender.id && e.dimension.id === event.sender.dimension.id)

          // Array with ranged players (include sender id)
          const nearIds = nearPlayers.map(e => e.id)
          nearIds.push(event.sender.id)

          // Outranged players
          const farPlayers = allPlayers.filter(e => !nearIds.includes(e.id))

          this.onMessage({ sender: event.sender, text, farPlayers, nearPlayers })
        } catch (error) {
          console.error('Chat error handler', error)
        }
      })
    }
  }

  protected abstract onMessage(ctx: Chat.Context): void
}
