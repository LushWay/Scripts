/* i18n-ignore */

type Time = 'year' | 'month' | 'day' | 'hour' | 'min' | 'sec' | 'ms'

// eslint-disable-next-line @typescript-eslint/naming-convention
export class ms {
  static converters: Record<Time, { time: number; name: keyof Intl.Duration }> = {
    ms: { time: 1, name: 'milliseconds' },
    sec: { time: 1000, name: 'seconds' },
    min: { time: 1000 * 60, name: 'minutes' },
    hour: { time: 1000 * 60 * 60, name: 'hours' },
    day: { time: 1000 * 60 * 60 * 24, name: 'days' },
    month: { time: 1000 * 60 * 60 * 24 * 30, name: 'months' },
    year: { time: 1000 * 60 * 60 * 24 * 30 * 12, name: 'years' },
  }

  /** Converts provided time to ms depending on the type */
  static from(type: Time, num: number) {
    return this.converters[type].time * num
  }
}

export function fromTicksToMs(ticks: number) {
  return ~~(ticks * 50)
}

export function fromMsToTicks(ms: number) {
  return ~~(ms * 0.02)
}
