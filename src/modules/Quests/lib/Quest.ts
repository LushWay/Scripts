import { ContainerSlot, Entity, Player, Vector, system, world } from '@minecraft/server'
import { Airdrop, Compass, InventoryIntervalAction, Join, LootTable, PlaceAction, Settings, Temporary } from 'lib'
import { SOUNDS } from 'lib/assets/config'
import { isNotPlaying } from 'modules/WorldEdit/isBuilding'

export type QuestDB = {
  active: {
    id: string
    step: number
    db?: unknown
  }[]
  completed: string[]
}

export class Quest {
  static error = class QuestError extends Error {}

  static playerSettingsName: [displayName: string, id: string] = ['Задания', 'quest']

  static playerSettings = Settings.player(...this.playerSettingsName, {
    messageForEachStep: {
      value: true,
      name: 'Сообщение в чат при каждом шаге',
      description: 'Отправлять ли сообщение в чат при каждом новом разделе задания',
    },
  })

  static sidebar: import('lib/Sidebar').SidebarLineInit<unknown> = {
    init(sidebar) {
      const onquestupdate = sidebar.show.bind(sidebar)

      return function (player: Player) {
        // @ts-expect-error TS(2554) FIXME: Expected 2 arguments, but got 1.
        const status = Quest.active(player)
        if (!status) return false

        const listeners = status.quest.steps(player).updateListeners
        if (!listeners.has(onquestupdate)) listeners.add(onquestupdate)

        return `§f§l${status.quest.name}:§r§6 ${status.step?.text()}`
      }
    },
  }

  /** @type {Record<string, Quest>} */
  static list: Record<string, Quest> = {}

  description

  id

  init

  name

  /**
   * @param {Player} player
   * @param {Quest} [quest]
   */
  static active(player: Player, quest: Quest) {
    const db = player.database
    const dbquest = quest ? db.quests?.active.find((q: { id: string }) => q.id === quest?.id) : db.quests?.active[0]
    if (!dbquest) return false

    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    quest ??= Quest.list[dbquest.id]
    if (!quest) return false

    return {
      quest,
      stepIndex: dbquest.step,
      step: quest.steps(player).list[dbquest.step],
    }
  }

  /** @type {Record<string, PlayerQuest>} */
  players: Record<string, PlayerQuest> = {}

  /**
   * @param {object} options
   * @param {string} options.name
   * @param {string} options.id
   * @param {string} options.desc
   * @param {(q: PlayerQuest, p: Player) => void} init
   */
  constructor(
    { id, name, desc }: { name: string; id: string; desc: string },
    init: (q: PlayerQuest, p: Player) => void,
  ) {
    this.id = id
    this.name = name
    this.init = init
    this.description = desc

    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    Quest.list[this.id] = this

    // @ts-expect-error TS(2304) FIXME: Cannot find name 'Core'.
    Core.afterEvents.worldLoad.subscribe(() => {
      world.getAllPlayers().forEach(e => setQuest(e, this))
    })
  }

  /** @param {Player} player */
  steps(player: Player) {
    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    if (this.players[player.id]) return this.players[player.id]

    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    this.players[player.id] = new PlayerQuest(this, player)

    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    this.init(this.players[player.id], player)

    world.afterEvents.playerLeave.subscribe(
      ({
        playerId,
        // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      }) => delete this.players[playerId],
    )

    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    return this.players[player.id]
  }

  /** @param {Player} player */
  enter(player: Player) {
    this.toStep(player, 0)
  }

  /**
   * @param {Player} player
   * @param {number} stepIndex
   */
  toStep(player: Player, stepIndex: number, restore = false) {
    const quests = (player.database.quests ??= {
      active: [],
      completed: [],
    })

    let active = quests.active.find((e: { id: string }) => e.id === this.id)
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

    if (Quest.playerSettings(player).messageForEachStep) {
      const text = step.text()

      if (text) player.success(`§f§l${this.name}: §r§6${step.description ? step.description() : step.text()}`)
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
        20,
      )
    }

    step.cleanup = step.activate?.(!restore).cleanup
  }

  /** @param {Player} player */
  current(player: Player) {
    const steps = Quest.active(player, this)
    if (!steps) return false

    return steps.step
  }

  /** @param {Player} player */
  exit(player: Player, end = false) {
    const db = player.database
    if (!db.quests) return

    const active = db.quests.active.find((q: { id: string }) => q.id === this.id)
    if (active) {
      this.steps(player).list[active.step].cleanup?.()

      // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      delete this.players[player.id]
    }

    db.quests.active = db.quests.active.filter((q: any) => q !== active)
    if (end) db.quests.completed.push(this.id)
  }
}

Join.onMoveAfterJoin.subscribe(({ player }) => setQuests(player))

/** @param {Player} player */
function setQuests(player: Player) {
  system.delay(() => {
    player.database.quests?.active.forEach((db: { id: string | number }) => {
      // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      const quest = Quest.list[db.id]
      if (!quest) return

      setQuest(player, quest, db)
    })
  })
}

function setQuest(
  player: Player,
  quest: Quest,
  db = player.database.quests?.active.find((e: { id: any }) => e.id === quest.id),
) {
  if (db) quest.toStep(player, db.step, true)
}

/** @typedef {() => string} DynamicQuestText */

/** @typedef {string | DynamicQuestText} QuestText */

/**
 * @typedef {{
 *   text: QuestText
 *   description?: QuestText
 *   activate?(firstTime: boolean): { cleanup(): void }
 * }} QuestStepInput
 */

/** @template [DB=unknown] Default is `unknown` . Default is `unknown` */
type QuestStepThis = {
  next(): void
  cleanup?(): void
  player: Player
  quest: Quest
  text: DynamicQuestText
  description?: DynamicQuestText
  error(text: string): ReturnType<NonNullable<QuestStepInput['activate']>>
  db: DB | undefined
} & Omit<QuestStepInput, 'text' | 'description'> &
  Pick<PlayerQuest, 'quest' | 'player' | 'update'>

// TODO Add main quest switching

class PlayerQuest {
  player

  quest

  /**
   * @param {Quest} parent
   * @param {Player} player
   */
  constructor(parent: Quest, player: Player) {
    this.quest = parent
    this.player = player
  }

  /** @type {QuestStepThis[]} */
  list: QuestStepThis[] = []

  /** @type {Set<(p: Player) => void>} */
  updateListeners: Set<(p: Player) => void> = new Set()

  update() {
    // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
    this.updateListeners.forEach(e => e(this.player))
  }

  /** @param {QuestStepInput & ThisType<QuestStepThis>} options */
  dynamic(options: QuestStepInput & ThisType<QuestStepThis>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const step = this
    const i = this.list.length
    const { text, description } = options

    /** @type {PlayerQuest['list'][number]} */
    const ctx: PlayerQuest['list'][number] = {
      ...options,
      text: typeof text === 'string' ? () => text : text,
      description: typeof description === 'string' ? () => description : description,

      get db() {
        return this.player.database.quests?.active.find((e: { id: any }) => e.id === this.quest.id)?.db
      },
      set db(value) {
        const active = this.player.database.quests?.active.find((e: { id: any }) => e.id === this.quest.id)
        if (active) active.db = value
      },
      player: this.player,
      update: this.update.bind(this),
      quest: this.quest,
      next() {
        if (isNotPlaying(this.player)) return
        this.cleanup?.()
        if (step.list[i + 1]) {
          this.quest.toStep(this.player, i + 1)
        } else {
          this.quest.exit(this.player, true)
          step._end()
          delete this.quest.players[this.player.id]
        }
        this.update()
        step.updateListeners.clear()
      },
      error(text: string) {
        this.player.fail('§cУпс, задание сломалось: ' + text)
        return { cleanup() {} }
      },
    }

    // Share properties between mixed objects
    Object.setPrototypeOf(options, ctx)

    // @ts-expect-error TS(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
    this.list.push(ctx)
    return ctx
  }

  /**
   * Waits for item in the inventory
   *
   * @param {Omit<QuestStepInput, 'activate'> & {
   *   isItem: (item: ContainerSlot) => boolean
   * } & ThisType<QuestStepThis>} options
   */

  // @ts-expect-error TS(7031) FIXME: Binding element 'isRequestedItem' implicitly has a... Remove this comment to see the full error message
  item({
    isItem: isRequestedItem,
    ...options
  }: Omit<QuestStepInput, 'activate'> & {
    isItem: (item: ContainerSlot) => boolean
  } & ThisType<QuestStepThis>) {
    this.dynamic({
      ...options,
      activate() {
        // @ts-expect-error TS(2554) FIXME: Expected 2 arguments, but got 1.
        return new Temporary(() => {
          const action = InventoryIntervalAction.subscribe(({ player, slot }) => {
            if (player.id !== this.player.id) return
            if (isRequestedItem(slot)) this.next()
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
   * @param {Vector3} from
   * @param {Vector3} to
   * @param {QuestText} text
   * @param {QuestText} [description]
   */
  place(from: Vector3, to: Vector3, text: QuestText, description: QuestText) {
    // Unwrap vectors to not loose reference. For some reason, that happens
    from = { x: from.x, y: from.y, z: from.z }
    to = { x: to.x, y: to.y, z: to.z }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    this.dynamic({
      text,
      description,
      activate() {
        // @ts-expect-error TS(2554) FIXME: Expected 2 arguments, but got 1.
        const temporary = new Temporary(() => {
          const actions = [...Vector.foreach(from, to)].map(pos =>
            // @ts-expect-error TS(2554) FIXME: Expected 3 arguments, but got 2.
            PlaceAction.onEnter(pos, player => {
              if (player.id !== this.player.id) return

              this.next()
            }),
          )

          return {
            cleanup() {
              actions.forEach(a => a.unsubscribe())
            },
          }
        })

        // console.log('q.place', { from: Vector.string(from), to: Vector.string(to) })
        const { x, y, z } = Vector.lerp(from, to, 0.5)

        self.targetCompassTo({ place: { x, y, z }, temporary })
        return temporary
      },
    })
  }

  /**
   * @typedef {{
   *   text(value: number): string
   *   description?: QuestCounterInput['text']
   *   end: number
   *   value?: number
   * } & Omit<QuestStepInput, 'text' | 'description'>} QuestCounterInput
   */

  /**
   * @typedef {QuestStepThis & { diff(this: QuestStepThis, m: number): void } & Omit<
   *     QuestCounterInput,
   *     'text' | 'description'
   *   >} QuestCounterThis
   */

  /** @param {QuestCounterInput & Partial<QuestCounterThis> & ThisType<QuestCounterThis>} options */
  counter(options: QuestCounterInput & Partial<QuestCounterThis> & ThisType<QuestCounterThis>) {
    options.value ??= 0

    options.diff = function (diff: any) {
      if (isNotPlaying(this.player)) return
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
    options.activate = function (firstTime: any) {
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
   *   placeText?: QuestStepInput['text']
   *   placeDescription?: QuestStepInput['text']
   *   talkText: QuestStepInput['text']
   *   talkDescription?: QuestStepInput['text']
   * } & QuestStepInput} QuestDialogueInput
   */

  /** @typedef {QuestStepThis & QuestDialogueInput} QuestDialogueThis */

  /** @param {QuestDialogueInput & Partial<QuestDialogueThis> & ThisType<QuestDialogueThis>} options */
  dialogue(options: QuestDialogueInput & Partial<QuestDialogueThis> & ThisType<QuestDialogueThis>) {
    if (!options.npcEntity.isValid()) return this.failed('Неигровой персонаж недоступен')
    const location = options.npcEntity.location

    options.placeText ??= () => 'Доберитесь до ' + options.npcEntity.nameTag

    this.place(
      Vector.add(location, Vector.multiply(Vector.one, -1)),
      Vector.add(location, Vector.one),
      options.placeText,
      options.placeDescription,
    )
    this.dynamic({
      text: options.talkText,
      description: options.talkDescription,
      activate() {
        // @ts-expect-error TS(2554) FIXME: Expected 2 arguments, but got 1.
        return new Temporary(({ system }) => {
          system.afterEvents.scriptEventReceive.subscribe(
            (event: { id: string; initiator: { id: any } }) => {
              if (event.id !== 'quest:dialogue.end' || !event.initiator) return
              if (event.initiator.id !== this.player.id) return
              this.next()
            },
            {
              namespaces: ['quest'],
            },
          )
        })
      },
    })
  }

  /**
   * @typedef {{
   *   text?: (AirdropPos: string) => string
   * } & (
   *   | {
   *       spawnAirdrop: (key: string | undefined) => Airdrop
   *     }
   *   | ({ lootTable: LootTable } & ({ location: Vector3 } | { abovePlayerY?: number }))
   * )} QuestAirdropInput
   */

  /** @typedef {Partial<QuestStepThis> & QuestAirdropInput} QuestAirdropThis */

  /** @param {QuestAirdropInput & ThisType<QuestAirdropThis>} options */
  airdrop(options: QuestAirdropInput & ThisType<QuestAirdropThis>) {
    if (!this.player.isValid()) return
    const spawnAirdrop =
      'spawnAirdrop' in options
        ? options.spawnAirdrop
        : (/** @type {string | undefined} */ key: string | undefined) =>
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
              key,
            )

    let airdroppos = ''
    this.dynamic({
      text: () => (options.text ? options.text(airdroppos) : '§6Забери аирдроп' + airdroppos),
      activate() {
        /** @type {Airdrop | undefined} */
        let airdrop: Airdrop | undefined

        // Saving/restoring/debugging airdrop
        const debugAirdrop = () => {
          if (typeof this.db === 'string') {
            if (this.db in Airdrop.db) {
              airdrop = spawnAirdrop(this.db)
            } else {
              console.error(
                new Quest.error(`No airdrop found, player '${this.player.name}§r', quest: ${this.quest.id}`),
              )
              system.delay(() => this.next())
              return { cleanup() {} }
            }
          } else {
            airdrop = spawnAirdrop()
          }

          this.db = airdrop.id
        }

        debugAirdrop()
        if (!airdrop || !airdrop.chestMinecart) return this.error('Не удалось вызвать аирдроп')

        // @ts-expect-error TS(2554) FIXME: Expected 2 arguments, but got 1.
        const temporary = new Temporary(({ world, system, cleanup }) => {
          system.runInterval(() => debugAirdrop(), 'PlayerQuest.airdrop debug', 20)

          world.afterEvents.playerInteractWithEntity.subscribe(
            (event: { target: { id: any }; player: { id: any } }) => {
              if (!airdrop) return cleanup()

              const airdropEntity = airdrop.chestMinecart
              if (!airdropEntity) return
              if (event.target.id !== airdropEntity.id) return

              if (this.player.id === event.player.id) {
                system.delay(() => this.next())
              }
            },
          )

          world.afterEvents.entityDie.subscribe((event: { deadEntity: { id: any } }) => {
            if (!airdrop) return cleanup()

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
            if (!airdrop) return temporary.cleanup()

            const airdropEntity = airdrop.chestMinecart
            if (!airdropEntity || !airdropEntity.isValid()) return

            this.place = airdropEntity.location

            if (i === 1) {
              i = 0
              airdrop.showParticleTrace(this.place)
            } else {
              i++
            }

            airdroppos = ` на\n§f${Vector.string(Vector.floor(this.place), true)}`
            qthis.update()
          },
          temporary,
        })

        return temporary
      },
    })
  }

  /** @param {string} reason */
  failed(reason: string) {
    this.dynamic({
      activate: () => {
        this.player.fail(reason)
        this.quest.exit(this.player)
        return { cleanup() {} }
      },
      text: () => '§cЗадание сломалось: ' + reason,
    })
  }

  /** @private */
  _end = () => {}

  /** @param {(this: PlayerQuest) => void} action */
  end(action: (this: PlayerQuest) => void) {
    this._end = action
  }

  /** @param {CompassOptions} options */
  targetCompassTo(options: CompassOptions) {
    options.temporary = new Temporary(({ system }) => {
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
        20,
      )

      return {
        cleanup: () => {
          Compass.setFor(this.player, undefined)
        },
      }
    }, options.temporary)

    return options
  }
}

type CompassOptions = {
  place: Vector3
  temporary?: Temporary
  interval?: VoidFunction & ThisType<CompassOptions>
}
