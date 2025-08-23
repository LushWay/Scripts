import { Player } from '@minecraft/server'
import { developersAreWarned } from 'lib/assets/text'
import { EventSignal } from 'lib/event-signal'
import { Message } from 'lib/i18n/message'
import { i18n } from 'lib/i18n/text'
import { Compass } from 'lib/rpg/menu'
import { Temporary } from 'lib/temporary'
import { doNothing } from 'lib/util'
import { VectorInDimension } from 'lib/utils/point'
import { Vec } from 'lib/vector'
import { PlayerQuest } from './player'
import { Quest } from './quest'

export namespace QS {
  export type TextT = Text | TextFn
  export type TextFn = (...args: any[]) => Text

  export type Activator<T extends QS> = (ctx: T, firstTime: boolean) => Cleanup

  export type Cleanup = {
    cleanup(this: void): void
  } | void
}

export abstract class QSBuilder<S extends QS> {
  constructor(protected readonly step: S) {}

  create(args: [text: QS.TextT, ...args: any[]]) {
    this.step.text = this.toFn(args[0])
  }

  /**
   * Sets quest step description
   *
   * @param text - Text to display
   */
  description(text: QS.TextT) {
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
   * @param target - Place to target compass to
   */
  target(target: VectorInDimension | undefined) {
    this.step.target = target
    return this
  }

  private toFn(text: QS.TextT): QS.TextFn {
    return typeof text === 'string' || text instanceof Message ? () => text : text
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
    super(doNothing)
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
        this.error(i18n.error`При активации шага произошла ошибка. ${developersAreWarned}`)
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
  error(text: Text) {
    this.player.fail(i18n.error`Задание сломалось: ${text}`.to(this.player.lang))
    return this
  }

  /** Returns database assotiated with this quest step. Do note that after step switching it will be cleared. */
  get db() {
    return this.quest.getDatabase(this.player)?.db as DB | undefined
  }

  set db(value) {
    const active = this.quest.getDatabase(this.player)
    if (active) active.db = value
  }

  /**
   * Whenether quest is displayed on the screen using actionbar or not. Used for detecting whenether to show compass or
   * not
   */
  private get isActive() {
    return Quest.getCurrentStepOf(this.player) === this
  }

  /** Last set place thro {@link target} */
  private currentPlace?: VectorInDimension

  /** Sets place to player compass should target to */
  get target() {
    return this.currentPlace
  }

  set target(place) {
    this.currentPlace = place

    if (!this.compassIntervalSetup) {
      this.compassIntervalSetup = true
      this.onInterval(() => {
        if (this.isActive && this.target && Vec.isValid(this.target.location)) {
          if (this.target.dimensionType === this.player.dimension.type)
            Compass.setFor(this.player, this.target.location)
          else Compass.setFor(this.player, undefined)
        }
      })

      this.cleaners.push(() => Compass.setFor(this.player, undefined))
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
          if (!this.player.isValid) return
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
