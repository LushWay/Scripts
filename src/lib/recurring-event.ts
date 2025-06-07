import { system } from '@minecraft/server'
import { fromMsToTicks } from 'lib/utils/ms'
import { table } from './database/abstract'
import { setDefaults } from './database/defaults'
import later, { Later } from './utils/later'

later.runtime = {
  setTimeout: (fn, delayMs) => system.runTimeout(fn, 'laterSetTimeout', fromMsToTicks(delayMs)),
  clearTimeout: handle => system.clearRun(handle),
}

later.date.localTime()

export namespace RecurringEvent {
  export interface DB<T = unknown> {
    nextRun: string
    storage: T
  }
}

export class RecurringEvent<T extends JsonObject = JsonObject> {
  static db = table<RecurringEvent.DB>('recurringEvents', () => ({ nextRun: '', storage: {} }))

  protected db: RecurringEvent.DB<T>

  protected schedule: Later.Schedule

  stop: VoidFunction

  getNextEventDate: () => Date

  constructor(
    readonly id: string,
    scheduleRaw: Later.ScheduleData,
    protected readonly createStorage: () => T,
    protected readonly callback: (storage: T, afterOffline: boolean) => void,
    protected readonly runAfterOffline = false,
  ) {
    this.schedule = later.schedule(scheduleRaw)
    this.getNextEventDate = () => this.schedule.next(1) as Date

    this.db = RecurringEvent.db.get(id) as RecurringEvent.DB<T>
    this.db.storage = setDefaults(this.db.storage, this.createStorage())

    const interval = later.setInterval(this.run.bind(this), scheduleRaw)
    this.stop = interval.clear.bind(interval)

    if (runAfterOffline && this.db.nextRun !== this.getNextEventDate().toString()) this.run(true)
  }

  protected run(afterOffline = false) {
    this.db.nextRun = this.getNextEventDate().toString()
    this.callback(this.db.storage, afterOffline)
  }
}
