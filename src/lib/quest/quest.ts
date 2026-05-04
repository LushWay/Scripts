import { Player, system, world } from '@minecraft/server'
import { Sounds } from 'lib/assets/custom-sounds'
import { EventLoader, EventSignal } from 'lib/event-signal'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { i18n, i18nShared, noI18nShared } from 'lib/i18n/text'
import { Join } from 'lib/player-join'
import { RegionEvents } from 'lib/region/events'
import { Compass } from 'lib/rpg/menu'
import { Group, Place } from 'lib/rpg/place'
import { Settings } from 'lib/settings'
import { isNotPlaying, setupUsingStubPlayer } from 'lib/utils/game'
import { createLogger } from 'lib/utils/logger'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { QuestButton } from './button'
import { PlayerQuest, PlayerQuestStub } from './player'
import { QS, QSBuilder } from './step'

declare module '@minecraft/server' {
  interface PlayerDatabase {
    quests?: Quest.DB
  }
}

export declare namespace Quest {
  interface DB {
    active: { id: string; i: number; db?: unknown }[]
    completed: string[]
  }

  type Create = (
    q: Omit<PlayerQuest, 'list' | 'updateListeners' | 'update' | 'player' | 'quest'>,
    p: Player,
  ) => MaybePromise<QSBuilder<QS> | void>
}

export class Quest {
  static logger = createLogger('Quest')

  static playerSettings = Settings.player(
    i18n`Задания
§7Настройки игровых заданий`,
    'quest',
    {
      messageForEachStep: {
        value: false,
        name: i18n`Сообщение в чат при каждом шаге`,
        description: i18n`Отправлять ли сообщение в чат при каждом новом разделе задания`,
      },
    },
  )
  private static textCache = new WeakPlayerMap<{ step: QS; time: number }>({ removeOnLeave: true })

  static showActionBar(this: void, player: Player) {
    const step = Quest.getCurrentStepOf(player)
    if (!step || player.database.inv === 'spawn' || isNotPlaying(player)) return ''

    step.playerQuest.updateListeners.add(Quest.showActionBar)

    const text = `§l${step.quest.name.to(player.lang)}:§r§6 ${step.text().to(player.lang)}`
    const cached = Quest.textCache.get(player)

    if (cached?.step !== step) {
      Quest.textCache.set(player, { step, time: step.animateTicks ?? 10 })
      return text
    }

    let toDisplay = text

    if (cached.time >= 0) {
      // Animate
      cached.time--
      Quest.textCache.set(player, cached)
      toDisplay = `${cached.time % 2 !== 0 ? '§c°' : ''}${text}`
    }

    player.onScreenDisplay.setActionBar(toDisplay, ActionbarPriority.Quest)
  }

  static quests = new Map<string, Quest>()

  static getCurrentStepOf(player: Player) {
    const db = player.database.quests?.active[0]
    return db && this.quests.get(db.id)?.getCurrentStep(player, db.i)
  }

  static {
    Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
      if (firstJoin) return

      system.delay(() => this.restoreFromDatabase(player))
    })
  }

  static restoreFromDatabase(player: Player) {
    player.database.quests?.active.forEach(db => {
      const quest = Quest.quests.get(db.id)
      if (!quest) return

      quest.restoreFromDatabase(player, db)
    })
  }

  static {
    RegionEvents.onLoad.subscribe(() => {
      system.delay(() => {
        EventLoader.load(this.onQuestLoad)

        EventLoader.load(this.onLoad)
      })
    })
  }

  protected static onQuestLoad = new EventLoader()

  static onLoad = new EventLoader()

  players = new WeakPlayerMap<PlayerQuest>({ onLeave: (_, v) => v.steps.forEach(e => e.cleanup()) })

  get id() {
    return this.place.id
  }

  get name() {
    // Quests like city investigating omit place name
    if (!this.place.name.id) return this.place.group.name ?? this.place.name

    // Some quests like learning and getting items back after death
    // use default global group without name, thus we need to display only quest name
    return this.place.group.name ? i18nShared.join`${this.place.group.name} - ${this.place.name}` : this.place.name
  }

  /**
   * Creates a Quest and registers it in a collection.
   *
   * @param description - Provides a brief explanation or summary of the quest. It typically describes the objective or
   *   goal that players need to achieve in order to complete the quest.
   */
  constructor(
    public readonly place: Place,
    public readonly description: Text,
    private create: Quest.Create,
    public readonly guideIgnore = false,
  ) {
    Quest.quests.set(this.id, this)
    Quest.onQuestLoad.subscribe(async () => {
      await setupUsingStubPlayer(player => create(new PlayerQuestStub(this, player), player), Quest.logger, [this.id])
      world.getAllPlayers().forEach(player => this.restoreFromDatabase(player))
    })

    this.onCreate()
  }

  restoreFromDatabase(player: Player, db = this.getDatabase(player)) {
    if (db) this.setStep(player, db.i, true)
  }

  protected onCreate() {
    // Hook
  }

  /** Starts this quest for player */
  enter(player: Player) {
    this.setStep(player, 0)
    // Prevent bug when entering new quest without place caused compass to
    // keep pointing to the previous quest place because cleanup is not called
    Compass.setFor(player, undefined)
  }

  isCompleted(player: Player) {
    return player.database.quests?.completed.includes(this.id) ?? false
  }

  hadEntered(player: Player) {
    return this.isCompleted(player) || !!this.getDatabase(player)
  }

  getDatabase(player: Player) {
    return player.database.quests?.active.find(e => e.id === this.id)
  }

  /** Moves player to the specific quest step with all the visuals etc */
  setStep(player: Player, i: number, restore = false) {
    const step = this.getCurrentStep(player, i) ?? this.createPlayerSteps(player, i)
    // Index can point to unknown step, e.g quest have 4 steps but index is 10
    if (typeof step === 'undefined')
      return Quest.logger.warn(
        `Quest non existent step: ${player.name} ${this.id} ${i}/${this.players.get(player)?.steps.length}`,
      )

    const db = this.getDatabase(player) ?? this.createDatabase(player, i)

    if (!restore) delete db.db // Next step, clean previous db
    db.i = i
    this.stepSwitchVisual(player, step, i, restore)
    step.enter(!restore)
  }

  private createPlayerSteps(player: Player, index: number) {
    const playerQuest = new PlayerQuest(this, player)
    this.players.set(player, playerQuest)

    try {
      const result = this.create(playerQuest, player)
      if (result instanceof Promise) throw new Error(this.id + ' is not fully loaded!!!')
    } catch (e) {
      Quest.logger.player(player).error('Initialize failed', this.name, this.id, e)
      if (e instanceof Error) playerQuest.failed(e.message)
      else playerQuest.failed(String(e))
    }

    return playerQuest.steps[index]
  }

  private createDatabase(player: Player, i: number) {
    const quests = (player.database.quests ??= { active: [], completed: [] })

    const db = { id: this.id, i: i } as Quest.DB['active'][number]
    quests.active.unshift(db)

    return db
  }

  /** Gets current active step of this quest that player is in */
  getCurrentStep(player: Player, stepIndex = this.getDatabase(player)?.i): QS | undefined {
    return this.players.get(player)?.steps[stepIndex ?? 0]
  }

  /** Sends message and displays title on quest step move */
  private stepSwitchVisual(player: Player, step: QS, i: number, restore: boolean) {
    if (Quest.playerSettings(player).messageForEachStep) {
      const text = step.description?.()
      // TODO Fix colors
      if (text) player.success(i18n.nocolor`§f§l${this.name}: §r§6${text}`)
    }

    if (i === 0 && !restore) {
      system.runTimeout(
        () => {
          // TODO Fix colors
          player.onScreenDisplay.setHudTitle('§6' + this.name.to(player.lang), {
            subtitle: this.description.to(player.lang),
            fadeInDuration: 0,
            stayDuration: 20 * 8,
            fadeOutDuration: 0,
          })
          player.playSound(Sounds.LevelUp)
        },
        'quest title',
        20,
      )
    }
  }

  /**
   * Removes this quest from the active player quests
   *
   * @param player - Player to exit
   * @param end - Whenther to mark this quest as completed successfully and add to the completed array or not
   */
  exit(player: Player, end = false, removeFromCompleted = false) {
    const db = player.database
    if (!db.quests) return

    const active = db.quests.active.find(q => q.id === this.id)
    if (active) {
      this.getCurrentStep(player, active.i)?.cleanup()
      this.players.delete(player.id)
    }

    if (end) EventSignal.emit(Quest.onEnd, { quest: this, player })

    db.quests.active = db.quests.active.filter(q => q !== active)
    if (end && !db.quests.completed.includes(this.id)) db.quests.completed.push(this.id)
    if (removeFromCompleted) {
      db.quests.completed = db.quests.completed.filter(e => e !== this.id)
    }
  }

  get group() {
    return new Group(`quest: ${this.id}`, noI18nShared`Задание: ${this.name}\n§7${this.description}`)
  }

  button = new QuestButton(this)

  static onEnd = new EventSignal<{ quest: Quest; player: Player }>()
}

/** Marks quest to be included into the daily quests list */
export class DailyQuest extends Quest {
  static dailyQuests = new Set<DailyQuest>()

  protected onCreate(): void {
    DailyQuest.dailyQuests.add(this)
  }
}
