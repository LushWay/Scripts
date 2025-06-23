/* i18n-ignore */
import { Plurals, ngettext } from './ngettext'

type Time = 'year' | 'month' | 'day' | 'hour' | 'min' | 'sec' | 'ms'

// eslint-disable-next-line @typescript-eslint/naming-convention
export class ms {
  /**
   * Parses the remaining time in milliseconds into a more human-readable format
   *
   * @example
   *   const {type, value} = ms.remaining(1000)
   *   console.log(value + ' ' + type) // 1 секунда
   *
   * @example
   *   const {type, value} = ms.remaining(1000 * 60 * 2)
   *   console.log(value + ' ' + type) // 2 минуты
   *
   * @example
   *   const {type, value} = ms.remaining(1000 * 60 * 2, { converters: ['sec' ]}) // only convert to sec
   *   console.log(value + ' ' + type) // 120 секунд
   *
   * @param ms - Milliseconds to parse from
   * @param options - Convertion options
   * @param options.converters - List of types to convert to. If some time was not specified, e.g. ms, the most closest
   *   type will be used
   * @returns - An object containing the parsed time and the type of time (e.g. "days", "hours", etc.)
   */
  static remaining(
    ms: number,
    {
      converters: converterTypes = ['sec', 'min', 'hour', 'day'],
      friction: frictionOverride,
    }: { converters?: Time[]; friction?: number } = {},
  ): { value: string; type: string } {
    const converters = converterTypes.map(type => this.converters[type]).sort((a, b) => b.time - a.time)
    for (const { time, friction = 0, plurals } of converters) {
      const value = ms / time
      if (~~value >= 1) {
        // Replace all 234.0 values to 234
        const parsedTime = value
          .toFixed(frictionOverride ?? friction)
          .replace(/(\.[1-9]*)0+$/m, '$1')
          .replace(/\.$/m, '')

        return {
          value: parsedTime,
          type: ngettext(parseInt(value.toString()), plurals),
        }
      }
    }

    return { value: ms.toString(), type: 'миллисекунд' }
  }

  /** Converts provided time to ms depending on the type */
  static from(type: Time, num: number) {
    return this.converters[type].time * num
  }

  private static converters: Record<Time, { time: number; friction?: number; plurals: Plurals }> = {
    ms: {
      time: 1,
      plurals: ['миллисекунд', 'миллисекунды', 'миллисекунд'],
    },
    sec: {
      time: 1000,
      plurals: ['секунда', 'секунды', 'секунд'],
    },
    min: {
      time: 1000 * 60,
      plurals: ['минуту', 'минуты', 'минут'],
      friction: 1,
    },
    hour: {
      time: 1000 * 60 * 60,
      plurals: ['час', 'часа', 'часов'],
      friction: 1,
    },
    day: {
      time: 1000 * 60 * 60 * 24,
      plurals: ['день', 'дня', 'дней'],
      friction: 2,
    },
    month: {
      time: 1000 * 60 * 60 * 24 * 30,
      plurals: ['месяц', 'месяца', 'месяцев'],
      friction: 2,
    },
    year: {
      time: 1000 * 60 * 60 * 24 * 30 * 12,
      plurals: ['год', 'года', 'лет'],
      friction: 3,
    },
  }
}

export function fromTicksToMs(ticks: number) {
  return ~~(ticks * 50)
}

export function fromMsToTicks(ms: number) {
  return ~~(ms * 0.02)
}
