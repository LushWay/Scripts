import { Player } from '@minecraft/server'
import { Vec } from 'lib'
import 'lib/database/scoreboard'
import { location, locationWithRadius, locationWithRotation, migrateLocationName } from './location'
import { Group } from './rpg/place'
import { Settings } from './settings'

const group = new Group('id')
const point = group.place('id').name('name')

beforeEach(() => {
  Settings.worldConfigs = {}
  for (const key of Settings.worldDatabase.keys()) Settings.worldDatabase.delete(key)
})

describe('location', () => {
  it('should create a location', () => {
    const loc = location(point)
    expect(loc.valid).toBe(false)
    expect(loc.onLoad).toBeDefined()
    expect(loc.teleport).toBeDefined()
  })

  it('should create vectorable location', () => {
    const loc = location(point)
    expect(Vec.isVec(loc)).toBe(true)
  })

  it('should create a location with default values', () => {
    const loc = location(point, { x: 10, y: 40, z: 60 })
    expect(loc.valid).toBe(true)
    expect(loc.onLoad).toBeDefined()
    expect(loc.teleport).toBeDefined()
  })

  it('should load and update location from Settings', () => {
    Settings.set(Settings.worldDatabase, group.id, point.shortId, '10 20 30')
    const loc = location(point)
    expect(loc.valid).toBe(true)
    if (!loc.valid) return

    expect(loc.x).toBe(10)
    expect(loc.y).toBe(20)
    expect(loc.z).toBe(30)

    Settings.set(Settings.worldDatabase, group.id, point.shortId, '40 60 30')
    expect(loc.x).toBe(40)
    expect(loc.y).toBe(60)
    expect(loc.z).toBe(30)
  })

  it('should emit event on location change', () => {
    Settings.set(Settings.worldDatabase, group.id, point.shortId, '0 0 1')
    const loc = location(point)
    const callback = vi.fn()

    loc.onLoad.subscribe(callback)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 0, y: 0, z: 1 }))
    expect(loc.firstLoad).toBe(true)

    Settings.set(Settings.worldDatabase, group.id, point.shortId, '40 50 60')
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 40, y: 50, z: 60 }))
    expect(loc.firstLoad).toBe(false)
  })

  it('should not load invalid location', () => {
    const consoleErrorSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    Settings.worldDatabase.set(group.id, { [point.shortId]: 'in va lid' })
    location(point)

    expect(consoleErrorSpy.mock.calls[0]?.[0]).toMatchInlineSnapshot(
      `[TypeError: §cInvalid location, expected '§fx y z§c' but recieved '§fin va lid§c']`,
    )
  })

  it('should teleport', () => {
    const loc = location(point, { x: 0, y: 1, z: 1 })
    // @ts-expect-error
    const player = new Player(false) as Player
    const tp = vi.spyOn(player, 'teleport')
    loc.teleport(player)
    expect(tp.mock.calls[0]).toMatchInlineSnapshot(`
      [
        Vec {
          "x": 0.5,
          "y": 1,
          "z": 1.5,
        },
        {
          "dimension": Dimension {
            "heightRange": {
              "max": 365,
              "min": -64,
            },
            "id": "minecraft:overworld",
          },
        },
      ]
    `)
  })
})

describe('locationWithRotation', () => {
  it('should create a location with rotation with default values', () => {
    const loc = locationWithRotation(point)

    expect(loc.valid).toBe(false)
    expect(loc.onLoad).toBeDefined()
    expect(loc.teleport).toBeDefined()
  })

  it('should load and update location with rotation from Settings', () => {
    Settings.set(Settings.worldDatabase, group.id, point.shortId, '10 20 30 45 90')
    const loc = locationWithRotation(point)

    expect(loc.valid).toBe(true)
    if (!loc.valid) return

    expect(loc.x).toBe(10)
    expect(loc.y).toBe(20)
    expect(loc.z).toBe(30)
    expect(loc.xRot).toBe(45)
    expect(loc.yRot).toBe(90)
  })

  it('should load, floor and update location with rotation from Settings', () => {
    Settings.set(Settings.worldDatabase, group.id, point.shortId, '10.522 20.53 30.883 45.43 90.43')
    const loc = locationWithRotation(point, undefined, true)

    expect(loc.valid).toBe(true)
    if (!loc.valid) return

    expect(loc.x).toBe(10)
    expect(loc.y).toBe(20)
    expect(loc.z).toBe(30)
    expect(loc.xRot).toBe(45.43)
    expect(loc.yRot).toBe(90.43)
  })

  it('should emit event on location with rotation change', () => {
    Settings.set(Settings.worldDatabase, group.id, point.shortId, '10 20 30 45 90')
    const loc = locationWithRotation(point)
    const callback = vi.fn()

    loc.onLoad.subscribe(callback)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 10, y: 20, z: 30, xRot: 45, yRot: 90 }))

    Settings.set(Settings.worldDatabase, group.id, point.shortId, '40 50 60 30 60')

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 40, y: 50, z: 60, xRot: 30, yRot: 60 }))
  })

  it('should teleport', () => {
    const loc = locationWithRotation(point, { x: 0, y: 1, z: 1, xRot: 90, yRot: 0 })
    // @ts-expect-error
    const player = new Player(false) as Player
    loc.teleport(player)
    expect((player.teleport as unknown as ReturnType<typeof vi.fn>).mock.calls[0]).toMatchInlineSnapshot(`
      [
        Vec {
          "x": 0.5,
          "y": 1,
          "z": 1.5,
        },
        {
          "dimension": Dimension {
            "heightRange": {
              "max": 365,
              "min": -64,
            },
            "id": "minecraft:overworld",
          },
          "rotation": {
            "x": 90,
            "y": 0,
          },
        },
      ]
    `)
  })
})

describe('locationWithRadius', () => {
  it('should create a location with radius with default values', () => {
    const loc = locationWithRadius(point)
    expect(loc.valid).toBe(false)
    expect(loc.onLoad).toBeDefined()
    expect(loc.teleport).toBeDefined()
  })

  it('should load and update location with radius from Settings', () => {
    Settings.set(Settings.worldDatabase, group.id, point.shortId, '10 20 30 5')

    const loc = locationWithRadius(point)

    expect(loc.valid).toBe(true)
    if (!loc.valid) return

    expect(loc.x).toBe(10)
    expect(loc.y).toBe(20)
    expect(loc.z).toBe(30)
    expect(loc.radius).toBe(5)
  })

  it('should load, floor and update location with radius from Settings', () => {
    Settings.set(Settings.worldDatabase, group.id, point.shortId, '10.453 20.24 30.432 5.54')

    const loc = locationWithRadius(point, undefined, true)

    expect(loc.valid).toBe(true)
    if (!loc.valid) return

    expect(loc.x).toBe(10)
    expect(loc.y).toBe(20)
    expect(loc.z).toBe(30)
    expect(loc.radius).toBe(5.54)
  })

  it('should emit event on location with radius change', () => {
    Settings.set(Settings.worldDatabase, group.id, point.shortId, '10 20 30 5')

    const loc = locationWithRadius(point)
    const callback = vi.fn()
    loc.onLoad.subscribe(callback)

    Settings.set(Settings.worldDatabase, group.id, point.shortId, '40 50 60 10')

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 40, y: 50, z: 60, radius: 10 }))
  })
})

describe('migrate', () => {
  it('should migrate location', () => {
    Settings.worldDatabase.get(group.id)[point.shortId] = '1 0 1'
    const consoleLogSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})

    Settings.worldDatabase.get('locations')['oldname'] = '1 0 1'
    migrateLocationName('locations', 'oldname', group.id, 'newname')

    expect(Settings.worldDatabase.get(group.id)['newname']).toBe('1 0 1')
    expect(consoleLogSpy.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "§7Migrating location §flocations§7:§foldname§7 to §fid§7:§fnewname§7",
      ]
    `)
  })

  it('should not migrate already migrated location', () => {
    Settings.worldDatabase.get(group.id)[point.shortId] = '1 0 1'
    const consoleErrorSpy = vi.spyOn(console, 'warn')

    migrateLocationName('unknown group', 'does not exists', group.id, point.shortId)

    expect(consoleErrorSpy.mock.calls[0]).toBeUndefined()
    expect(Settings.worldDatabase.get(group.id)[point.shortId]).toBe('1 0 1')
  })

  it('should not migrate location that was empty', () => {
    const consoleErrorSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    migrateLocationName('unknown group', 'was never defined', group.id, point.shortId)

    expect(consoleErrorSpy.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "§cNo location found at §funknown group§c:§fwas never defined§c. Group: [
        §2\`unknown group\`§r,
        §2\`id\`§r
      ]§c",
      ]
    `)
    expect(Settings.worldDatabase.get(group.id)[point.shortId]).toBeUndefined()
  })
})
