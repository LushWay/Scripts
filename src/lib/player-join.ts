import { Player, system, world } from '@minecraft/server'
import { sendPacketToStdout } from 'lib/bds/api'
import { EventSignal } from 'lib/event-signal'
import { i18n, noI18n } from 'lib/i18n/text'
import { Settings } from 'lib/settings'
import { util } from 'lib/util'
import { Core } from './extensions/core'
import { ActionbarPriority } from './extensions/on-screen-display'
import { getFullname } from './get-fullname'

class JoinBuilder {
  config = {
    /** Array with strings to show on join. They will change every second. You can use $<var name> from animation.vars */
    title_animation: {
      stages: ['» $title «', '»  $title  «'],
      /** @type {Record<string, string>} */
      vars: { title: `${Core.name}§r§f` },
    },
    actionBar: '', // Optional
    subtitle: i18n.nocolor`Добро пожаловать!`, // Optional
    messages: {
      air: i18n.nocolor`§8Очнулся в воздухе`,
      ground: i18n.nocolor`§8Проснулся`,
      sound: 'break.amethyst_cluster',
    },
  }

  onMoveAfterJoin = new EventSignal<{ player: Player; joinTimes: number; firstJoin: boolean }>()

  onFirstTimeSpawn = new EventSignal<Player>()

  eventsDefaultSubscribers = {
    time: this.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
      if (!firstJoin) player.tell(i18n.nocolor`${timeNow()}, ${player.name}!\n§r§3Время §b• §3${shortTime()}`)
    }, -1),
    playerSpawn: world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
      if (!initialSpawn) return
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

    if (!player.isValid) return
    player.database.join.position = this.playerAt(player)
  }

  constructor() {
    system.runPlayerInterval(
      player => {
        if (!player.isValid) return
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
              let title = Join.config.title_animation.stages[db.stage] ?? ''
              for (const [key, value] of Object.entries(Join.config.title_animation.vars)) {
                title = title.replace('$' + key, value)
              }

              // Show actionBar
              if (Join.config.actionBar) {
                player.onScreenDisplay.setActionBar(Join.config.actionBar, ActionbarPriority.Highest)
              }

              player.onScreenDisplay.setHudTitle(title, {
                fadeInDuration: 0,
                fadeOutDuration: 20,
                stayDuration: 40,
                subtitle: Join.config.subtitle.to(player.lang),
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

    new Command('join')
      .setDescription(i18n`Имитирует первый вход`)
      .setPermissions('member')
      .executes(ctx => {
        const player = ctx.player
        this.emitFirstJoin(player)
      })
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
        print: noI18n.nocolor`${'§l§f' + player.name} ${getFullname(player, { name: false })}: ${message}`,
      })

    for (const other of world.getPlayers()) {
      if (other.id === player.id) continue

      const settings = this.settings(other)
      if (settings.sound) other.playSound(Join.config.messages.sound)
      if (settings.message) other.tell(i18n.nocolor.join`§7${player.name} ${message}`)
    }

    EventSignal.emit(this.onMoveAfterJoin, {
      player,
      joinTimes: player.scores.joinTimes,
      firstJoin: player.scores.joinTimes === 1,
    })
  }

  settings = Settings.player(i18n`Вход\n§7Все действия, связанные со входом`, 'join', {
    message: { name: i18n`Сообщение`, description: i18n`о входе других игроков`, value: true },
    sound: { name: i18n`Звук`, description: i18n`при входе игроков`, value: true },
    time: { name: i18n`Время`, description: i18n`при входе`, value: true },
  })

  emitFirstJoin(player: Player) {
    EventSignal.emit(this.onMoveAfterJoin, { player, joinTimes: 1, firstJoin: true })
  }
}

export const Join = new JoinBuilder()

/** Выводит строку времени */
function timeNow(): Text {
  const time = new Date(Date()).getHours() + 3
  if (time < 6) return i18n`§9Доброй ночи`
  if (time < 12) return i18n`§6Доброе утро`
  if (time < 18) return i18n`§bДобрый день`
  return i18n`§3Добрый вечер`
}

// TODO Use date.toHHMMSS
/** Выводит время в формате 00:00 */
function shortTime(): string {
  const time = new Date(Date())
  time.setHours(time.getHours() + 3)
  const min = String(time.getMinutes())
  return `${time.getHours()}:${min.length == 2 ? min : '0' + min}`
}
