import { Block, BlockPermutation, LocationInUnloadedChunkError, system, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Table, table } from 'lib/database/abstract'
import { form } from 'lib/form/new'
import { noI18n } from 'lib/i18n/text'
import { util } from 'lib/util'
import { createLogger } from 'lib/utils/logger'
import { Vec } from 'lib/vector'
import { migration } from './database/migrations'

const SCHEDULED_DB_OLD = table<ScheduleBlockPlace.Stored[]>('ScheduledBlockPlace', () => [])

const DB: Record<DimensionType, Table<ScheduleBlockPlace.Stored | undefined>> = {
  overworld: table('scheduledBlockPlaceOverworld'),
  end: table('scheduledBlockPlaceEnd'),
  nether: table('scheduledBlockPlaceNether'),
}

migration('scheduledBlockPlaceV2', () => {
  for (const dimension of DIMENSIONS) {
    const old = SCHEDULED_DB_OLD.getImmutable(dimension)
    for (const e of old) DB[dimension].set(Vec.string((e as unknown as ScheduleBlockPlace.StoredOld).location), e)
  }
})

migration('scheduledBlockPlaceV4', () => {
  for (const [, db] of Object.entries(DB)) {
    for (const [key, old] of db.entriesImmutable()) {
      const { typeId, states, location, date } = old as unknown as ScheduleBlockPlace.StoredOld
      db.set(key, { t: typeId, s: states, l: location, d: date })
    }
  }
})

migration('scheduledBlockPlaceV5', () => {
  for (const [, db] of Object.entries(DB)) {
    for (const [key, old] of db.entriesImmutable()) {
      if (!old) continue
      const k = Vec.string(Vec.parse(key)?.floor() ?? Vec.zero)

      if (k) db.set(k, { ...old, l: Vec.floor(old.l) })
    }
  }
})

export namespace ScheduleBlockPlace {
  export interface StoredOld {
    typeId: string
    states?: Record<string, string | number | boolean>
    location: Vector3
    date: number
  }

  export interface Stored {
    t: string
    s?: Record<string, string | number | boolean>
    l: Vector3
    d: number
  }

  export interface Create {
    typeId: string
    states?: Record<string, string | number | boolean>
    location: Vector3
    dimension: DimensionType
    restoreTime: number
  }
}

export class ScheduleBlockPlace {
  static set({ dimension, ...schedule }: ScheduleBlockPlace.Create) {
    const scheduled = this.get(schedule.location, dimension)
    if (scheduled) return scheduled

    schedule.location = Vec.floor(schedule.location)

    const stored: ScheduleBlockPlace.Stored = {
      d: Date.now() + schedule.restoreTime,
      t: schedule.typeId,
      s: schedule.states,
      l: schedule.location,
    }
    DB[dimension].set(Vec.string(schedule.location), stored)
    return stored
  }

  static setAir(location: Vector3, dimension: DimensionType, restoreTime: number) {
    return this.set({
      location,
      dimension,
      restoreTime,
      typeId: MinecraftBlockTypes.Air,
    })
  }

  static setBlock(block: Block, restoreTime: number) {
    return this.set({
      restoreTime,
      location: block.location,
      dimension: block.dimension.type,
      typeId: block.typeId,
      states: block.permutation.getAllStates(),
    })
  }

  static setPermutation(
    permutation: BlockPermutation,
    location: Vector3,
    dimension: DimensionType,
    restoreTime: number,
  ) {
    return this.set({
      location,
      dimension,
      restoreTime,
      typeId: permutation.type.id,
      states: permutation.getAllStates(),
    })
  }

  static get(location: Vector3, dimension: DimensionType): ScheduleBlockPlace.Stored | undefined {
    return DB[dimension].get(Vec.string(Vec.floor(location)))
  }

  /** Checks whenether provided location in dimension has scheduled blocks */
  static has(location: Vector3, dimension: DimensionType): string | undefined {
    const key = Vec.string(Vec.floor(location))
    return DB[dimension].has(key) ? key : undefined
  }

  static deleteAt(location: Vector3 | string, dimension: DimensionType) {
    return DB[dimension].delete(typeof location === 'string' ? location : Vec.string(Vec.floor(location)))
  }

  static getSize() {
    return DIMENSIONS.reduce((p, d) => DB[d].size + p, 0)
  }
}

export enum ScheduleDateAction {
  PlaceImmediately = 0,
}

const logger = createLogger('SheduledPlace')

const DIMENSIONS = ['overworld', 'nether', 'end'] as const

function* scheduledBlockPlaceJob() {
  for (const dimensionType of DIMENSIONS) {
    const toDelete: string[] = []
    const schedules = DB[dimensionType]
    if (typeof schedules === 'undefined') continue

    const time = util.benchmark('dimension', 'SchedulePlace ' + dimensionType)

    for (const [key, schedule] of schedules.entriesImmutable()) {
      const size = schedules.size

      try {
        if (toDelete.includes(key)) continue

        if (typeof schedule === 'undefined') {
          toDelete.push(key)
          continue
        }

        let date = schedule.d
        if (date !== ScheduleDateAction.PlaceImmediately) {
          if (size > 500) {
            date -= ~~(size / 500)
          }
          if (Date.now() < date) {
            yield
            continue
          }

          const downKey = Vec.string(Vec.add(schedule.l, { x: 0, y: -1, z: 0 }))
          // To prevent blocks from restoring randomly in air
          // we calculate if there is near broken block
          if (schedules.has(downKey) && !toDelete.includes(downKey)) continue
        }

        yield
        const block = world.overworld.getBlock(schedule.l)
        if (!block?.isValid) {
          if (debugLogging) logger.info`Skipping ${Vec.string(schedule.l)} because block is invalid`
          continue
        }

        block.setPermutation(BlockPermutation.resolve(schedule.t, schedule.s))

        const actual = size - 1 - toDelete.length
        if (__DEV__ || actual % 100 === 0 || debugLogging)
          logger.info`${schedule.t.replace('minecraft:', '')} to ${schedule.l}, remains ${actual}`
      } catch (e) {
        if (e instanceof LocationInUnloadedChunkError) {
          yield
          continue
        } else logger.error`Unable to place: ${e}`
      }

      // Remove successfully placed block from the schedule array
      toDelete.push(key)
      yield
    }

    for (const d of toDelete) schedules.delete(d)

    time()
  }

  timeout()
}

function timeout() {
  system.runTimeout(() => system.runJob(scheduledBlockPlaceJob()), 'scheduled block place', 10)
}
timeout()

let debugLogging = false

const scheduleForm = form(form => {
  form.title('schd')
  for (const [dim, blocks] of Object.entriesStringKeys(DB)) {
    form.button(scheduledDimensionForm(dim, blocks))
  }
  form.button(noI18n`debug: ${debugLogging}`, () => (debugLogging = !debugLogging))
})

const scheduledDimensionForm = (
  dimensionType: DimensionType,
  schedules: Table<ScheduleBlockPlace.Stored | undefined>,
) =>
  form((form, { player }) => {
    const keys = [...schedules.keys()]
    const size = keys.length
    form.title(`§7${dimensionType}: §f${size}`)
    form.button(noI18n`Place all blocks now`, () => {
      player.success(noI18n`Enjoy the CHAOS. Force-placing ${size} blocks...`)
      system.runJob(
        (function* placeNow() {
          let i = 0
          for (const immutableSchedule of schedules.valuesImmutable()) {
            if (!immutableSchedule) continue
            i++
            if (i % 100 === 0) yield
            const schedule = ScheduleBlockPlace.get(immutableSchedule.l, dimensionType)
            if (schedule) schedule.d = ScheduleDateAction.PlaceImmediately
          }
          player.success('Place triggered.')
        })(),
      )
    })
    const first = keys[0] ? schedules.get(keys[0]) : undefined
    if (!first) return

    form.button(noI18n`Teleport to first: ${Vec.string(first.l, true)}\n${first.t}`, () => {
      player.teleport(first.l)
      player.success()
    })
  })

new Command('schd')
  .setDescription(noI18n`Отложенная установка блоков`)
  .setPermissions('techAdmin')
  .executes(ctx => scheduleForm.show(ctx.player))
