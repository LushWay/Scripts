import { system, TicksPerSecond } from '@minecraft/server'

const extraMinutesThreshhold = 3

export class RegularEvent {
  static events = new Set<RegularEvent>()

  static {
    system.runJobInterval(
      function* regularEvent(this: typeof RegularEvent) {
        const runDate = this.runDate()
        for (const regularEvent of this.events) {
          regularEvent.processEvent(undefined, runDate)
          yield
        }
      }.bind(this),
      TicksPerSecond * 30,
    )
  }

  static runDate(date = new Date()) {
    return date.toISOString().split('T')[0] ?? ''
  }

  processEvent(date = new Date(), runDate: string) {
    if (this.ran === runDate) return

    const minutes = date.getMinutes()
    const hours = date.getHours()

    if (this.shouldFire(hours, minutes)) this.run(runDate)
  }

  shouldFire(h: number, m: number) {
    if (this.shouldFireIfMissed) {
      if (h >= this.hours && m >= this.minutes) return true
    } else {
      if (this.hours === h && this.minutes <= m && m <= this.minutes + extraMinutesThreshhold) {
        return true
      }
    }

    return false
  }

  ran = ''

  run(ranDate: string) {
    this.ran = ranDate
    this.callback()
  }

  constructor(
    readonly hours: number,
    readonly minutes: number,
    readonly shouldFireIfMissed = false,
    readonly callback: VoidFunction,
  ) {
    RegularEvent.events.add(this)
  }
}
