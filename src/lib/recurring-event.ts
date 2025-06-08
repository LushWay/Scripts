import { system } from '@minecraft/server'
import { Temporary, TemporaryProxies } from 'lib/temporary'
import { fromMsToTicks } from 'lib/utils/ms'
import { table } from './database/abstract'
import { setDefaults } from './database/defaults'
import later, { Later } from './utils/later'

later.runtime = {
  setTimeout: (fn, delayMs) => system.runTimeout(fn, 'laterSetTimeout', fromMsToTicks(delayMs)),
  clearTimeout: handle => system.clearRun(handle),
}

later.date.localTime()

interface DB<T = unknown> {
  lastRun: string
  storage: T
}

interface RecurringOptions {
  runAfterOffline?: boolean
}

interface RecurringCallbackContext {
  restoreAfterOffline: boolean
  lastRun: Date
}

type RecurringEventCallback<T extends JsonObject = JsonObject> = (storage: T, ctx: RecurringCallbackContext) => void

export class RecurringEvent<T extends JsonObject = JsonObject> {
  static db = table<DB>('recurringEvents', () => ({ lastRun: '', storage: {} }))

  protected db: DB<T>

  protected schedule: Later.Schedule

  protected interval: Later.Timer

  stop() {
    this.interval.clear()
  }

  getNextOccurances(n: number): Date[] {
    return n === 1 ? [this.schedule.next(n)] : this.schedule.next(n)
  }

  getLastRunDate() {
    return this.schedule.prev(1)
  }

  constructor(
    readonly id: string,
    readonly scheduleData: Later.ScheduleData,
    protected readonly createStorage: () => T,
    protected readonly callback: RecurringEventCallback<T>,
    { runAfterOffline = false }: RecurringOptions = {},
  ) {
    this.schedule = later.schedule(scheduleData)
    this.db = RecurringEvent.db.get(id) as DB<T>
    this.db.storage = setDefaults(this.db.storage, this.createStorage())

    this.interval = later.setInterval(this.run.bind(this), scheduleData)

    if (runAfterOffline) this.run(this.db.lastRun === this.getLastRunDate().toString())
  }

  protected run(restoreAfterOffline = false) {
    const lastRun = this.getLastRunDate()
    this.db.lastRun = lastRun.toString()
    this.callback(this.db.storage, { restoreAfterOffline, lastRun })
  }
}

interface DurationalRecurringCallbackContext {
  temp: TemporaryProxies
}

export type DurationalRecurringCallback<T extends JsonObject = JsonObject> = (
  storage: T,
  ctx: DurationalRecurringCallbackContext,
) => void

export class DurationalRecurringEvent<T extends JsonObject = JsonObject> extends RecurringEvent<T> {
  constructor(
    id: string,
    scheduleData: Later.ScheduleData,
    readonly duration: number,
    createStorage: () => T,
    durationalCallback: DurationalRecurringCallback<T>,
  ) {
    super(
      id,
      scheduleData,
      createStorage,
      (storage, ctx) => {
        // If since start elapsed more time then event runs, skip
        if (Date.now() - ctx.lastRun.getTime() > duration) return

        const temp = new Temporary(ctx => {
          ctx.system.runTimeout(() => ctx.cleanup(), id, fromMsToTicks(duration))
        })

        durationalCallback(storage, { temp: temp.proxies })
      },
      { runAfterOffline: true },
    )
  }
}
