/* istanbul ignore file */
/* eslint-disable */
// @ts-nocheck

// Source: https://github.com/breejs/later/blob/master/src/index.js
// Types Source: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/breejs__later/index.d.ts
// Copyright (c) 2020 BunKat, Nick Baugh <niftylettuce@gmail.com> (http://niftylettuce.com/)

// This library code is included because we need to adapt it to work using minecraft timers and to cleanup unused functions to not be included
// because bundler can't tree shake them because of the pattern this library is using

export declare namespace Later {
  export interface ScheduleData {
    /** A list of recurrence information as a composite schedule. */
    schedules: Recurrence[]

    /** A list of exceptions to the composite recurrence information. */
    exceptions: Recurrence[]

    /**
     * A code to identify any errors in the composite schedule and exceptions. The number tells you the position of the
     * error within the schedule.
     */
    error: number
  }

  export interface Recurrence {
    /** Time in seconds from midnight. */
    t?: number[] | undefined
    /** Seconds in minute. */
    s?: number[] | undefined
    /** Minutes in hour. */
    m?: number[] | undefined
    /** Hour in day. */
    h?: number[] | undefined
    /** Day of the month. */
    D?: number[] | undefined
    /** Day in week. */
    dw?: number[] | undefined
    /** Nth day of the week in month. */
    dc?: number[] | undefined
    /** Day in year. */
    dy?: number[] | undefined
    /** Week in month. */
    wm?: number[] | undefined
    /** ISO week in year. */
    wy?: number[] | undefined
    /** Month in year. */
    M?: number[] | undefined
    /** Year. */
    Y?: number[] | undefined

    /** After modifiers. */
    t_a?: number[] | undefined
    /** After modifiers. */
    s_a?: number[] | undefined
    /** After modifiers. */
    m_a?: number[] | undefined
    /** After modifiers. */
    h_a?: number[] | undefined
    /** After modifiers. */
    D_a?: number[] | undefined
    /** After modifiers. */
    dw_a?: number[] | undefined
    /** After modifiers. */
    dc_a?: number[] | undefined
    /** After modifiers. */
    dy_a?: number[] | undefined
    /** After modifiers. */
    wm_a?: number[] | undefined
    /** After modifiers. */
    wy_a?: number[] | undefined
    /** After modifiers. */
    M_a?: number[] | undefined
    /** After modifiers. */
    Y_a?: number[] | undefined

    /** Before modifiers. */
    t_b?: number[] | undefined
    /** Before modifiers. */
    s_b?: number[] | undefined
    /** Before modifiers. */
    m_b?: number[] | undefined
    /** Before modifiers. */
    h_b?: number[] | undefined
    /** Before modifiers. */
    D_b?: number[] | undefined
    /** Before modifiers. */
    dw_b?: number[] | undefined
    /** Before modifiers. */
    dc_b?: number[] | undefined
    /** Before modifiers. */
    dy_b?: number[] | undefined
    /** Before modifiers. */
    wm_b?: number[] | undefined
    /** Before modifiers. */
    wy_b?: number[] | undefined
    /** Before modifiers. */
    M_b?: number[] | undefined
    /** Before modifiers. */
    Y_b?: number[] | undefined

    /*
     * Custom Time Periods and Modifiers
     * For access to custom time periods created as extension to the later static type
     * and modifiers created on the later modifier static type.
     */
    [timePeriodAndModifierName: string]: number[] | undefined
  }

  /** Parse For generating schedule data. */
  export namespace parse {
    /** Create a recurrence builder for building schedule data. */
    function recur(): RecurrenceBuilder

    /**
     * Create schedule data by parsing a cron string
     *
     * @param input - A string value to parse.
     * @param hasSeconds - Whether the cron expression has second part.
     */
    function cron(input?: string, hasSeconds?: boolean): ScheduleData

    /**
     * Create schedule data by paring a human readable string.
     *
     * @param input - A string value to parse.
     */
    function text(input?: string): ScheduleData
  }

  export interface Timer {
    /** Clear the timer and end execution. */
    clear(): void
  }

  export namespace runtime {
    function setTimeout(callback: () => void, delay: number): number
    function clearTimeout(timeout: number): void
  }

  export interface Schedule {
    /**
     * Returns true if d is a valid occurrence of the current schedule.
     *
     * @param d: The date to check
     */
    isValid(d: Date): boolean

    /**
     * Finds the next valid instance or instances of the current schedule, optionally between a specified start and end
     * date. Start date is Date.now() by default, end date is unspecified. Start date must be smaller than end date.
     *
     * @param numberOfInst: The number of instances to return
     * @param dateFrom: The earliest a valid instance can occur
     * @param dateTo: The latest a valid instance can occur
     */

    next(numberOfInst: 1, dateFrom?: Date, dateTo?: Date): Date
    next(numberOfInst: Exclude<number, 1>, dateFrom?: Date, dateTo?: Date): Date[]
    next(numberOfInst: number, dateFrom?: Date, dateTo?: Date): Date[] | Date

    /**
     * Finds the next valid range or ranges of the current schedule, optionally between a specified start and end date.
     * Start date is Date.now() by default, end date is unspecified. Start date must be greater than end date.
     *
     * @param numberOfInst: The number of ranges to return
     * @param dateFrom: The earliest a valid range can occur
     * @param dateTo: The latest a valid range can occur
     */
    nextRange(numberOfInst: number, dateFrom?: Date, dateTo?: Date): Date[] | Date

    /**
     * Finds the previous valid instance or instances of the current schedule, optionally between a specified start and
     * end date. Start date is Date.now() by default, end date is unspecified. Start date must be greater than end
     * date.
     *
     * @param numberOfInst: The number of instances to return
     * @param dateFrom: The earliest a valid instance can occur
     * @param dateTo: The latest a valid instance can occur
     */
    prev(numberOfInst: 1, dateFrom?: Date, dateTo?: Date): Date
    prev(numberOfInst: Exclude<number, 1>, dateFrom?: Date, dateTo?: Date): Date[]
    prev(numberOfInst: number, dateFrom?: Date, dateTo?: Date): Date[] | Date

    /**
     * Finds the previous valid range or ranges of the current schedule, optionally between a specified start and end
     * date. Start date is Date.now() by default, end date is unspecified. Start date must be greater than end date.
     *
     * @param numberOfInst: The number of ranges to return
     * @param dateFrom: The earliest a valid range can occur
     * @param dateTo: The latest a valid range can occur
     */
    prevRange(numberOfInst: number, dateFrom?: Date, dateTo?: Date): Date[] | Date
  }

  export interface RecurrenceBuilder extends ScheduleData {
    /** A time period */
    second(): RecurrenceBuilder

    /** A time period */
    minute(): RecurrenceBuilder

    /** A time period */
    hour(): RecurrenceBuilder

    /** A time period */
    time(): RecurrenceBuilder

    /** A time period */
    dayOfWeek(): RecurrenceBuilder

    /** A time period */
    dayOfWeekCount(): RecurrenceBuilder

    /** A time period */
    dayOfMonth(): RecurrenceBuilder

    /** A time period */
    dayOfYear(): RecurrenceBuilder

    /** A time period */
    weekOfMonth(): RecurrenceBuilder

    /** A time period */
    weekOfYear(): RecurrenceBuilder

    /** A time period */
    month(): RecurrenceBuilder

    /** A time period */
    year(): RecurrenceBuilder

    /** A time period */
    fullDate(): RecurrenceBuilder

    /**
     * Specifies one or more specific values of a time period information provider. When used to specify a time, a
     * string indicating the 24-hour time may be used.
     *
     * @param values - A list of values.
     */
    on(...values: (string | Date | number)[]): RecurrenceBuilder

    /**
     * Specifies one or more specific values of a time period information provider. When used to specify a time, a
     * string indicating the 24-hour time may be used.
     *
     * @param value - A Date or string representing your value.
     */
    on(value: Date | string): RecurrenceBuilder

    /**
     * Precede a time period.
     *
     * @param value - A number or string representing your value.
     */
    every(value?: number | string): RecurrenceBuilder

    /**
     * Precede a time period.
     *
     * @param start - A number representing your start value.
     * @param end - A number representing your end value.
     */
    between(start: number, end: number): RecurrenceBuilder

    /**
     * Precede a time period.
     *
     * @param start - A string representing your start value.
     * @param end - A string representing your end value.
     */
    between(start: string, end: string): RecurrenceBuilder

    /**
     * After a time period.
     *
     * @param value - A number or string representing your value.
     */
    after(value: number | string): RecurrenceBuilder

    /**
     * Before a time period.
     *
     * @param value - A number or string representing your value.
     */
    before(value: number | string): RecurrenceBuilder

    /**
     * After a time period.
     *
     * @param value - A number or string representing your value.
     */
    startingOn(value: number | string): RecurrenceBuilder

    /** Equivalent to .on(min) */
    first(): RecurrenceBuilder

    /** Equivalent to .on(max) */
    last(): RecurrenceBuilder

    /** Equivalent to .on(1,7).dayOfWeek() */
    onWeekend(): RecurrenceBuilder

    /** Equivalent to .on(2,3,4,5,6).dayOfWeek() */
    onWeekday(): RecurrenceBuilder

    /** Add a new schedule value to schedules, composite schedule. */
    and(): RecurrenceBuilder

    /** Add exceptions. */
    except(): RecurrenceBuilder

    /** Custom Time period Recurrences. Using a key as defined by the custom period in any extension to Later.IStatic. */
    customPeriod(key: string): RecurrenceBuilder

    /** Customize Recurrences. Using a key as defined by the custom modifier in any extension to Later.IModifierStatic. */
    customModifier(key: string, values: number): RecurrenceBuilder
  }

  /** Date Provider */
  export namespace date {
    /** Set later to use UTC time. */
    function UTC(): void

    /** Set later to use local time. */
    function localTime(): void

    /**
     * Builds and returns a new Date using the specified values. Date returned is either using Local time or UTC based
     * on isLocal.
     *
     * @param Y: Four digit year
     * @param M: Month between 1 and 12, defaults to 1
     * @param D: Date between 1 and 31, defaults to 1
     * @param h: Hour between 0 and 23, defaults to 0
     * @param m: Minute between 0 and 59, defaults to 0
     * @param s: Second between 0 and 59, defaults to 0
     */
    function next(Y?: number, M?: number, D?: number, h?: number, m?: number, s?: number): Date

    /**
     * Builds and returns a new Date using the specified values. Date returned is either using Local time or UTC based
     * on isLocal.
     *
     * @param Y: Four digit year
     * @param M: Month between 0 and 11, defaults to 11
     * @param D: Date between 1 and 31, defaults to last day of month
     * @param h: Hour between 0 and 23, defaults to 23
     * @param m: Minute between 0 and 59, defaults to 59
     * @param s: Second between 0 and 59, defaults to 59
     */
    function prev(Y?: number, M?: number, D?: number, h?: number, m?: number, s?: number): Date

    /**
     * Determines if a value will cause a particular constraint to rollover to the next largest time period. Used
     * primarily when a constraint has a variable extent.
     *
     * @param d: Date
     * @param val: Value
     * @param constraint: A modifier
     * @param period: A time period
     */
    function nextRollover(d: Date, val: number, constraint: Modifier, period: TimePeriod): Date

    /**
     * Determines if a value will cause a particular constraint to rollover to the previous largest time period. Used
     * primarily when a constraint has a variable extent.
     *
     * @param d: Date
     * @param val: Value
     * @param constraint: A modifier
     * @param period: A time period
     */
    function prevRollover(d: Date, val: number, constraint: Modifier, period: TimePeriod): Date
  }

  export interface TimePeriod {
    /** The name of the time period information provider. */
    name: string

    /**
     * The rough number of seconds that are covered when moving from one instance of this time period to the next
     * instance.
     */
    range: number

    /**
     * The value of this time period for the date specified.
     *
     * @param date - The given date.
     */
    val(date: Date): number

    /**
     * True if the specified value is valid for the specified date, false otherwise.
     *
     * @param date - The given date.
     * @param value - The value to test for the date.
     */
    isValid(date: Date, value: any): boolean

    /**
     * The minimum and maximum valid values for the time period for the specified date. If the minimum value is not 0, 0
     * can be specified in schedules to indicate the maximum value. This makes working with non - constant extents(like
     * days in a month) easier.
     *
     * @param date - The given date.
     */
    extent(date?: Date): number[]

    /**
     * The first second in which the value is the same as the value of the specified date. For example, the start of an
     * hour would be the hour with 0 minutes and 0 seconds.
     *
     * @param date - The given date.
     */
    start(date: Date): Date

    /**
     * The last second in which the value is the same as the value of the specified date. For example, the end of an
     * hour would be the hour with 59 minutes and 59 seconds.
     *
     * @param date - The given date.
     */
    end(date: Date): Date

    /**
     * Returns the next date where the value is the value specified. Sets the value to 1 if value specified is greater
     * than the max allowed value.
     *
     * @param date - The given date.
     * @param value - The value to test for the date.
     */
    next(date: Date, value: any): Date

    /**
     * Returns the previous date where the value is the value specified. Sets the value to the max allowed value if the
     * value specified is greater than the max allowed value.
     *
     * @param date - The given date.
     * @param value - The value to test for the date.
     */
    prev(date: Date, value: any): Date
  }

  export interface Modifier extends TimePeriod {
    /**
     * Creates a new modified constraint.
     *
     * @param constraint: The constraint to be modified
     * @param value: The starting value of the after constraint
     */ (constraint: TimePeriod, value: number): TimePeriod
  }

  /**
   * Later Modifiers:
   *
   * This type can be easily extended to include any custom IModifiers that you desire. These can then be used to create
   * schedules of your own custom type.
   *
   * Interface IGandalfsLaterModifier extends Later.IModifierStatic { duringTheThirdAge: IModifier }
   *
   * Be sure to use this interface when dealing with Later.modifier
   */
  export namespace modifier {
    /** After Modifier */
    const after: Modifier

    /** Before Modifier */
    const before: Modifier
  }

  export namespace array {
    /**
     * Sorts the array in place.
     *
     * @param array The array to be sorted
     * @param zeroIsLast Should zero be sorted to the end of the array
     */
    function sort(array: number[], zeroIsLast?: boolean): void

    /**
     * Returns the next valid value in the array.
     *
     * @param current The current value
     * @param array The array to be searched
     * @param extent The extents of the array
     */
    function next(current: number, array: number[], extent: [minimum: number, maximum: number]): number

    /**
     * Returns the next invalid value in the array.
     *
     * @param current The current value
     * @param array The array to be searched
     * @param extent The extents of the array
     */
    function nextInvalid(current: number, array: number[], extent: [minimum: number, maximum: number]): number

    /**
     * Returns the previous valid value in the array.
     *
     * @param current The current value
     * @param array The array to be searched
     * @param extent The extents of the array
     */
    function prev(current: number, array: number[], extent: [minimum: number, maximum: number]): number

    /**
     * Returns the previous invalid value in the array.
     *
     * @param current The current value
     * @param array The array to be searched
     * @param extent The extents of the array
     */
    function prevInvalid(current: number, array: number[], extent: [minimum: number, maximum: number]): number
  }

  /** Generates instances from schedule data. */
  export function schedule(input: any): Schedule

  /** @param schedule The schedule to be parsed */
  export function compile(schedule: Schedule): TimePeriod

  /**
   * Set timeout on window using given recurrence next.
   *
   * @param callback - A callback called after first instance of recurrence pattern.
   * @param time A recurrence instance.
   */
  export function setTimeout(callback: () => void, time: ScheduleData): Timer

  /**
   * Set interval on window using given recurrence
   *
   * @param callback - A callback called after each instance of recurrence pattern.
   * @param time A recurrence instance.
   */
  export function setInterval(callback: () => void, time: ScheduleData): Timer

  /** Time period information provider. */
  export const time: TimePeriod
  export const t: TimePeriod
  /** Second time period information provider. */
  export const second: TimePeriod
  export const s: TimePeriod
  /** Minute time period information provider. */
  export const minute: TimePeriod
  export const m: TimePeriod
  /** Hour time period information provider. */
  export const hour: TimePeriod
  export const h: TimePeriod
  /** Day time period information provider. */
  export const day: TimePeriod
  export const D: TimePeriod
  /** Day of week time period information provider. */
  export const dayOfWeek: TimePeriod
  export const dw: TimePeriod
  export const d: TimePeriod
  /** Day of week in month time period information provider. */
  export const dayOfWeekCount: TimePeriod
  export const dc: TimePeriod
  /** Day in year time period information provider. */
  export const dayOfYear: TimePeriod
  export const dy: TimePeriod
  /** Week of month time period information provider. */
  export const weekOfMonth: TimePeriod
  export const wm: TimePeriod
  /** Week of year from ISO 8601 time period information provider. */
  export const weekOfYear: TimePeriod
  export const wy: TimePeriod
  /** Month time period information provider. */
  export const month: TimePeriod
  export const M: TimePeriod
  /** Year time period information provider. */
  export const year: TimePeriod
  export const Y: TimePeriod
  /** Full date time period information provider. */
  export const fullDate: TimePeriod
  export const fd: TimePeriod

  /** Constant for the number of milliseconds in a second. */
  export const SEC: 1000
  /** Constant for the number of milliseconds in a minute. */
  export const MIN: 60_000
  /** Constant for the number of milliseconds in an hour. */
  export const HOUR: 3_600_000
  /** Constant for the number of milliseconds in a day. */
  export const DAY: 86_400_000
  /** Constant for the number of milliseconds in a week. */
  export const WEEK: 604_800_000
  /** Constant for the number of days in each month. */
  export const DAYS_IN_MONTH: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  /** Constant for never. */
  export const NEVER: 0
}

const later = {}

later.array = {}
later.array.sort = function (array, zeroIsLast) {
  array.sort(function (a, b) {
    return Number(a) - Number(b)
  })
  if (zeroIsLast && array[0] === 0) {
    array.push(array.shift())
  }
}

later.array.next = function (value, values, extent) {
  let cur
  const zeroIsLargest = extent[0] !== 0
  let nextIdx = 0
  for (let i = values.length - 1; i > -1; --i) {
    cur = values[i]
    if (cur === value) {
      return cur
    }

    if (cur > value || (cur === 0 && zeroIsLargest && extent[1] > value)) {
      nextIdx = i
      continue
    }

    break
  }

  return values[nextIdx]
}

later.array.nextInvalid = function (value, values, extent) {
  const min = extent[0]
  const max = extent[1]
  const { length } = values
  const zeroValue = values[length - 1] === 0 && min !== 0 ? max : 0
  let next = value
  let i = values.indexOf(value)
  const start = next
  while (next === (values[i] || zeroValue)) {
    next++
    if (next > max) {
      next = min
    }

    i++
    if (i === length) {
      i = 0
    }

    if (next === start) {
      return undefined
    }
  }

  return next
}

later.array.prev = function (value, values, extent) {
  let cur
  const { length } = values
  const zeroIsLargest = extent[0] !== 0
  let previousIdx = length - 1
  for (let i = 0; i < length; i++) {
    cur = values[i]
    if (cur === value) {
      return cur
    }

    if (cur < value || (cur === 0 && zeroIsLargest && extent[1] < value)) {
      previousIdx = i
      continue
    }

    break
  }

  return values[previousIdx]
}

later.array.prevInvalid = function (value, values, extent) {
  const min = extent[0]
  const max = extent[1]
  const { length } = values
  const zeroValue = values[length - 1] === 0 && min !== 0 ? max : 0
  let next = value
  let i = values.indexOf(value)
  const start = next
  while (next === (values[i] || zeroValue)) {
    next--
    if (next < min) {
      next = max
    }

    i--
    if (i === -1) {
      i = length - 1
    }

    if (next === start) {
      return undefined
    }
  }

  return next
}

later.day = later.D = {
  name: 'day',
  range: 86400,
  val(d) {
    return d.D || (d.D = later.date.getDate.call(d))
  },
  isValid(d, value) {
    return later.D.val(d) === (value || later.D.extent(d)[1])
  },
  extent(d) {
    if (d.DExtent) return d.DExtent
    const month = later.M.val(d)
    let max = later.DAYS_IN_MONTH[month - 1]
    if (month === 2 && later.dy.extent(d)[1] === 366) {
      max += 1
    }

    return (d.DExtent = [1, max])
  },
  start(d) {
    return d.DStart || (d.DStart = later.date.next(later.Y.val(d), later.M.val(d), later.D.val(d)))
  },
  end(d) {
    return d.DEnd || (d.DEnd = later.date.prev(later.Y.val(d), later.M.val(d), later.D.val(d)))
  },
  next(d, value) {
    value = value > later.D.extent(d)[1] ? 1 : value
    const month = later.date.nextRollover(d, value, later.D, later.M)
    const DMax = later.D.extent(month)[1]
    value = value > DMax ? 1 : value || DMax
    return later.date.next(later.Y.val(month), later.M.val(month), value)
  },
  prev(d, value) {
    const month = later.date.prevRollover(d, value, later.D, later.M)
    const DMax = later.D.extent(month)[1]
    return later.date.prev(later.Y.val(month), later.M.val(month), value > DMax ? DMax : value || DMax)
  },
}
later.dayOfWeekCount = later.dc = {
  name: 'day of week count',
  range: 604800,
  val(d) {
    return d.dc || (d.dc = Math.floor((later.D.val(d) - 1) / 7) + 1)
  },
  isValid(d, value) {
    return later.dc.val(d) === value || (value === 0 && later.D.val(d) > later.D.extent(d)[1] - 7)
  },
  extent(d) {
    return d.dcExtent || (d.dcExtent = [1, Math.ceil(later.D.extent(d)[1] / 7)])
  },
  start(d) {
    return (
      d.dcStart ||
      (d.dcStart = later.date.next(later.Y.val(d), later.M.val(d), Math.max(1, (later.dc.val(d) - 1) * 7 + 1 || 1)))
    )
  },
  end(d) {
    return (
      d.dcEnd ||
      (d.dcEnd = later.date.prev(later.Y.val(d), later.M.val(d), Math.min(later.dc.val(d) * 7, later.D.extent(d)[1])))
    )
  },
  next(d, value) {
    value = value > later.dc.extent(d)[1] ? 1 : value
    let month = later.date.nextRollover(d, value, later.dc, later.M)
    const dcMax = later.dc.extent(month)[1]
    value = value > dcMax ? 1 : value
    const next = later.date.next(
      later.Y.val(month),
      later.M.val(month),
      value === 0 ? later.D.extent(month)[1] - 6 : 1 + 7 * (value - 1),
    )
    if (next.getTime() <= d.getTime()) {
      month = later.M.next(d, later.M.val(d) + 1)
      return later.date.next(
        later.Y.val(month),
        later.M.val(month),
        value === 0 ? later.D.extent(month)[1] - 6 : 1 + 7 * (value - 1),
      )
    }

    return next
  },
  prev(d, value) {
    const month = later.date.prevRollover(d, value, later.dc, later.M)
    const dcMax = later.dc.extent(month)[1]
    value = value > dcMax ? dcMax : value || dcMax
    return later.dc.end(later.date.prev(later.Y.val(month), later.M.val(month), 1 + 7 * (value - 1)))
  },
}
later.dayOfWeek =
  later.dw =
  later.d =
    {
      name: 'day of week',
      range: 86400,
      val(d) {
        return d.dw || (d.dw = later.date.getDay.call(d) + 1)
      },
      isValid(d, value) {
        return later.dw.val(d) === (value || 7)
      },
      extent() {
        return [1, 7]
      },
      start(d) {
        return later.D.start(d)
      },
      end(d) {
        return later.D.end(d)
      },
      next(d, value) {
        value = value > 7 ? 1 : value || 7
        return later.date.next(
          later.Y.val(d),
          later.M.val(d),
          later.D.val(d) + (value - later.dw.val(d)) + (value <= later.dw.val(d) ? 7 : 0),
        )
      },
      prev(d, value) {
        value = value > 7 ? 7 : value || 7
        return later.date.prev(
          later.Y.val(d),
          later.M.val(d),
          later.D.val(d) + (value - later.dw.val(d)) + (value >= later.dw.val(d) ? -7 : 0),
        )
      },
    }
later.dayOfYear = later.dy = {
  name: 'day of year',
  range: 86400,
  val(d) {
    return d.dy || (d.dy = Math.ceil(1 + (later.D.start(d).getTime() - later.Y.start(d).getTime()) / later.DAY))
  },
  isValid(d, value) {
    return later.dy.val(d) === (value || later.dy.extent(d)[1])
  },
  extent(d) {
    const year = later.Y.val(d)
    return d.dyExtent || (d.dyExtent = [1, year % 4 ? 365 : 366])
  },
  start(d) {
    return later.D.start(d)
  },
  end(d) {
    return later.D.end(d)
  },
  next(d, value) {
    value = value > later.dy.extent(d)[1] ? 1 : value
    const year = later.date.nextRollover(d, value, later.dy, later.Y)
    const dyMax = later.dy.extent(year)[1]
    value = value > dyMax ? 1 : value || dyMax
    return later.date.next(later.Y.val(year), later.M.val(year), value)
  },
  prev(d, value) {
    const year = later.date.prevRollover(d, value, later.dy, later.Y)
    const dyMax = later.dy.extent(year)[1]
    value = value > dyMax ? dyMax : value || dyMax
    return later.date.prev(later.Y.val(year), later.M.val(year), value)
  },
}
later.hour = later.h = {
  name: 'hour',
  range: 3600,
  val(d) {
    return d.h || (d.h = later.date.getHour.call(d))
  },
  isValid(d, value) {
    return later.h.val(d) === value
  },
  extent() {
    return [0, 23]
  },
  start(d) {
    return d.hStart || (d.hStart = later.date.next(later.Y.val(d), later.M.val(d), later.D.val(d), later.h.val(d)))
  },
  end(d) {
    return d.hEnd || (d.hEnd = later.date.prev(later.Y.val(d), later.M.val(d), later.D.val(d), later.h.val(d)))
  },
  next(d, value) {
    value = value > 23 ? 0 : value
    let next = later.date.next(
      later.Y.val(d),
      later.M.val(d),
      later.D.val(d) + (value <= later.h.val(d) ? 1 : 0),
      value,
    )
    if (!later.date.isUTC && next.getTime() <= d.getTime()) {
      next = later.date.next(later.Y.val(next), later.M.val(next), later.D.val(next), value + 1)
    }

    return next
  },
  prev(d, value) {
    value = value > 23 ? 23 : value
    return later.date.prev(later.Y.val(d), later.M.val(d), later.D.val(d) + (value >= later.h.val(d) ? -1 : 0), value)
  },
}
later.minute = later.m = {
  name: 'minute',
  range: 60,
  val(d) {
    return d.m || (d.m = later.date.getMin.call(d))
  },
  isValid(d, value) {
    return later.m.val(d) === value
  },
  extent(d) {
    return [0, 59]
  },
  start(d) {
    return (
      d.mStart ||
      (d.mStart = later.date.next(later.Y.val(d), later.M.val(d), later.D.val(d), later.h.val(d), later.m.val(d)))
    )
  },
  end(d) {
    return (
      d.mEnd ||
      (d.mEnd = later.date.prev(later.Y.val(d), later.M.val(d), later.D.val(d), later.h.val(d), later.m.val(d)))
    )
  },
  next(d, value) {
    const m = later.m.val(d)
    const s = later.s.val(d)
    const inc = value > 59 ? 60 - m : value <= m ? 60 - m + value : value - m
    let next = new Date(d.getTime() + inc * later.MIN - s * later.SEC)
    if (!later.date.isUTC && next.getTime() <= d.getTime()) {
      next = new Date(d.getTime() + (inc + 120) * later.MIN - s * later.SEC)
    }

    return next
  },
  prev(d, value) {
    value = value > 59 ? 59 : value
    return later.date.prev(
      later.Y.val(d),
      later.M.val(d),
      later.D.val(d),
      later.h.val(d) + (value >= later.m.val(d) ? -1 : 0),
      value,
    )
  },
}
later.month = later.M = {
  name: 'month',
  range: 2629740,
  val(d) {
    return d.M || (d.M = later.date.getMonth.call(d) + 1)
  },
  isValid(d, value) {
    return later.M.val(d) === (value || 12)
  },
  extent() {
    return [1, 12]
  },
  start(d) {
    return d.MStart || (d.MStart = later.date.next(later.Y.val(d), later.M.val(d)))
  },
  end(d) {
    return d.MEnd || (d.MEnd = later.date.prev(later.Y.val(d), later.M.val(d)))
  },
  next(d, value) {
    value = value > 12 ? 1 : value || 12
    return later.date.next(later.Y.val(d) + (value > later.M.val(d) ? 0 : 1), value)
  },
  prev(d, value) {
    value = value > 12 ? 12 : value || 12
    return later.date.prev(later.Y.val(d) - (value >= later.M.val(d) ? 1 : 0), value)
  },
}
later.second = later.s = {
  name: 'second',
  range: 1,
  val(d) {
    return d.s || (d.s = later.date.getSec.call(d))
  },
  isValid(d, value) {
    return later.s.val(d) === value
  },
  extent() {
    return [0, 59]
  },
  start(d) {
    return d
  },
  end(d) {
    return d
  },
  next(d, value) {
    const s = later.s.val(d)
    const inc = value > 59 ? 60 - s : value <= s ? 60 - s + value : value - s
    let next = new Date(d.getTime() + inc * later.SEC)
    if (!later.date.isUTC && next.getTime() <= d.getTime()) {
      next = new Date(d.getTime() + (inc + 7200) * later.SEC)
    }

    return next
  },
  prev(d, value, cache) {
    value = value > 59 ? 59 : value
    return later.date.prev(
      later.Y.val(d),
      later.M.val(d),
      later.D.val(d),
      later.h.val(d),
      later.m.val(d) + (value >= later.s.val(d) ? -1 : 0),
      value,
    )
  },
}
later.time = later.t = {
  name: 'time',
  range: 1,
  val(d) {
    return d.t || (d.t = later.h.val(d) * 3600 + later.m.val(d) * 60 + later.s.val(d))
  },
  isValid(d, value) {
    return later.t.val(d) === value
  },
  extent() {
    return [0, 86399]
  },
  start(d) {
    return d
  },
  end(d) {
    return d
  },
  next(d, value) {
    value = value > 86399 ? 0 : value
    let next = later.date.next(
      later.Y.val(d),
      later.M.val(d),
      later.D.val(d) + (value <= later.t.val(d) ? 1 : 0),
      0,
      0,
      value,
    )
    if (!later.date.isUTC && next.getTime() < d.getTime()) {
      next = later.date.next(
        later.Y.val(next),
        later.M.val(next),
        later.D.val(next),
        later.h.val(next),
        later.m.val(next),
        value + 7200,
      )
    }

    return next
  },
  prev(d, value) {
    value = value > 86399 ? 86399 : value
    return later.date.next(
      later.Y.val(d),
      later.M.val(d),
      later.D.val(d) + (value >= later.t.val(d) ? -1 : 0),
      0,
      0,
      value,
    )
  },
}
later.weekOfMonth = later.wm = {
  name: 'week of month',
  range: 604800,
  val(d) {
    return d.wm || (d.wm = (later.D.val(d) + (later.dw.val(later.M.start(d)) - 1) + (7 - later.dw.val(d))) / 7)
  },
  isValid(d, value) {
    return later.wm.val(d) === (value || later.wm.extent(d)[1])
  },
  extent(d) {
    return (
      d.wmExtent ||
      (d.wmExtent = [
        1,
        (later.D.extent(d)[1] + (later.dw.val(later.M.start(d)) - 1) + (7 - later.dw.val(later.M.end(d)))) / 7,
      ])
    )
  },
  start(d) {
    return (
      d.wmStart ||
      (d.wmStart = later.date.next(later.Y.val(d), later.M.val(d), Math.max(later.D.val(d) - later.dw.val(d) + 1, 1)))
    )
  },
  end(d) {
    return (
      d.wmEnd ||
      (d.wmEnd = later.date.prev(
        later.Y.val(d),
        later.M.val(d),
        Math.min(later.D.val(d) + (7 - later.dw.val(d)), later.D.extent(d)[1]),
      ))
    )
  },
  next(d, value) {
    value = value > later.wm.extent(d)[1] ? 1 : value
    const month = later.date.nextRollover(d, value, later.wm, later.M)
    const wmMax = later.wm.extent(month)[1]
    value = value > wmMax ? 1 : value || wmMax
    return later.date.next(
      later.Y.val(month),
      later.M.val(month),
      Math.max(1, (value - 1) * 7 - (later.dw.val(month) - 2)),
    )
  },
  prev(d, value) {
    const month = later.date.prevRollover(d, value, later.wm, later.M)
    const wmMax = later.wm.extent(month)[1]
    value = value > wmMax ? wmMax : value || wmMax
    return later.wm.end(
      later.date.next(later.Y.val(month), later.M.val(month), Math.max(1, (value - 1) * 7 - (later.dw.val(month) - 2))),
    )
  },
}
later.weekOfYear = later.wy = {
  name: 'week of year (ISO)',
  range: 604800,
  val(d) {
    if (d.wy) return d.wy
    const wThur = later.dw.next(later.wy.start(d), 5)
    const YThur = later.dw.next(later.Y.prev(wThur, later.Y.val(wThur) - 1), 5)
    return (d.wy = 1 + Math.ceil((wThur.getTime() - YThur.getTime()) / later.WEEK))
  },
  isValid(d, value) {
    return later.wy.val(d) === (value || later.wy.extent(d)[1])
  },
  extent(d) {
    if (d.wyExtent) return d.wyExtent
    const year = later.dw.next(later.wy.start(d), 5)
    const dwFirst = later.dw.val(later.Y.start(year))
    const dwLast = later.dw.val(later.Y.end(year))
    return (d.wyExtent = [1, dwFirst === 5 || dwLast === 5 ? 53 : 52])
  },
  start(d) {
    return (
      d.wyStart ||
      (d.wyStart = later.date.next(
        later.Y.val(d),
        later.M.val(d),
        later.D.val(d) - (later.dw.val(d) > 1 ? later.dw.val(d) - 2 : 6),
      ))
    )
  },
  end(d) {
    return (
      d.wyEnd ||
      (d.wyEnd = later.date.prev(
        later.Y.val(d),
        later.M.val(d),
        later.D.val(d) + (later.dw.val(d) > 1 ? 8 - later.dw.val(d) : 0),
      ))
    )
  },
  next(d, value) {
    value = value > later.wy.extent(d)[1] ? 1 : value
    const wyThur = later.dw.next(later.wy.start(d), 5)
    let year = later.date.nextRollover(wyThur, value, later.wy, later.Y)
    if (later.wy.val(year) !== 1) {
      year = later.dw.next(year, 2)
    }

    const wyMax = later.wy.extent(year)[1]
    const wyStart = later.wy.start(year)
    value = value > wyMax ? 1 : value || wyMax
    return later.date.next(later.Y.val(wyStart), later.M.val(wyStart), later.D.val(wyStart) + 7 * (value - 1))
  },
  prev(d, value) {
    const wyThur = later.dw.next(later.wy.start(d), 5)
    let year = later.date.prevRollover(wyThur, value, later.wy, later.Y)
    if (later.wy.val(year) !== 1) {
      year = later.dw.next(year, 2)
    }

    const wyMax = later.wy.extent(year)[1]
    const wyEnd = later.wy.end(year)
    value = value > wyMax ? wyMax : value || wyMax
    return later.wy.end(later.date.next(later.Y.val(wyEnd), later.M.val(wyEnd), later.D.val(wyEnd) + 7 * (value - 1)))
  },
}
later.year = later.Y = {
  name: 'year',
  range: 31556900,
  val(d) {
    return d.Y || (d.Y = later.date.getYear.call(d))
  },
  isValid(d, value) {
    return later.Y.val(d) === value
  },
  extent() {
    return [1970, 2099]
  },
  start(d) {
    return d.YStart || (d.YStart = later.date.next(later.Y.val(d)))
  },
  end(d) {
    return d.YEnd || (d.YEnd = later.date.prev(later.Y.val(d)))
  },
  next(d, value) {
    return value > later.Y.val(d) && value <= later.Y.extent()[1] ? later.date.next(value) : later.NEVER
  },
  prev(d, value) {
    return value < later.Y.val(d) && value >= later.Y.extent()[0] ? later.date.prev(value) : later.NEVER
  },
}
later.fullDate = later.fd = {
  name: 'full date',
  range: 1,
  val(d) {
    return d.fd || (d.fd = d.getTime())
  },
  isValid(d, value) {
    return later.fd.val(d) === value
  },
  extent() {
    return [0, 3250368e7]
  },
  start(d) {
    return d
  },
  end(d) {
    return d
  },
  next(d, value) {
    return later.fd.val(d) < value ? new Date(value) : later.NEVER
  },
  prev(d, value) {
    return later.fd.val(d) > value ? new Date(value) : later.NEVER
  },
}
later.modifier = {}
later.modifier.after = later.modifier.a = function (constraint, values) {
  const value = values[0]
  return {
    name: 'after ' + constraint.name,
    range: (constraint.extent(new Date())[1] - value) * constraint.range,
    val: constraint.val,
    isValid(d, value_) {
      return this.val(d) >= value
    },
    extent: constraint.extent,
    start: constraint.start,
    end: constraint.end,
    next(startDate, value_) {
      if (value_ != value) value_ = constraint.extent(startDate)[0]
      return constraint.next(startDate, value_)
    },
    prev(startDate, value_) {
      value_ = value_ === value ? constraint.extent(startDate)[1] : value - 1
      return constraint.prev(startDate, value_)
    },
  }
}

later.modifier.before = later.modifier.b = function (constraint, values) {
  const value = values[values.length - 1]
  return {
    name: 'before ' + constraint.name,
    range: constraint.range * (value - 1),
    val: constraint.val,
    isValid(d, value_) {
      return this.val(d) < value
    },
    extent: constraint.extent,
    start: constraint.start,
    end: constraint.end,
    next(startDate, value_) {
      value_ = value_ === value ? constraint.extent(startDate)[0] : value
      return constraint.next(startDate, value_)
    },
    prev(startDate, value_) {
      value_ = value_ === value ? value - 1 : constraint.extent(startDate)[1]
      return constraint.prev(startDate, value_)
    },
  }
}

later.compile = function (schedDef) {
  const constraints = []
  let constraintsLength = 0
  let tickConstraint
  for (const key in schedDef) {
    const nameParts = key.split('_')
    const name = nameParts[0]
    const mod = nameParts[1]
    const vals = schedDef[key]
    const constraint = mod ? later.modifier[mod](later[name], vals) : later[name]
    constraints.push({
      constraint,
      vals,
    })
    constraintsLength++
  }

  constraints.sort(function (a, b) {
    const ra = a.constraint.range
    const rb = b.constraint.range
    return rb < ra ? -1 : rb > ra ? 1 : 0
  })
  tickConstraint = constraints[constraintsLength - 1].constraint
  function compareFn(dir) {
    return dir === 'next'
      ? function (a, b) {
          if (!a || !b) return true
          return a.getTime() > b.getTime()
        }
      : function (a, b) {
          if (!a || !b) return true
          return b.getTime() > a.getTime()
        }
  }

  return {
    start(dir, startDate) {
      let next = startDate
      const nextValue = later.array[dir]
      let maxAttempts = 1e3
      let done
      while (maxAttempts-- && !done && next) {
        done = true
        for (let i = 0; i < constraintsLength; i++) {
          const { constraint } = constraints[i]
          const curValue = constraint.val(next)
          const extent = constraint.extent(next)
          const newValue = nextValue(curValue, constraints[i].vals, extent)
          if (!constraint.isValid(next, newValue)) {
            next = constraint[dir](next, newValue)
            done = false
            break
          }
        }
      }

      if (next !== later.NEVER) {
        next = dir === 'next' ? tickConstraint.start(next) : tickConstraint.end(next)
      }

      return next
    },
    end(dir, startDate) {
      let result
      const nextValue = later.array[dir + 'Invalid']
      const compare = compareFn(dir)
      for (let i = constraintsLength - 1; i >= 0; i--) {
        const { constraint } = constraints[i]
        const curValue = constraint.val(startDate)
        const extent = constraint.extent(startDate)
        const newValue = nextValue(curValue, constraints[i].vals, extent)
        var next
        if (newValue !== undefined) {
          next = constraint[dir](startDate, newValue)
          if (next && (!result || compare(result, next))) {
            result = next
          }
        }
      }

      return result
    },
    tick(dir, date) {
      return new Date(
        dir === 'next'
          ? tickConstraint.end(date).getTime() + later.SEC
          : tickConstraint.start(date).getTime() - later.SEC,
      )
    },
    tickStart(date) {
      return tickConstraint.start(date)
    },
  }
}

later.schedule = function (sched) {
  if (!sched) throw new Error('Missing schedule definition.')
  if (!sched.schedules) throw new Error('Definition must include at least one schedule.')
  const schedules = []
  const schedulesLength = sched.schedules.length
  const exceptions = []
  const exceptionsLength = sched.exceptions ? sched.exceptions.length : 0
  for (let i = 0; i < schedulesLength; i++) {
    schedules.push(later.compile(sched.schedules[i]))
  }

  for (let j = 0; j < exceptionsLength; j++) {
    exceptions.push(later.compile(sched.exceptions[j]))
  }

  function getInstances(dir, count, startDate, endDate, isRange) {
    const compare = compareFn(dir)
    let loopCount = count
    let maxAttempts = 1e3
    const schedStarts = []
    const exceptStarts = []
    let next
    let end
    const results = []
    const isForward = dir === 'next'
    let lastResult
    const rStart = isForward ? 0 : 1
    const rEnd = isForward ? 1 : 0
    startDate = startDate ? new Date(startDate) : new Date()
    if (!startDate || !startDate.getTime()) throw new Error('Invalid start date.')
    setNextStarts(dir, schedules, schedStarts, startDate)
    setRangeStarts(dir, exceptions, exceptStarts, startDate)
    while (maxAttempts-- && loopCount && (next = findNext(schedStarts, compare))) {
      if (endDate && compare(next, endDate)) {
        break
      }

      if (exceptionsLength) {
        updateRangeStarts(dir, exceptions, exceptStarts, next)
        if ((end = calcRangeOverlap(dir, exceptStarts, next))) {
          updateNextStarts(dir, schedules, schedStarts, end)
          continue
        }
      }

      if (isRange) {
        const maxEndDate = calcMaxEndDate(exceptStarts, compare)
        end = calcEnd(dir, schedules, schedStarts, next, maxEndDate)
        const r = isForward
          ? [new Date(Math.max(startDate, next)), end ? new Date(endDate ? Math.min(end, endDate) : end) : undefined]
          : [
              end
                ? new Date(endDate ? Math.max(endDate, end.getTime() + later.SEC) : end.getTime() + later.SEC)
                : undefined,
              new Date(Math.min(startDate, next.getTime() + later.SEC)),
            ]
        if (lastResult && r[rStart].getTime() === lastResult[rEnd].getTime()) {
          lastResult[rEnd] = r[rEnd]
          loopCount++
        } else {
          lastResult = r
          results.push(lastResult)
        }

        if (!end) break
        updateNextStarts(dir, schedules, schedStarts, end)
      } else {
        results.push(isForward ? new Date(Math.max(startDate, next)) : getStart(schedules, schedStarts, next, endDate))
        tickStarts(dir, schedules, schedStarts, next)
      }

      loopCount--
    }

    for (let i = 0, { length } = results; i < length; i++) {
      const result = results[i]
      results[i] =
        Object.prototype.toString.call(result) === '[object Array]'
          ? [cleanDate(result[0]), cleanDate(result[1])]
          : cleanDate(result)
    }

    return results.length === 0 ? later.NEVER : count === 1 ? results[0] : results
  }

  function cleanDate(d) {
    if (d instanceof Date && !isNaN(d.valueOf())) {
      return new Date(d)
    }

    return undefined
  }

  function setNextStarts(dir, schedArray, startsArray, startDate) {
    for (let i = 0, { length } = schedArray; i < length; i++) {
      startsArray[i] = schedArray[i].start(dir, startDate)
    }
  }

  function updateNextStarts(dir, schedArray, startsArray, startDate) {
    const compare = compareFn(dir)
    for (let i = 0, { length } = schedArray; i < length; i++) {
      if (startsArray[i] && !compare(startsArray[i], startDate)) {
        startsArray[i] = schedArray[i].start(dir, startDate)
      }
    }
  }

  function setRangeStarts(dir, schedArray, rangesArray, startDate) {
    const compare = compareFn(dir)
    for (let i = 0, { length } = schedArray; i < length; i++) {
      const nextStart = schedArray[i].start(dir, startDate)
      if (!nextStart) {
        rangesArray[i] = later.NEVER
      } else {
        rangesArray[i] = [nextStart, schedArray[i].end(dir, nextStart)]
      }
    }
  }

  function updateRangeStarts(dir, schedArray, rangesArray, startDate) {
    const compare = compareFn(dir)
    for (let i = 0, { length } = schedArray; i < length; i++) {
      if (rangesArray[i] && !compare(rangesArray[i][0], startDate)) {
        const nextStart = schedArray[i].start(dir, startDate)
        if (!nextStart) {
          rangesArray[i] = later.NEVER
        } else {
          rangesArray[i] = [nextStart, schedArray[i].end(dir, nextStart)]
        }
      }
    }
  }

  function tickStarts(dir, schedArray, startsArray, startDate) {
    for (let i = 0, { length } = schedArray; i < length; i++) {
      if (startsArray[i] && startsArray[i].getTime() === startDate.getTime()) {
        startsArray[i] = schedArray[i].start(dir, schedArray[i].tick(dir, startDate))
      }
    }
  }

  function getStart(schedArray, startsArray, startDate, minEndDate) {
    let result
    for (let i = 0, { length } = startsArray; i < length; i++) {
      if (startsArray[i] && startsArray[i].getTime() === startDate.getTime()) {
        const start = schedArray[i].tickStart(startDate)
        if (minEndDate && start < minEndDate) {
          return minEndDate
        }

        if (!result || start > result) {
          result = start
        }
      }
    }

    return result
  }

  function calcRangeOverlap(dir, rangesArray, startDate) {
    const compare = compareFn(dir)
    let result
    for (let i = 0, { length } = rangesArray; i < length; i++) {
      const range = rangesArray[i]
      if (range && !compare(range[0], startDate) && (!range[1] || compare(range[1], startDate))) {
        if (!result || compare(range[1], result)) {
          result = range[1]
        }
      }
    }

    return result
  }

  function calcMaxEndDate(exceptsArray, compare) {
    let result
    for (let i = 0, { length } = exceptsArray; i < length; i++) {
      if (exceptsArray[i] && (!result || compare(result, exceptsArray[i][0]))) {
        result = exceptsArray[i][0]
      }
    }

    return result
  }

  function calcEnd(dir, schedArray, startsArray, startDate, maxEndDate) {
    const compare = compareFn(dir)
    let result
    for (let i = 0, { length } = schedArray; i < length; i++) {
      const start = startsArray[i]
      if (start && start.getTime() === startDate.getTime()) {
        const end = schedArray[i].end(dir, start)
        if (maxEndDate && (!end || compare(end, maxEndDate))) {
          return maxEndDate
        }

        if (!result || compare(end, result)) {
          result = end
        }
      }
    }

    return result
  }

  function compareFn(dir) {
    return dir === 'next'
      ? function (a, b) {
          if (!a || !b) return true
          return a.getTime() > b.getTime()
        }
      : function (a, b) {
          if (!a || !b) return true
          return b.getTime() > a.getTime()
        }
  }

  function findNext(array, compare) {
    let next = array[0]
    for (let i = 1, { length } = array; i < length; i++) {
      if (array[i] && compare(next, array[i])) {
        next = array[i]
      }
    }

    return next
  }

  return {
    isValid(d) {
      return getInstances('next', 1, d, d) !== later.NEVER
    },
    next(count, startDate, endDate) {
      return getInstances('next', count || 1, startDate, endDate)
    },
    prev(count, startDate, endDate) {
      return getInstances('prev', count || 1, startDate, endDate)
    },
    nextRange(count, startDate, endDate) {
      return getInstances('next', count || 1, startDate, endDate, true)
    },
    prevRange(count, startDate, endDate) {
      return getInstances('prev', count || 1, startDate, endDate, true)
    },
  }
}

later.setTimeout = function (fn, sched, timezone) {
  const s = later.schedule(sched)
  let t
  scheduleTimeout()

  function scheduleTimeout() {
    const date = new Date()
    const now = date.getTime()

    const next = (() => {
      if (!timezone || ['local', 'system'].includes(timezone)) {
        return s.next(2, now)
      }

      const localOffsetMillis = date.getTimezoneOffset() * 6e4
      const offsetMillis = getOffset(date, timezone)

      // Specified timezone has the same offset as local timezone.
      // ie. America/New_York = America/Nassau = GMT-4
      if (offsetMillis === localOffsetMillis) {
        return s.next(2, now)
      }

      // Offsets differ, adjust current time to match what
      // it should've been for the specified timezone.
      const adjustedNow = new Date(now + localOffsetMillis - offsetMillis)

      return (s.next(2, adjustedNow) || /* istanbul ignore next */ []).map(sched => {
        // adjust scheduled times to match their intended timezone
        // ie. scheduled = 2021-08-22T11:30:00.000-04:00 => America/New_York
        //     intended  = 2021-08-22T11:30:00.000-05:00 => America/Mexico_City
        return new Date(sched.getTime() + offsetMillis - localOffsetMillis)
      })
    })()

    if (!next[0]) {
      t = undefined
      return
    }

    let diff = next[0].getTime() - now
    if (diff < 1e3) {
      diff = next[1] ? next[1].getTime() - now : 1e3
    }

    t = diff < 2147483647 ? later.runtime.setTimeout(fn, diff) : later.runtime.setTimeout(scheduleTimeout, 2147483647)
  } // scheduleTimeout()

  return {
    isDone() {
      return !t
    },
    clear() {
      later.runtime.clearTimeout(t)
    },
  }
} // setTimeout()

later.setInterval = function (fn, sched, timezone) {
  if (!fn) {
    return
  }

  let t = later.setTimeout(scheduleTimeout, sched, timezone)
  let done = t.isDone()
  function scheduleTimeout() {
    /* istanbul ignore else */
    if (!done) {
      fn()
      t = later.setTimeout(scheduleTimeout, sched, timezone)
    }
  }

  return {
    isDone() {
      return t.isDone()
    },
    clear() {
      done = true
      t.clear()
    },
  }
} // setInterval()

later.date = {}
later.date.timezone = function (useLocalTime) {
  later.date.build = useLocalTime
    ? function (Y, M, D, h, m, s) {
        return new Date(Y, M, D, h, m, s)
      }
    : function (Y, M, D, h, m, s) {
        return new Date(Date.UTC(Y, M, D, h, m, s))
      }

  const get = useLocalTime ? 'get' : 'getUTC'
  const d = Date.prototype
  later.date.getYear = d[get + 'FullYear']
  later.date.getMonth = d[get + 'Month']
  later.date.getDate = d[get + 'Date']
  later.date.getDay = d[get + 'Day']
  later.date.getHour = d[get + 'Hours']
  later.date.getMin = d[get + 'Minutes']
  later.date.getSec = d[get + 'Seconds']
  later.date.isUTC = !useLocalTime
}

later.date.UTC = function () {
  later.date.timezone(false)
}

later.date.localTime = function () {
  later.date.timezone(true)
}

later.date.UTC()
later.SEC = 1e3
later.MIN = later.SEC * 60
later.HOUR = later.MIN * 60
later.DAY = later.HOUR * 24
later.WEEK = later.DAY * 7
later.DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
later.NEVER = 0
later.date.next = function (Y, M, D, h, m, s) {
  return later.date.build(Y, M !== undefined ? M - 1 : 0, D !== undefined ? D : 1, h || 0, m || 0, s || 0)
}

later.date.nextRollover = function (d, value, constraint, period) {
  const cur = constraint.val(d)
  const max = constraint.extent(d)[1]
  return (value || max) <= cur || value > max ? new Date(period.end(d).getTime() + later.SEC) : period.start(d)
}

later.date.prev = function (Y, M, D, h, m, s) {
  const { length } = arguments
  M = length < 2 ? 11 : M - 1
  D = length < 3 ? later.D.extent(later.date.next(Y, M + 1))[1] : D
  h = length < 4 ? 23 : h
  m = length < 5 ? 59 : m
  s = length < 6 ? 59 : s
  return later.date.build(Y, M, D, h, m, s)
}

later.date.prevRollover = function (d, value, constraint, period) {
  const cur = constraint.val(d)
  return value >= cur || !value ? period.start(period.prev(d, period.val(d) - 1)) : period.start(d)
}

later.parse = {}
later.parse.cron = function (expr, hasSeconds) {
  throw new Error('later.parse.cron was removed. Use later.parse.cron or add it from the source (link in file header)')
}

later.parse.recur = function () {
  const schedules = []
  const exceptions = []
  let cur
  let curArray = schedules
  let curName
  let values
  let every
  let modifier
  let applyMin
  let applyMax
  let i
  let last
  function add(name, min, max) {
    name = modifier ? name + '_' + modifier : name
    if (!cur) {
      curArray.push({})
      cur = curArray[0]
    }

    if (!cur[name]) {
      cur[name] = []
    }

    curName = cur[name]
    if (every) {
      values = []
      for (i = min; i <= max; i += every) {
        values.push(i)
      }

      last = {
        n: name,
        x: every,
        c: curName.length,
        m: max,
      }
    }

    values = applyMin ? [min] : applyMax ? [max] : values
    const { length } = values
    for (i = 0; i < length; i += 1) {
      const value = values[i]
      if (!curName.includes(value)) {
        curName.push(value)
      }
    }

    values = every = modifier = applyMin = applyMax = 0
  }

  return {
    schedules,
    exceptions,
    on() {
      values = Array.isArray(arguments[0]) ? arguments[0] : arguments
      return this
    },
    every(x) {
      every = x || 1
      return this
    },
    after(x) {
      modifier = 'a'
      values = [x]
      return this
    },
    before(x) {
      modifier = 'b'
      values = [x]
      return this
    },
    first() {
      applyMin = 1
      return this
    },
    last() {
      applyMax = 1
      return this
    },
    time() {
      for (let i = 0, { length } = values; i < length; i++) {
        const split = values[i].split(':')
        if (split.length < 3) split.push(0)
        values[i] = Number(split[0]) * 3600 + Number(split[1]) * 60 + Number(split[2])
      }

      add('t')
      return this
    },
    second() {
      add('s', 0, 59)
      return this
    },
    minute() {
      add('m', 0, 59)
      return this
    },
    hour() {
      add('h', 0, 23)
      return this
    },
    dayOfMonth() {
      add('D', 1, applyMax ? 0 : 31)
      return this
    },
    dayOfWeek() {
      add('d', 1, 7)
      return this
    },
    onWeekend() {
      values = [1, 7]
      return this.dayOfWeek()
    },
    onWeekday() {
      values = [2, 3, 4, 5, 6]
      return this.dayOfWeek()
    },
    dayOfWeekCount() {
      add('dc', 1, applyMax ? 0 : 5)
      return this
    },
    dayOfYear() {
      add('dy', 1, applyMax ? 0 : 366)
      return this
    },
    weekOfMonth() {
      add('wm', 1, applyMax ? 0 : 5)
      return this
    },
    weekOfYear() {
      add('wy', 1, applyMax ? 0 : 53)
      return this
    },
    month() {
      add('M', 1, 12)
      return this
    },
    year() {
      add('Y', 1970, 2450)
      return this
    },
    fullDate() {
      for (let i = 0, { length } = values; i < length; i++) {
        values[i] = values[i].getTime()
      }

      add('fd')
      return this
    },
    customModifier(id, vals) {
      const custom = later.modifier[id]
      if (!custom) throw new Error('Custom modifier ' + id + ' not recognized!')
      modifier = id
      values = Array.isArray(arguments[1]) ? arguments[1] : [arguments[1]]
      return this
    },
    customPeriod(id) {
      const custom = later[id]
      if (!custom) throw new Error('Custom time period ' + id + ' not recognized!')
      add(id, custom.extent(new Date())[0], custom.extent(new Date())[1])
      return this
    },
    startingOn(start) {
      return this.between(start, last.m)
    },
    between(start, end) {
      cur[last.n] = cur[last.n].splice(0, last.c)
      every = last.x
      add(last.n, start, end)
      return this
    },
    and() {
      cur = curArray[curArray.push({}) - 1]
      return this
    },
    except() {
      curArray = exceptions
      cur = null
      return this
    },
  }
}

later.parse.text = function (string) {
  throw new Error('later.parse.text was removed. Use later.parse.recur or add it from the source (link in file header)')
}

function getOffset(date, zone) {
  const d = date
    .toLocaleString('en-US', {
      hour12: false,
      timeZone: zone,
      timeZoneName: 'short',
    }) //=> ie. "8/22/2021, 24:30:00 EDT"
    .match(/(\d+)\/(\d+)\/(\d+),? (\d+):(\d+):(\d+)/)
    .map(n => (n.length === 1 ? '0' + n : n))

  const zdate = new Date(`${d[3]}-${d[1]}-${d[2]}T${d[4].replace('24', '00')}:${d[5]}:${d[6]}Z`)

  return date.getTime() - zdate.getTime()
} // getOffset()

export default later as typeof Later
