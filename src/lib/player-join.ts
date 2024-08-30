import { Player, system, world } from '@minecraft/server'
import { sendPacketToStdout } from 'lib/bds/api'
import { EventSignal } from 'lib/event-signal'
import { Settings } from 'lib/settings'
import { t } from 'lib/text'
import { util } from 'lib/util'
import { getFullname } from './get-fullname'
import { Core } from './extensions/core'

class JoinBuilder {
  config = {
    /** Array with strings to show on join. They will change every second. You can use $<var name> from animation.vars */
    title_animation: {
      stages: ['» $title «', '»  $title  «'],
      /** @type {Record<string, string>} */
      vars: {
        title: `${Core.name}§r§f`,
      },
    },
    actionBar: '', // Optional
    subtitle: 'Добро пожаловать!', // Optional
    messages: {
      air: '§8Очнулся в воздухе',
      ground: '§8Проснулся',
      sound: 'break.amethyst_cluster',
    },
  }

  onMoveAfterJoin = new EventSignal<{ player: Player; joinTimes: number; firstJoin: boolean }>()

  onFirstTimeSpawn = new EventSignal<Player>()

  eventsDefaultSubscribers = {
    time: this.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
      if (!firstJoin) player.tell(`${timeNow()}, ${player.name}!\n§r§3Время §b• §3${shortTime()}`)
    }, -1),
    playerSpawn: world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
      if (!initialSpawn) return
      if (player.scores.joinDate === 0) player.scores.joinDate = ~~(Date.now() / 1000)
      this.setPlayerJoinPosition(player)
      EventSignal.emit(this.onFirstTimeSpawn, player)
    }),
  }

  private playerAt(player: Player) {
    const rotation = player.getRotation()
    const { location } = player
    return [location.x, location.y, location.z, rotation.x, rotation.y].map(Math.floor)
  }

  setPlayerJoinPosition(player: Player) {
    player.database.join ??= {}
    player.database.join.position = this.playerAt(player)
  }

  constructor() {
    system.runPlayerInterval(
      player => {
        player.database.join
        const db = player.database.join

        if (Array.isArray(db?.position)) {
          const time = util.benchmark('joinInterval', 'join')
          const notMoved = Array.equals(db.position, this.playerAt(player))

          if (notMoved) {
            // Player still stays at joined position...
            if (player.isOnGround || player.isFlying) {
              // Player will not move, show animation
              db.stage = db.stage ?? -1
              db.stage++
              if (isNaN(db.stage) || db.stage >= Join.config.title_animation.stages.length) db.stage = 0

              // Creating title
              let title = Join.config.title_animation.stages[db.stage]
              for (const [key, value] of Object.entries(Join.config.title_animation.vars)) {
                title = title.replace('$' + key, value)
              }

              // Show actionBar
              if (Join.config.actionBar) {
                player.onScreenDisplay.setActionBar(Join.config.actionBar)
              }

              player.onScreenDisplay.setHudTitle(title, {
                fadeInDuration: 0,
                fadeOutDuration: 20,
                stayDuration: 40,
                subtitle: Join.config.subtitle,
              })
            } else {
              // Player joined in air
              this.join(player, 'air')
            }
          } else {
            // Player moved on ground
            this.join(player, 'ground')
          }

          time()
        }
      },
      'joinInterval',
      20,
    )
  }

  private join(player: Player, where: 'air' | 'ground') {
    delete player.database.join
    player.scores.joinTimes++

    const message = Join.config.messages[where]

    __SERVER__ &&
      sendPacketToStdout('joinOrLeave', {
        name: player.name,
        role: getFullname(player, { name: false }),
        status: 'move',
        where,
        print: t`[${player.name}][${getFullname(player, { name: false })}]: ${message}`,
      })

    for (const other of world.getPlayers()) {
      if (other.id === player.id) continue

      const settings = this.settings(other)
      if (settings.sound) other.playSound(Join.config.messages.sound)
      if (settings.message) other.tell(`§7${player.name} ${message}`)
    }

    EventSignal.emit(this.onMoveAfterJoin, {
      player,
      joinTimes: player.scores.joinTimes,
      firstJoin: player.scores.joinTimes === 1,
    })
  }

  private command = new Command('join')
    .setDescription('Имитирует первый вход')
    .setPermissions('member')
    .executes(ctx => {
      const player = ctx.player
      this.emitFirstJoin(player)
    })

  settings = Settings.player('Вход\n§7Все действия, связанные со входом', 'join', {
    message: {
      name: 'Сообщение',
      description: 'о входе других игроков',
      value: true,
    },
    sound: {
      name: 'Звук',
      description: 'при входе игроков',
      value: true,
    },
    time: {
      name: 'Время',
      description: 'при входе',
      value: true,
    },
  })

  emitFirstJoin(player: Player) {
    EventSignal.emit(this.onMoveAfterJoin, { player, joinTimes: 1, firstJoin: true })
  }
}

export const Join = new JoinBuilder()

/**
 * Выводит строку времени
 *
 * @returns {string}
 */
function timeNow(): string {
  const time = new Date(Date()).getHours() + 3
  if (time < 6) return '§9Доброй ночи'
  if (time < 12) return '§6Доброе утро'
  if (time < 18) return '§bДобрый день'
  return '§3Добрый вечер'
}

/**
 * Выводит время в формате 00:00
 *
 * @returns {string}
 */
function shortTime(): string {
  const time = new Date(Date())
  time.setHours(time.getHours() + 3)
  const min = String(time.getMinutes())
  return `${time.getHours()}:${min.length == 2 ? min : '0' + min}`
}
