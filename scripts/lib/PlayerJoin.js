import { Player, system, world } from '@minecraft/server'
import { sendPacketToStdout } from 'lib/BDS/api.js'
import { EventSignal } from 'lib/EventSignal.js'
import { Settings } from 'lib/Settings.js'
import { getRoleAndName } from 'lib/roles.js'
import { util } from 'lib/util.js'

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
   * @type {EventSignal<{ player: Player, joinTimes: number, firstJoin: boolean }>}
   */
  onMoveAfterJoin = new EventSignal()

  eventsDefaultSubscribers = {
    time: this.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
      if (!firstJoin) player.tell(`${timeNow()}, ${player.name}!\n§r§3Время §b• §3${shortTime()}`)
    }, -1),
    playerSpawn: world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
      if (!initialSpawn) return
      if (player.scores.joinDate === 0) player.scores.joinDate = ~~(Date.now() / 1000)
      this.setPlayerJoinPosition(player)
    }),
  }

  /**
   * @private
   * @param {Player} player
   */
  playerAt(player) {
    const rotation = player.getRotation()
    const { location } = player
    return [location.x, location.y, location.z, rotation.x, rotation.y].map(Math.floor)
  }

  /**
   * @param {Player} player
   */
  setPlayerJoinPosition(player) {
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
      20
    )

    new Command({
      name: 'join',
      description: 'Имитирует первый вход',
      role: 'member',
    }).executes(ctx => {
      EventSignal.emit(this.onMoveAfterJoin, { player: ctx.sender, joinTimes: 0, firstJoin: true })
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
   * @param {"air" | "ground"} where
   * @private
   */
  join(player, where) {
    delete player.database.join

    player.scores.joinTimes ??= 0
    player.scores.joinTimes++

    const message = Join.config.messages[where]

    sendPacketToStdout('joinOrLeave', {
      name: player.name,
      role: getRoleAndName(player, { name: false }),
      status: 'move',
      where,
      print: `${getRoleAndName(player)} ${message}`,
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
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Join = new JoinBuilder()

/**
 * Выводит строку времени
 * @returns {string}
 */
function timeNow() {
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
function shortTime() {
  const time = new Date(Date())
  time.setHours(time.getHours() + 3)
  const min = String(time.getMinutes())
  return `${time.getHours()}:${min.length == 2 ? min : '0' + min}`
}
