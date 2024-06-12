import { Player, system, world } from '@minecraft/server'
import { Join, Settings } from 'lib'
import { Sounds } from 'lib/assets/config'
import { WeakOnlinePlayerMap } from 'lib/weak-player-map'
import { PlayerQuest } from './player'
import { QS } from './step'

export interface QuestDB {
  active: {
    id: string
    i: number
    db?: unknown
  }[]
  completed: string[]
}

export class Quest {
  static error = class QuestError extends Error {}

  static playerSettingsName: [displayName: string, id: string] = ['Задания\n§7Настройки игровых заданий', 'quest']

  static playerSettings = Settings.player(...this.playerSettingsName, {
    messageForEachStep: {
      value: true,
      name: 'Сообщение в чат при каждом шаге',
      description: 'Отправлять ли сообщение в чат при каждом новом разделе задания',
    },
  })

  static sidebar: import('lib/sidebar').SidebarLineCreate<unknown> = {
    create(sidebar) {
      const showSidebar = sidebar.show.bind(sidebar) as (typeof sidebar)['show']

      return function (player: Player) {
        const current = Quest.getCurrent(player)
        if (!current) return ''

        current.playerQuest.updateListeners.add(showSidebar)
        return `§f§l${current.quest.name}:§r§6 ${current.text()}`
      }
    },
  }

  static quests = new Map<string, Quest>()

  static getCurrent(player: Player) {
    const db = player.database.quests?.active[0]
    return db && this.quests.get(db.id)?.getPlayerStep(player, db.i)
  }

  players = new WeakOnlinePlayerMap<PlayerQuest>()

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
    system.delay(() => world.getAllPlayers().forEach(e => Quest.restore(e, this)))
  }

  enter(player: Player) {
    this.move(player, 0)
  }

  move(player: Player, i: number, restore = false) {
    const step = this.getPlayerStep(player, i)
    if (!step) return

    const active = this.getDatabase(player, i)

    if (!restore) delete active.db // Next step, clean previous db
    active.i = i
    this.stepSwitchVisual(player, step, i, restore)
    step.enter(!restore)
  }

  getPlayerStep(player: Player, index = this.getDatabase(player, 0).i): QS | undefined {
    return this.getPlayerSteps(player).list[index]
  }

  getPlayerSteps(player: Player) {
    const step = this.players.get(player)
    if (step) {
      return step.value
    } else {
      const quest = new PlayerQuest(this, player)
      this.players.set(player, quest)
      this.create(quest, player)
      return quest
    }
  }

  /**
   * The active quest object for a specific player with the given step number. If the active quest does not exist for
   * the player, it creates a new active quest object with the provided step number and adds it to the player's list of
   * active quests before returning it.
   *
   * @param player - Player to recieve quest from
   * @param i - Number that represents the step index of the quest.
   */
  private getDatabase(player: Player, i: number) {
    const quests = (player.database.quests ??= {
      active: [],
      completed: [],
    })

    let active = quests.active.find(e => e.id === this.id)
    if (!active) {
      active = { id: this.id, i: i }
      quests.active.unshift(active)
    }

    return active
  }

  /** Sends message and displays title on quest step move */
  private stepSwitchVisual(player: Player, step: QS, i: number, restore: boolean) {
    if (Quest.playerSettings(player).messageForEachStep) {
      const text = step.text()
      if (text) player.success(`§f§l${this.name}: §r§6${step.description ? step.description() : step.text()}`)
    }

    if (i === 0 && !restore) {
      system.runTimeout(
        () => {
          player.onScreenDisplay.setHudTitle('§6' + this.name, {
            subtitle: this.description,
            fadeInDuration: 0,
            stayDuration: 20 * 4,
            fadeOutDuration: 20,
          })
          player.playSound(Sounds.LevelUp)
        },
        'quest title',
        20,
      )
    }
  }

  exit(player: Player, end = false) {
    const db = player.database
    if (!db.quests) return

    const active = db.quests.active.find(q => q.id === this.id)
    if (active) {
      this.getPlayerStep(player, active.i)?.cleanup()
      this.players.delete(player.id)
    }

    db.quests.active = db.quests.active.filter(q => q !== active)
    if (end) db.quests.completed.push(this.id)
  }

  static {
    Join.onMoveAfterJoin.subscribe(
      ({ player, firstJoin }) =>
        !firstJoin &&
        system.delay(() => {
          player.database.quests?.active.forEach(db => {
            const quest = Quest.quests.get(db.id)
            if (!quest) return

            this.restore(player, quest, db)
          })
        }),
    )
  }

  get group() {
    return 'quest: ' + this.id
  }

  private static restore(
    player: Player,
    quest: Quest,
    db = player.database.quests?.active.find(e => e.id === quest.id),
  ) {
    if (db) quest.move(player, db.i, true)
  }
}
