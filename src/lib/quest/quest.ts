import { Player, system, world } from '@minecraft/server'
import { Sounds } from 'lib/assets/custom-sounds'
import { EventLoader } from 'lib/event-signal'
import { Core } from 'lib/extensions/core'
import { Join } from 'lib/player-join'
import { Group } from 'lib/rpg/place'
import { Settings, SETTINGS_GROUP_NAME } from 'lib/settings'
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

  static playerSettings = Settings.player('Задания\n§7Настройки игровых заданий', 'quest', {
    messageForEachStep: {
      value: false,
      name: 'Сообщение в чат при каждом шаге',
      description: 'Отправлять ли сообщение в чат при каждом новом разделе задания',
    },
  })

  static sidebar: import('lib/sidebar').SidebarLineCreate<unknown> = {
    create(sidebar) {
      const showSidebar = sidebar.show.bind(sidebar)
      const textCache = new WeakPlayerMap<{ step: QS; time: number }>({ removeOnLeave: true })

      return function (player: Player) {
        const step = Quest.getCurrentStepOf(player)
        if (!step || player.database.inv === 'spawn') return ''

        step.playerQuest.updateListeners.add(showSidebar)

        const text = `§l${step.quest.name}:§r§6 ${step.text()}`
        const cached = textCache.get(player)

        if (cached?.step !== step) {
          textCache.set(player, { step: step, time: 6 })
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
    return db && this.quests.get(db.id)?.getPlayerStep(player, db.i)
  }

  static getDatabase(player: Player, quest: Quest) {
    return player.database.quests?.active.find(e => e.id === quest.id)
  }

  private static restore(player: Player, quest: Quest, db = Quest.getDatabase(player, quest)) {
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

  /**
   * Creates a Quest and registers it in a collection.
   *
   * @param id - Unique identifier for the quest.
   * @param name - The name of the quest.
   * @param description - Provides a brief explanation or summary of the quest. It typically describes the objective or
   *   goal that players need to achieve in order to complete the quest.
   */
  constructor(
    public readonly id: string,
    public readonly name: Text,
    public readonly description: Text,
    private create: (
      q: Omit<PlayerQuest, 'list' | 'updateListeners' | 'update' | 'player' | 'quest'>,
      p: Player,
    ) => void,
  ) {
    Quest.quests.set(this.id, this)
    Quest.onQuestLoad.subscribe(() => {
      world.getAllPlayers().forEach(e => Quest.restore(e, this))

      const questSettings = Settings.worldMap[this.group.id]
      if (typeof questSettings !== 'undefined') {
        questSettings[SETTINGS_GROUP_NAME] = `Задание: ${this.name}\n§7${this.description}`
      }
    })
  }

  /** Starts this quest for player */
  enter(player: Player) {
    this.setStep(player, 0)
  }

  /** Moves player to the specific quest step with all the visuals etc */
  setStep(player: Player, i: number, restore = false) {
    const step = this.getPlayerStep(player, i) ?? this.createPlayerSteps(player, i)
    if (typeof step === 'undefined') return // Index can be unknown, e.g quest have 4 steps but index is 10

    const db = Quest.getDatabase(player, this) ?? this.createDatabase(player, i)

    if (!restore) delete db.db // Next step, clean previous db
    db.i = i
    this.stepSwitchVisual(player, step, i, restore)
    step.enter(!restore)
  }

  isCompleted(player: Player) {
    return player.database.quests?.completed.includes(this.id)
  }

  /** Gets current active step of this quest that player is in */
  getPlayerStep(player: Player, stepIndex = this.getForPlayer(player)?.i): QS | undefined {
    return this.players.get(player)?.steps[stepIndex ?? 0]
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

  /**
   * The active quest object for a specific player with the given step number. If the active quest does not exist for
   * the player, it creates a new active quest object with the provided step number and adds it to the player's list of
   * active quests before returning it.
   *
   * @param player - Player to recieve quest from
   * @param i - Number that represents the step index of the quest.
   */
  private getForPlayer(player: Player, i?: number) {
    const quests = (player.database.quests ??= { active: [], completed: [] })

    let active = quests.active.find(e => e.id === this.id)
    if (!active && typeof i === 'number') {
      active = { id: this.id, i: i }
      quests.active.unshift(active)
    }

    return active
  }

  /** Sends message and displays title on quest step move */
  private stepSwitchVisual(player: Player, step: QS, i: number, restore: boolean) {
    if (Quest.playerSettings(player).messageForEachStep) {
      const text = step.description?.()
      if (text) player.success(`§f§l${this.name}: §r§6${text}`)
    }

    if (i === 0 && !restore) {
      system.runTimeout(
        () => {
          player.onScreenDisplay.setHudTitle('§6' + this.name, {
            subtitle: this.description,
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
      this.getPlayerStep(player, active.i)?.cleanup()
      this.players.delete(player.id)
    }

    db.quests.active = db.quests.active.filter(q => q !== active)
    if (end && !db.quests.completed.includes(this.id)) db.quests.completed.push(this.id)
    if (removeFromCompleted) {
      db.quests.completed = db.quests.completed.filter(e => e !== this.id)
    }
  }

  get group() {
    return new Group('quest: ' + this.id, this.name)
  }

  button = new QuestButton(this)
}
