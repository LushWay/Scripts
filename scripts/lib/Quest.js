import { ContainerSlot, Entity, Player, Vector, system, world } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { Airdrop } from 'lib/Airdrop.js'
import { LootTable } from 'lib/LootTable.js'
import { Compass } from 'lib/Menu.js'
import { Settings } from 'lib/Settings.js'
import { Temporary } from 'lib/Temporary.js'
import { isBuilding } from 'modules/Build/isBuilding.js'
import { InventoryIntervalAction, PlaceAction } from './Action.js'

const playerSettings = Settings.player('quest', 'Квесты', {
  messageForEachStep: {
    value: true,
    name: 'Сообщение в чат при каждом шаге',
    desc: 'Отправлять ли сообщение в чат при каждом новом шаге квеста',
  },
})

// // @ts-expect-error Bruh
// Set.prototype.toJSON = function () {
//   return 'Set<size=' + this.size + '>'
// }

/**
 * @typedef {{
 * 	active: {
 *    id: string
 * 	  step: number,
 * 	  db?: unknown
 *  }[],
 * 	completed: string[]
 * }} QuestDB
 */

export class Quest {
  static error = class QuestError extends Error {}
  /** @type {import("./Sidebar.js").SidebarLinePreinit} */
  static sidebar = {
    preinit(sidebar) {
      const onquestupdate = sidebar.show.bind(sidebar)

      return function (player) {
        const status = Quest.active(player)
        if (!status) return false

        const listeners = status.quest.steps(player).updateListeners
        if (!listeners.has(onquestupdate)) listeners.add(onquestupdate)

        return `§7Квест: §f${status.quest.name}\n${status.step?.text()}\n§7Подробнее: §f.q`
      }
    },
  }

  /**
   * @type {Record<string, Quest>}
   */
  static instances = {}

  /**
   * @param {Player} player
   * @param {Quest} [quest]
   */
  static active(player, quest) {
    const db = player.database
    const dbquest = quest ? db.quests?.active.find(q => q.id === quest?.id) : db.quests?.active[0]
    if (!dbquest) return false

    quest ??= Quest.instances[dbquest.id]
    if (!quest) return false

    return {
      quest,
      stepIndex: dbquest.step,
      step: quest.steps(player).list[dbquest.step],
    }
  }

  /**
   * @type {Record<string, PlayerQuest>}
   */
  players = {}

  /**
   * @param {object} options
   * @param {string} options.name
   * @param {string} options.id
   * @param {string} options.desc
   * @param {(q: PlayerQuest, p: Player) => void} init
   */
  constructor({ id, name, desc }, init) {
    this.id = id
    this.name = name
    this.init = init
    this.description = desc
    Quest.instances[this.id] = this
    SM.afterEvents.worldLoad.subscribe(() => {
      system.delay(() => {
        world.getAllPlayers().forEach(setQuests)
      })
    })
  }

  /**
   * @param {Player} player
   */
  steps(player) {
    if (this.players[player.id]) return this.players[player.id]

    this.players[player.id] = new PlayerQuest(this, player)
    this.init(this.players[player.id], player)

    world.afterEvents.playerLeave.subscribe(({ playerId }) => delete this.players[playerId])

    return this.players[player.id]
  }

  /**
   * @param {Player} player
   */
  enter(player) {
    this.toStep(player, 0)
  }

  /**
   * @param {Player} player
   * @param {number} stepIndex
   */
  toStep(player, stepIndex, restore = false) {
    const quests = (player.database.quests ??= {
      active: [],
      completed: [],
    })

    let active = quests.active.find(e => e.id === this.id)
    if (!active) {
      active = { id: this.id, step: stepIndex }
      quests.active.unshift(active)
    }

    // Next step, clean previous db
    if (!restore) delete active.db

    active.step = stepIndex

    const steps = this.steps(player)
    const step = steps.list[stepIndex] ?? steps.list[0]
    if (!step) return false

    if (playerSettings(player).messageForEachStep) {
      const text = step.text()
      if (text)
        player.success(
          `§f${this.name}: ${text}${step.description ? '\n' : ''}${step.description ? '§6' + step.description() : ''}`
        )
    }

    // First time, show title
    if (stepIndex === 0 && !restore) {
      system.runTimeout(
        () => {
          player.onScreenDisplay.setHudTitle('§6' + this.name, {
            subtitle: this.description,
            fadeInDuration: 0,
            stayDuration: 20 * 4,
            fadeOutDuration: 20,
          })
          player.playSound(SOUNDS.levelup)
        },
        'quest title',
        20
      )
    }

    step.cleanup = step.activate?.(!restore).cleanup
  }

  /**
   * @param {Player} player
   */
  current(player) {
    const steps = Quest.active(player, this)
    if (!steps) return false

    return steps.step
  }

  /**
   * @param {Player} player
   */
  exit(player, end = false) {
    const db = player.database
    if (!db.quests) return

    const active = db.quests.active.find(q => q.id === this.id)
    if (active) {
      this.steps(player).list[active.step].cleanup?.()
      delete this.players[player.id]
    }

    db.quests.active = db.quests.active.filter(q => q !== active)
    if (end) db.quests.completed.push(this.id)
  }
}

/**
 * @param {Player} player
 */
function setQuests(player) {
  const status = Quest.active(player)
  if (!status) return

  status.quest.toStep(player, status.stepIndex, true)
}

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => initialSpawn && setQuests(player))

/**
 * @typedef {() => string} DynamicQuestText
 */

/**
 * @typedef {string | DynamicQuestText} QuestText
 */

/**
 * @typedef {{
 *   text: QuestText,
 *   description?: QuestText
 *   activate?(firstTime: boolean): { cleanup(): void }
 * }} QuestStepInput
 */

/**
 * @template [DB=unknown]
 * @typedef {{
 *   next(): void
 *   cleanup?(): void
 *   player: Player
 *   quest: Quest
 *   text: DynamicQuestText
 *   description?: DynamicQuestText
 *   error(text: string): ReturnType<NonNullable<QuestStepInput['activate']>>
 *   db: DB | undefined
 * } & Omit<QuestStepInput, 'text' | 'description'> & Pick<PlayerQuest, "quest" | "player" | "update">} QuestStepThis
 */

// TODO Test quest switching
// TODO Change quest status placement (also show steps/enters on the onScreenDisplay)

class PlayerQuest {
  /**
   * @param {Quest} parent
   * @param {Player} player
   */
  constructor(parent, player) {
    this.quest = parent
    this.player = player
  }

  /**
   * @type {(QuestStepThis)[]}
   */
  list = []

  /**
   * @type {Set<(p: Player) => void>}
   */
  updateListeners = new Set()
  update() {
    this.updateListeners.forEach(e => e(this.player))
  }

  /**
   * @param {QuestStepInput & ThisType<QuestStepThis>} options
   */
  dynamic(options) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const step = this
    const text = options.text
    const description = options.description
    const i = this.list.length
    /** @type {PlayerQuest["list"][number]} */
    const ctx = {
      ...options,
      text: typeof text === 'string' ? () => text : text,
      description: typeof description === 'string' ? () => description : description,

      get db() {
        return this.player.database.quests?.active.find(e => e.id === this.quest.id)?.db
      },
      set db(value) {
        const active = this.player.database.quests?.active.find(e => e.id === this.quest.id)
        if (active) active.db = value
      },
      player: this.player,
      update: this.update.bind(this),
      quest: this.quest,
      next() {
        this.cleanup?.()
        if (step.list[i + 1]) {
          this.quest.toStep(this.player, i + 1)
        } else {
          this.quest.exit(this.player)
          step._end()
          delete this.quest.players[this.player.id]
        }
        this.update()
        step.updateListeners.clear()
      },
      error(text) {
        this.player.fail('§cУпс, квест сломался: ' + text)
        return { cleanup() {} }
      },
    }

    // Share properties between mixed objects
    Object.setPrototypeOf(options, ctx)
    this.list.push(ctx)
    return ctx
  }

  /**
   * Waits for item in the inventory
   * @param {Omit<QuestStepInput, 'activate'> & { isItem: (item: ContainerSlot) => boolean } & ThisType<QuestStepThis>} options
   */
  item({ isItem, ...options }) {
    this.dynamic({
      ...options,
      activate() {
        return new Temporary(() => {
          const action = InventoryIntervalAction.subscribe(({ player, slot }) => {
            if (player.id !== this.player.id) return
            if (isItem(slot)) this.next()
          })

          return {
            cleanup() {
              InventoryIntervalAction.unsubscribe(action)
            },
          }
        })
      },
    })
  }

  /**
   * Runs callback on quest start (when player enters it)
   * @param {(this: QuestStepThis) => void} action
   */
  start(action) {
    this.dynamic({
      text: () => '',
      activate() {
        action.call(this)
        this.next()
        return { cleanup() {} }
      },
    })
  }

  /**
   * @param {Vector3} from
   * @param {Vector3} to
   * @param {QuestText} text
   * @param {QuestText} [description]
   */
  place(from, to, text, description, doNotAllowBuilders = true) {
    // Unwrap vectors to not loose reference. For some reason, that happens
    from = { x: from.x, y: from.y, z: from.z }
    to = { x: to.x, y: to.y, z: to.z }
    this.dynamic({
      text,
      description,
      activate() {
        const temporary = new Temporary(() => {
          /** @type {ReturnType<typeof PlaceAction.onEnter>[]} */
          const actions = []
          for (const pos of Vector.foreach(from, to)) {
            actions.push(
              PlaceAction.onEnter(pos, player => {
                if (player.id !== this.player.id) return
                if (doNotAllowBuilders && isBuilding(player)) return

                this.next()
              })
            )
          }

          return {
            cleanup() {
              actions.forEach(a => a.unsubscribe())
            },
          }
        })

        console.log('q.place', { from: Vector.string(from), to: Vector.string(to) })
        const { x, y, z } = Vector.lerp(from, to, 0.5)

        this.quest.steps(this.player).targetCompassTo({ place: { x, y, z }, temporary })

        return temporary
      },
    })
  }

  /**
   * @typedef {{
   *   text(value: number): string,
   *   description?: QuestCounterInput['text']
   *   end: number,
   *   value?: number,
   * } & Omit<QuestStepInput, "text" | "description">
   * } QuestCounterInput
   */

  /**
   * @typedef {QuestStepThis &
   * { diff(this: QuestStepThis, m: number): void } &
   *   Omit<QuestCounterInput, 'text' | 'description'>
   * } QuestCounterThis
   */

  /**
   * @param {QuestCounterInput & Partial<QuestCounterThis> & ThisType<QuestCounterThis>} options
   */
  counter(options) {
    options.value ??= 0

    options.diff = function (diff) {
      options.value ??= 0
      const result = options.value + diff

      if (result < options.end) {
        // Saving value to db
        this.db = result

        // Updating interface
        options.value = result
        this.update()
      } else {
        this.next()
      }
    }

    const inputedActivate = options.activate?.bind(options)
    options.activate = function (firstTime) {
      if (!this.player) throw new ReferenceError('Quest: this.player is undefined!')

      if (typeof this.db === 'number') options.value = this.db
      options.value ??= 0

      return inputedActivate?.(firstTime) ?? { cleanup() {} }
    }
    const inputedText = options.text.bind(options)
    options.text = () => inputedText(options.value)

    if (options.description) {
      const inputedDescription = options.description.bind(options)
      options.description = () => inputedDescription(options.value)
    }

    this.dynamic(options)
  }

  /**
   * @typedef {{
   *   npcEntity: Entity
   *   placeText?: QuestStepInput["text"]
   *   placeDescription?: QuestStepInput["text"]
   *   talkText: QuestStepInput["text"]
   *   talkDescription?: QuestStepInput["text"]
   * } & QuestStepInput} QuestDialogueInput
   */

  /**
   * @typedef {QuestStepThis & QuestDialogueInput} QuestDialogueThis
   */

  /**
   * @param {QuestDialogueInput & Partial<QuestDialogueThis> & ThisType<QuestDialogueThis>} options
   */
  dialogue(options) {
    if (!options.npcEntity.isValid()) return this.failed('Неигровой персонаж недоступен')
    const location = options.npcEntity.location

    options.placeText ??= () => 'Доберитесь до ' + options.npcEntity.nameTag

    this.place(
      Vector.add(location, Vector.multiply(Vector.one, -1)),
      Vector.add(location, Vector.one),
      options.placeText,
      options.placeDescription
    )
    this.dynamic({
      text: options.talkText,
      description: options.talkDescription,
      activate() {
        return new Temporary(({ system }) => {
          system.afterEvents.scriptEventReceive.subscribe(
            event => {
              if (event.id !== 'quest:dialogue.end' || !event.initiator) return
              if (event.initiator.id !== this.player.id) return
              this.next()
            },
            {
              namespaces: ['quest'],
            }
          )
        })
      },
    })
  }

  /**
   * @typedef {{
   *   text?: (AirdropPos: string) => string
   * } & ({
   *   spawnAirdrop: (key: string | undefined) => Airdrop
   * } | { lootTable: LootTable } & ({ location: Vector3 } | { abovePlayerY?: number })
   * )} QuestAirdropInput
   */

  /**
   * @typedef {Partial<QuestStepThis> & QuestAirdropInput} QuestAirdropThis
   */

  /**
   * @param {QuestAirdropInput & ThisType<QuestAirdropThis>} options
   */
  airdrop(options) {
    const spawnAirdrop =
      'spawnAirdrop' in options
        ? options.spawnAirdrop
        : (/** @type {string | undefined} */ key) =>
            new Airdrop(
              {
                position:
                  'location' in options
                    ? options.location
                    : Vector.add(this.player.location, {
                        x: 0,
                        y: options.abovePlayerY ?? 50,
                        z: 0,
                      }),
                loot: options.lootTable,
                for: this.player.id,
              },
              key
            )

    let airdroppos = ''
    this.dynamic({
      text: () => (options.text ? options.text(airdroppos) : '§6Забери аирдроп' + airdroppos),
      activate() {
        // Saving/restoring airdrop

        /** @type {Airdrop} */
        let airdrop
        const key = this.db

        if (typeof key === 'string') {
          if (key in Airdrop.db) {
            airdrop = spawnAirdrop(key)
          } else {
            console.error(new Quest.error(`No airdrop found, player '${this.player.name}§r', quest: ${this.quest.id}`))
            system.delay(() => this.next())
            return { cleanup() {} }
          }
        } else {
          airdrop = spawnAirdrop()
        }

        this.db = airdrop.key
        if (!key && !airdrop.chestMinecart) return this.error('Не удалось вызвать аирдроп')

        const temporary = new Temporary(({ world }) => {
          world.afterEvents.playerInteractWithEntity.subscribe(event => {
            const airdropEntity = airdrop.chestMinecart
            if (!airdropEntity) return
            if (event.target.id !== airdropEntity.id) return

            if (this.player.id === event.player.id) {
              system.delay(() => this.next())
            }
          })

          world.afterEvents.entityDie.subscribe(event => {
            if (event.deadEntity.id !== airdrop.chestMinecart?.id) return

            system.delay(() => this.next())
          })
        })

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const qthis = this
        let i = 0
        this.quest.steps(this.player).targetCompassTo({
          place: Vector.floor(this.player.location),
          interval() {
            const airdropEntity = airdrop.chestMinecart
            if (!airdropEntity || !airdropEntity.isValid()) return

            this.place = Vector.floor(airdropEntity.location)

            if (i === 1) {
              i = 0
              airdrop.showParticleTrace(this.place)
            } else {
              i++
            }

            airdroppos = ` на\n§f${Vector.string(this.place, true)}`
            qthis.update()
          },
          temporary,
        })

        return temporary
      },
    })
  }

  /**
   * @param {string} reason
   */
  failed(reason) {
    this.dynamic({
      activate: () => {
        this.player.fail(reason)
        this.quest.exit(this.player)
        return { cleanup() {} }
      },
      text: () => '§cКвест сломался: ' + reason,
    })
  }

  /** @private */
  _end = () => {}

  /**
   * @param {(this: PlayerQuest) => void} action
   */
  end(action) {
    this._end = action
  }

  /**
   * @typedef {{
   *   place: Vector3
   *   temporary?: Temporary
   *   interval?: VoidFunction & ThisType<CompassOptions>
   * }} CompassOptions
   */

  /**
   * @param {CompassOptions} options
   */
  targetCompassTo(options) {
    return new Temporary(({ system }) => {
      system.runInterval(
        () => {
          if (!this.player.isValid()) return
          if (
            !options.place ||
            typeof options.place.x !== 'number' ||
            typeof options.place.y !== 'number' ||
            typeof options.place.z !== 'number'
          )
            return

          options.interval?.()

          Compass.setFor(this.player, options.place)
        },
        'Quest place compasss',
        20
      )

      return {
        cleanup: () => {
          Compass.setFor(this.player, undefined)
        },
      }
    }, options.temporary)
  }
}
