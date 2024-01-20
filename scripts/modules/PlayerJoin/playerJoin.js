import { Player, system, world } from '@minecraft/server'
import { EventSignal } from 'lib/Class/EventSignal.js'
import { Settings } from 'smapi.js'

class JoinBuilder {
  config = {
    /** Array with strings to show on join. They will change every second. You can use $<var name> from animation.vars  */
    title_animation: {
      stages: ['» $title «', '»  $title  «'],
      /** @type {Record<string, string>} */
      vars: {
        title: '§6§lDevelopment§r§f',
      },
    },
    actionBar: '', // Optional
    subtitle: 'Разработка!', // Optional
    messages: {
      air: '§8Очнулся в воздухе',
      ground: '§8Проснулся',
      sound: 'break.amethyst_cluster',
    },
  }
  /**
   * @type {EventSignal<{ player: Player, joinCounts: number, firstJoin: boolean }>}
   */
  onMoveAfterJoin = new EventSignal()

  eventsDefaultSubscribers = {
    time: this.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
      if (!firstJoin) player.tell(`${timeNow()}, ${player.name}!\n§r§3Время §b• §3${shortTime()}`)
    }, -1),
  }

  /**
   * @param {Player} player
   * @private
   */
  playerAt(player) {
    const rotation = player.getRotation()
    return [player.location.x, player.location.y, player.location.z, rotation.x, rotation.y].map(Math.floor)
  }

  constructor() {
    world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
      if (!initialSpawn) return
      player.scores.joinDate ??= Date.now()
      player.database.join ??= {}
      player.database.join.position = this.playerAt(player)
    })

    system.runPlayerInterval(
      player => {
        player.database.join ??= {}
        const db = player.database.join

        if (Array.isArray(db.position)) {
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

              player.onScreenDisplay.setTitle(title, {
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
        }
      },
      'joinInterval',
      20
    )

    new Command({
      name: 'join',
      description: 'Имитирует первый вход',
      role: 'techAdmin',
    }).executes(ctx => {
      EventSignal.emit(this.onMoveAfterJoin, { player: ctx.sender, joinCounts: 1, firstJoin: true })
    })
  }

  settings = Settings.player('Вход', 'join', {
    message: {
      desc: 'Сообщения о входе других игроков',
      value: true,
      name: 'Сообщение',
    },
    sound: { desc: 'Звук входа других игроков', value: true, name: 'Звук' },
  })

  /**
   * @param {Player} player
   * @param {"air" | "ground"} messageType
   * @private
   */
  join(player, messageType) {
    delete player.database.join

    player.scores.joinTimes ??= 0
    player.scores.joinTimes++

    for (const other of world.getPlayers()) {
      if (other.id === player.id) continue
      const settings = this.settings(other)
      if (settings.sound) other.playSound(Join.config.messages.sound)
      if (settings.message) other.tell(`§7${player.name} ${Join.config.messages[messageType]}`)
    }

    EventSignal.emit(this.onMoveAfterJoin, {
      player,
      joinCounts: player.scores.joinTimes,
      firstJoin: player.scores.joinTimes === 0,
    })
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Join = new JoinBuilder()

/**
 * Выводит строку времени
 * @returns {string}
 */
export function timeNow() {
  const time = new Date(Date()).getHours() + 3
  if (time < 6) return '§9Доброй ночи'
  if (time < 12) return '§6Доброе утро'
  if (time < 18) return '§bДобрый день'
  return '§3Добрый вечер'
}

/**
 * Выводит время в формате 00:00
 * @returns {string}
 */
export function shortTime() {
  const time = new Date(Date())
  time.setHours(time.getHours() + 3)
  const min = String(time.getMinutes())
  return `${time.getHours()}:${min.length == 2 ? min : '0' + min}`
}
