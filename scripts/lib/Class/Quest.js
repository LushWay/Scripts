import { Entity, Player, Vector, world } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { Temporary } from 'lib/Class/Temporary.js'
import { GAME_UTILS } from 'smapi.js'
import { Place } from './Action.js'

// // @ts-expect-error Bruh
// Set.prototype.toJSON = function () {
//   return 'Set<size=' + this.size + '>'
// }

/**
 * @typedef {{
 * 	active: string,
 * 	completed?: string[],
 * 	step?: number,
 * 	additional?: any
 * }} QuestDB
 */

export class Quest {
  /** @type {import("./Sidebar.js").SidebarLinePreinit} */
  static sidebar = {
    preinit(sidebar) {
      const onquestupdate = sidebar.update.bind(sidebar)

      return function (player) {
        const status = Quest.active(player)
        if (!status) return false

        const listeners = status.quest.steps(player).updateListeners
        if (!listeners.has(onquestupdate)) listeners.add(onquestupdate)

        return `§6Квест: §f${
          status.quest.displayName
        }\n${status.step.text()}\n§6Подробнее: §f-q`
      }
    },
  }

  /**
   * @type {Record<string, Quest>}
   */
  static instances = {}

  /**
   * @type {Record<string, PlayerQuest>}
   */
  players = {}

  /**
   * @param {Player} player
   */
  steps(player) {
    if (this.players[player.id]) return this.players[player.id]

    this.players[player.id] = new PlayerQuest(this, player)
    this.init(this.players[player.id], player)

    world.afterEvents.playerLeave.subscribe(
      ({ playerId }) => delete this.players[playerId]
    )

    return this.players[player.id]
  }

  /**
   * @param {object} options
   * @param {string} options.displayName
   * @param {string} options.name
   * @param {(q: PlayerQuest, p: Player) => void} init
   */
  constructor({ name, displayName }, init) {
    this.name = name
    this.displayName = displayName
    this.init = init
    Quest.instances[this.name] = this
    world.getAllPlayers().forEach(setQuests)
  }

  /**
   * @param {Player} player
   */
  enter(player) {
    this.step(player, 0)
  }

  /**
   * @param {Player} player
   * @param {number} stepNum
   */
  step(player, stepNum, restore = false) {
    const data = player.database
    data.quest ??= {
      active: this.name,
    }
    data.quest.active = this.name

    if (!restore) delete data.quest.additional
    data.quest.step = stepNum

    const step = this.steps(player).list[stepNum]
    if (!step) return false
    step.cleanup = step.activate?.(!restore).cleanup
  }

  /**
   * @param {Player} player
   */
  exit(player) {
    const data = player.database
    if (data.quest && typeof data.quest.step !== 'undefined') {
      this.steps(player).list[data.quest?.step].cleanup?.()
      delete this.players[player.id]
    }

    data.quest = {
      active: '',
      completed: data.quest?.completed ?? [],
    }
  }

  /**
   * @param {Player} player
   */
  static active(player) {
    const data = player.database
    if (!data.quest || typeof data.quest.active === 'undefined') return false

    const quest = Quest.instances[data.quest.active]
    if (!quest || typeof data.quest.step === 'undefined') return false

    return {
      quest,
      stepNum: data.quest.step,
      step: quest.steps(player).list[data.quest.step],
    }
  }
}

/**
 * @param {Player} player
 */
function setQuests(player) {
  const status = Quest.active(player)
  if (!status) return

  status.quest.step(player, status.stepNum, true)
}

world.afterEvents.playerSpawn.subscribe(({ player }) => setQuests(player))

/**
 * @typedef {string | (() => string)} QuestText
 */

/**
 * @typedef {{
 *   text: QuestText,
 *   description?: QuestStepInput["text"]
 *   activate?(firstTime: boolean): { cleanup(): void }
 * }} QuestStepInput
 */

/**
 * @typedef {{
 *   next(): void
 *   cleanup?(): void
 *   player: Player
 *   quest: Quest
 *   text: () => string
 *   error(text: string): ReturnType<NonNullable<QuestStepInput['activate']>>
 *   description?: QuestStepThis['text']
 * } & Omit<QuestStepInput, 'text' | 'description'> & Pick<PlayerQuest, "quest" | "player" | "update">} QuestStepThis
 */

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
      description:
        typeof description === 'string' ? () => description : description,

      player: this.player,
      update: this.update.bind(this),
      quest: this.quest,
      next() {
        this.cleanup?.()
        if (step.list[i + 1]) {
          this.quest.step(this.player, i + 1)
        } else {
          this.quest.exit(this.player)
          step._end()
          delete this.quest.players[this.player.id]
        }
        this.update()
        step.updateListeners.clear()
      },
      error(text) {
        this.player.tell('§cУпс, квест сломался: ' + text)
        return { cleanup() {} }
      },
    }

    // Share properties between mixed objects
    Object.setPrototypeOf(options, ctx)
    this.list.push(ctx)
    return ctx
  }

  /**
   *
   * @param {(this: QuestStepThis) => void} action
   */
  start(action) {
    this.dynamic({
      text: '',
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
   */
  place(from, to, text, description = text) {
    this.dynamic({
      text,
      description,
      activate() {
        /** @type {ReturnType<typeof Place.action>[]} */
        const actions = []
        for (const pos of Vector.foreach(from, to)) {
          actions.push(
            Place.action(pos, player => {
              if (player.id !== this.player.id) return

              this.next()
            })
          )
        }

        const temp = this.quest
          .steps(this.player)
          .createTargetMarkerInterval({ place: Vector.slerp(from, to, 0.5) })

        return {
          cleanup() {
            temp.cleanup()
            actions.forEach(e => {
              Place.actions[e.id].delete(e.action)
            })
          },
        }
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
        const data = this.player.database
        if (data.quest) data.quest.additional = result

        // Updating interface
        options.value = result
        this.update()
      } else {
        this.next()
      }
    }

    const inputedActivate = options.activate?.bind(options)
    options.activate = function (firstTime) {
      if (!this.player) throw new Error('Wrong this!')
      const data = this.player.database
      if (typeof data.quest?.additional === 'number')
        options.value = data.quest?.additional

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
    const location = GAME_UTILS.safeGet(options.npcEntity, 'location')
    if (!location) return this.failed('Неигровой персонаж недоступен')

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
   * @param {string} reason
   */
  failed(reason) {
    this.dynamic({
      activate: () => {
        this.player.playSound(SOUNDS.fail)
        this.player.tell(reason)
        this.quest.exit(this.player)
        return { cleanup() {} }
      },
      text: () => '',
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
   *   interval?: VoidFunction & ThisParameterType<MarkerOptions>
   * }} MarkerOptions
   */

  /**
   * @param {MarkerOptions} options
   */
  createTargetMarkerInterval(options) {
    const temp = new Temporary(({ system }) => {
      system.runInterval(
        () => {
          options.interval?.()

          if (!options.place) return

          const head = this.player.getHeadLocation()
          const playerViewDirection = this.player.getViewDirection()
          const targetPosition = Vector.add(options.place, {
            x: 0.5,
            y: 0.5,
            z: 0.5,
          })
          const targetRelative = Vector.subtract(targetPosition, head)
          const distance = Vector.distance(Vector.zero, targetRelative)
          const relative = Vector.multiply(playerViewDirection, distance)

          this.player.dimension.spawnParticle(
            'minecraft:balloon_gas_particle',
            Vector.add(head, relative)
          )
        },
        'Quest place marker particle',
        20
      )
    }, options.temporary)
    return temp
  }
}
