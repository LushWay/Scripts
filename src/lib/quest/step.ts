import { Player } from '@minecraft/server'
import { developersAreWarned } from 'lib/assets/text'
import { EventSignal } from 'lib/event-signal'
import { Compass } from 'lib/rpg/menu'
import { Temporary } from 'lib/temporary'
import { Vector } from 'lib/vector'
import { PlayerQuest } from './player'
import { Quest } from './quest'

export namespace QS {
  export type Text = string | TextFn
  export type TextFn = (...args: any[]) => string

  export type Activator<T extends QS> = (ctx: T, firstTime: boolean) => Cleanup

  export type Cleanup = {
    cleanup(this: void): void
  } | void
}

export abstract class QSBuilder<S extends QS> {
  constructor(protected readonly step: S) {}

  create(args: [text: QS.Text, ...args: any[]]) {
    this.step.text = this.toFn(args[0])
  }

  /**
   * Sets quest step description
   *
   * @param text - Text to display
   */
  description(text: QS.Text) {
    this.step.description = this.toFn(text)
    return this
  }

  /**
   * Subscribes provided callback to time when this step is activated
   *
   * @param activate - Callback to subscribe
   */
  activate(activate: QS.Activator<S>) {
    this.step.onActivate(activate)
    return this
  }

  /**
   * Sets place where to target compass to
   *
   * @param place - Place to target compass to
   */
  place(place: Vector3) {
    this.step.place = place
    return this
  }

  private toFn(text: QS.Text) {
    return typeof text === 'string' ? () => text : text
  }
}

/** Quest step base class */
export abstract class QS<DB = any> extends Temporary {
  constructor(
    public quest: Quest,
    public player: Player,
    public playerQuest: PlayerQuest,
    public readonly next: VoidFunction,
  ) {
    super(() => void 0)
  }

  text: QS.TextFn = () => ''

  description?: QS.TextFn

  private activators = new Set<QS.Activator<any>>()

  /**
   * Adds callback function that will be called when quest step is becoming active
   *
   * @param callback - Callback function
   */
  onActivate(callback: QS.Activator<any>) {
    this.activators.add(callback)
  }

  /** Hook for custom quest steps to run */
  protected abstract activate(firstRun: boolean): QS.Cleanup

  restoring = false

  /**
   * Enters player in this step
   *
   * @param firstTime - Whenether function is called in quest restore mode or in first time
   */
  enter(firstTime: boolean) {
    const cleanup = this.activate(firstTime)
    if (cleanup) this.cleaners.push(cleanup.cleanup)

    this.activators.forEach(activate => {
      try {
        const result = activate(this, firstTime)
        if (result) this.cleaners.push(result.cleanup)
      } catch (e) {
        this.error(`При активации шага произошла ошибка. ${developersAreWarned}`)
        throw e
      }
    })
  }

  /** Updates step sidebar info */
  update() {
    this.playerQuest.update()
  }

  /**
   * Prints error to the player
   *
   * @param text - Text to print
   */
  error(text: string) {
    this.player.fail('§cУпс, задание сломалось: ' + text)
    return this
  }

  /** Returns database assotiated with this quest step. Do note that after step switching it will be cleared. */
  get db() {
    return this.getDatabase()?.db as DB | undefined
  }

  set db(value) {
    const active = this.getDatabase()
    if (active) active.db = value
  }

  private getDatabase() {
    return this.player.database.quests?.active.find(e => e.id === this.quest.id)
  }

  /**
   * Whenether quest is displayed on the screen using actionbar or not. Used for detecting whenether to show compass or
   * not
   */
  private get isActive() {
    return Quest.getCurrentStepOf(this.player) === this
  }

  /** Last set place thro {@link place} */
  private currentPlace?: Vector3

  /** Sets place to player compass should target to */
  get place() {
    return this.currentPlace
  }

  set place(place) {
    this.currentPlace = place

    if (!this.compassIntervalSetup) {
      this.compassIntervalSetup = true

      this.onInterval(() => {
        if (this.isActive && this.place && Vector.valid(this.place)) Compass.setFor(this.player, this.place)
      })

      this.cleaners.push(() => {
        Compass.setFor(this.player, undefined)
      })
    }
  }

  private compassIntervalSetup = false

  private intervals: VoidFunction[] = []

  private intervalId: number | undefined

  /**
   * Adds callback function to the interval that will be executed each 10 ticks while the quest step is active
   *
   * @param callback - Callback function
   */
  onInterval(callback: VoidFunction) {
    this.intervals.push(callback)

    // First time, run interval
    if (typeof this.intervalId === 'undefined') {
      this.intervalId = this.system.runInterval(
        () => {
          if (!this.player.isValid()) return
          if (this.cleaned) return
          this.intervals.forEach(e => e())
        },
        'quest step',
        10,
      )
    }
  }

  /** Specific to quest step world. All event subscriptions will be auto unsubscribed after quest step has been switched. */
  get world() {
    return this.proxies.world
  }

  /**
   * Specific to quest step system. All event subscriptions, intervals and timeouts will be auto unsubscribed after
   * quest step has been switched.
   */
  get system() {
    return this.proxies.system
  }

  subscribe<T extends EventSignal<any>>(eventSignal: T, callback: EventSignal.Callback<T>, position?: number) {
    eventSignal.subscribe(callback, position)
    this.cleaners.push(() => eventSignal.unsubscribe(callback))
    return callback
  }
}
