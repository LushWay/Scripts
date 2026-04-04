import { Player, system, world } from '@minecraft/server'
import { EventSignal } from 'lib/event-signal'
import { i18n } from 'lib/i18n/text'
import { Settings } from 'lib/settings'
import { util } from 'lib/util'
import { Core } from './extensions/core'
import { ActionbarPriority } from './extensions/on-screen-display'
import { Singleton } from './utils/singleton'
import { WeakPlayerMap } from './weak-player-storage'

export declare namespace Join {
  interface Database {
    position?: number[]
    stage?: number
  }

  type Where = 'air' | 'ground'
}

export abstract class Join extends Singleton {
  static onMoveAfterJoin = new EventSignal<{ player: Player; joinTimes: number; firstJoin: boolean }>()

  constructor() {
    super()
    system.runPlayerInterval(player => this.onInterval(player), 'joinInterval', 20)

    new Command('join')
      .setDescription(i18n`Имитирует первый вход`)
      .setPermissions('techAdmin')
      .executes(ctx => {
        const player = ctx.player
        this.emitFirstJoin(player)
      })
  }

  private playerAt(player: Player) {
    const rotation = player.getRotation()
    const { location } = player
    return [location.x, location.y, location.z, rotation.x, rotation.y].map(Math.floor)
  }

  /** Used when you need to e.g. teleport users when they join */
  playerSpawnEventSubscriber = world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (!initialSpawn) return
    this.setPlayerJoinPosition(player)
  })

  /** Used when you need to e.g. teleport users when they join */
  setPlayerJoinPosition(player: Player) {
    if (!player.isValid) return
    this.joinPositions.set(player, { position: this.playerAt(player) })
  }

  isJoining(player: Player) {
    return this.joinPositions.has(player)
  }

  protected joinPositions = new WeakPlayerMap<Join.Database>({ removeOnLeave: true })

  private onInterval(player: Player) {
    if (!player.isValid) return
    const db = this.joinPositions.get(player)

    if (Array.isArray(db?.position)) {
      const time = util.benchmark('joinInterval', 'join')
      const notMoved = Array.equals(db.position, this.playerAt(player))

      if (notMoved) {
        if (player.isOnGround || player.isFlying) this.notMovingInterval?.(player, db)
        else this.joinedAt(player, 'air')
      } else this.joinedAt(player, 'ground')

      time()
    }
  }

  private joinedAt(player: Player, where: Join.Where) {
    this.joinPositions.delete(player)
    player.scores.joinTimes++

    this.onJoinMove(where, player)

    EventSignal.emit(Join.onMoveAfterJoin, {
      player,
      joinTimes: player.scores.joinTimes,
      firstJoin: player.scores.joinTimes === 1,
    })
  }

  protected notMovingInterval?(player: Player, db: Join.Database): void

  protected abstract onJoinMove(where: Join.Where, player: Player): void

  /** Used when you test how join looks or when you add /wipe like command */
  emitFirstJoin(player: Player) {
    EventSignal.emit(Join.onMoveAfterJoin, { player, joinTimes: 1, firstJoin: true })
  }

  static getPlayerSettings = Settings.player(i18n`Вход\n§7Все действия, связанные со входом`, 'join', {
    time: { name: i18n`Время`, description: i18n`при входе`, value: true },
  })

  protected timeListener = Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
    if (!firstJoin && Join.getPlayerSettings(player).time)
      player.tell(i18n.nocolor`${this.timeNow()}, ${player.name}!\n§r§3Время §b• §3${this.shortTime()}`)
  }, -1)

  /** Выводит строку времени */
  private timeNow(): Text {
    const time = new Date(Date()).getHours() + 3
    if (time < 6) return i18n`§9Доброй ночи`
    if (time < 12) return i18n`§6Доброе утро`
    if (time < 18) return i18n`§bДобрый день`
    return i18n`§3Добрый вечер`
  }

  // TODO Use date.toHHMMSS
  /** Выводит время в формате 00:00 */
  private shortTime(): string {
    const time = new Date(Date())
    time.setHours(time.getHours() + 3)
    return `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`
  }
}

export abstract class JoinWithTitle extends Join {
  config = {
    /** Array with strings to show on join. They will change every second. You can use $<var name> from animation.vars */
    titleAnimation: {
      stages: ['» $title «', '»  $title  «'],
      vars: { title: `${Core.name}§r§f` } as Record<string, string>,
    },
    actionBar: '', // Optional
    subtitle: i18n.nocolor`Добро пожаловать!`, // Optional
  }

  protected notMovingInterval(player: Player, db: Join.Database): void {
    if (this.config.titleAnimation.stages.length) {
      db.stage = db.stage ?? -1
      db.stage++
      if (isNaN(db.stage) || db.stage >= this.config.titleAnimation.stages.length) db.stage = 0

      // Creating title
      let title = this.config.titleAnimation.stages[db.stage] ?? ''
      for (const [key, value] of Object.entries(this.config.titleAnimation.vars)) {
        title = title.replace('$' + key, value)
      }

      player.onScreenDisplay.setHudTitle(title, {
        fadeInDuration: 0,
        fadeOutDuration: 20,
        stayDuration: 40,
        subtitle: this.config.subtitle.to(player.lang),
      })
    }

    // Show actionBar
    if (this.config.actionBar) {
      player.onScreenDisplay.setActionBar(this.config.actionBar, ActionbarPriority.Highest)
    }
  }
}

export abstract class JoinWithMessage extends JoinWithTitle {
  protected messages = {
    air: i18n.nocolor`§8Очнулся в воздухе`,
    ground: i18n.nocolor`§8Проснулся`,
  }

  protected sound = 'break.amethyst_cluster'

  protected onJoinMove(where: Join.Where, player: Player) {
    const message = this.messages[where]

    this.onJoinMoveMessage(player, where, message)

    for (const other of world.getPlayers()) {
      if (other.id === player.id) continue

      const settings = this.getPlayerSettingsWithMessage(other)
      if (settings.sound) other.playSound(this.sound)
      if (settings.message) other.tell(i18n.nocolor.join`§7${player.name} ${message}`)
    }
  }

  abstract onJoinMoveMessage(player: Player, where: Join.Where, message: Text): void

  getPlayerSettingsWithMessage = Settings.player(...Join.getPlayerSettings.extend, {
    message: { name: i18n`Сообщение`, description: i18n`о входе других игроков`, value: true },
    sound: { name: i18n`Звук`, description: i18n`при входе игроков`, value: true },
  })
}
