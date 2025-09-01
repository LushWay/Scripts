import { GameMode, Player, system, world } from '@minecraft/server'
import { Sounds } from 'lib/assets/custom-sounds'
import { EventLoader, EventSignal } from 'lib/event-signal'
import { Core } from 'lib/extensions/core'
import { i18n, i18nShared, noI18n } from 'lib/i18n/text'
import { Join } from 'lib/player-join'
import { Compass } from 'lib/rpg/menu'
import { Group, Place } from 'lib/rpg/place'
import { Settings } from 'lib/settings'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { QuestButton } from './button'
import { PlayerQuest } from './player'
import { QS } from './step'

export declare namespace Quest {
  interface DB {
    active: { id: string; i: number; db?: unknown }[]
    completed: string[]
  }
}

export class Quest {
  static error = class QuestError extends Error {}

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

  static sidebar: import('lib/sidebar').SidebarLineCreate<unknown> = {
    create(sidebar) {
      const showSidebar = sidebar.show.bind(sidebar)
      const textCache = new WeakPlayerMap<{ step: QS; time: number }>({ removeOnLeave: true })

      return function (player: Player) {
        const step = Quest.getCurrentStepOf(player)
        if (!step || player.database.inv === 'spawn' || player.getGameMode() == GameMode.Creative) return ''

        step.playerQuest.updateListeners.add(showSidebar)

        const text = `§l${step.quest.name.to(player.lang)}:§r§6 ${step.text().to(player.lang)}`
        const cached = textCache.get(player)

        if (cached?.step !== step) {
          textCache.set(player, { step: step, time: 10 })
          return text
        }

        if (cached.time <= 0) return text

        // Animate
        cached.time--
        textCache.set(player, cached)
        return `${cached.time % 2 !== 0 ? '§c°' : ''}${text}`
      }
    },
  }

  static quests = new Map<string, Quest>()

  static getCurrentStepOf(player: Player) {
    const db = player.database.quests?.active[0]
    return db && this.quests.get(db.id)?.getCurrentStep(player, db.i)
  }

  private static restore(player: Player, quest: Quest, db = quest.getDatabase(player)) {
    if (db) quest.setStep(player, db.i, true)
  }

  static {
    Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
      if (firstJoin) return

      system.delay(() => {
        player.database.quests?.active.forEach(db => {
          const quest = Quest.quests.get(db.id)
          if (!quest) return

          this.restore(player, quest, db)
        })
      })
    })
  }

  static {
    Core.afterEvents.worldLoad.subscribe(() => {
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
    return this.place.group.name && this.place.name
      ? i18nShared.join`${this.place.group.sharedName} - ${this.place.name}`
      : (this.place.sharedName ?? this.place.group.sharedName)
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
    private create: (
      q: Omit<PlayerQuest, 'list' | 'updateListeners' | 'update' | 'player' | 'quest'>,
      p: Player,
    ) => void,
    public readonly guideIgnore = false,
  ) {
    Quest.quests.set(this.id, this)
    Quest.onQuestLoad.subscribe(() => {
      world.getAllPlayers().forEach(e => Quest.restore(e, this))
    })
    this.onCreate()
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
    if (typeof step === 'undefined') return // Index can point to unknown step, e.g quest have 4 steps but index is 10

    const db = this.getDatabase(player) ?? this.createDatabase(player, i)

    if (!restore) delete db.db // Next step, clean previous db
    db.i = i
    this.stepSwitchVisual(player, step, i, restore)
    step.enter(!restore)
  }

  private createPlayerSteps(player: Player, index: number) {
    const playerQuest = new PlayerQuest(this, player)
    this.players.set(player, playerQuest)
    this.create(playerQuest, player)

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
    return new Group(`quest: ${this.id}`, noI18n`Задание: ${this.name}\n§7${this.description}`)
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
