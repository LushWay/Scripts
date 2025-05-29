import { Player } from '@minecraft/server'
import { Vec } from 'lib'
import 'lib/database/scoreboard'
import { location, locationWithRadius, locationWithRotation, migrateLocationName } from './location'
import { Group } from './rpg/place'
import { Settings } from './settings'

const group = new Group('id')
const point = group.point('id').name('name')

beforeEach(() => {
  Settings.worldMap = {}
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
    Settings.worldDatabase.set(group.id, { [point.id]: '10 20 30' })
    const loc = location(point)
    expect(loc.valid).toBe(true)
    if (!loc.valid) return

    expect(loc.x).toBe(10)
    expect(loc.y).toBe(20)
    expect(loc.z).toBe(30)

    Settings.worldDatabase.set(group.id, { [point.id]: '40 60 30' })
    Settings.worldMap[group.id]?.[point.id]?.onChange?.()
    expect(loc.x).toBe(40)
    expect(loc.y).toBe(60)
    expect(loc.z).toBe(30)
  })

  it('should emit event on location change', () => {
    Settings.worldDatabase.set(group.id, { [point.id]: '0 0 1' })
    const loc = location(point)
    const callback = vi.fn()

    loc.onLoad.subscribe(callback)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 0, y: 0, z: 1 }))
    expect(loc.firstLoad).toBe(true)

    const settings = Settings.parseConfig(Settings.worldDatabase, group.id, Settings.worldMap[group.id] ?? {})
    settings[point.id] = '40 50 60'
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 40, y: 50, z: 60 }))
    expect(loc.firstLoad).toBe(false)
  })

  it('should not load invalid location', () => {
    const consoleErrorSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    Settings.worldDatabase.set(group.id, { [point.id]: 'in va lid' })
    location(point)

    expect(consoleErrorSpy.mock.calls[0]).toMatchInlineSnapshot(`
      [
        [TypeError: §cInvalid location, expected '§fx y z§c' but recieved '§fin va lid§c'§c],
      ]
    `)
  })

  it('should teleport', () => {
    const loc = location(point, { x: 0, y: 1, z: 1 })
    // @ts-expect-error
    const player = new Player(false) as Player
    loc.teleport(player)
    expect((player.teleport as unknown as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual([
      { x: 0.5, y: 0, z: 0.5 },
      {},
    ])
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
    Settings.worldDatabase.set(group.id, { [point.id]: '10 20 30 45 90' })
    const loc = locationWithRotation(point)

    expect(loc.valid).toBe(true)
    if (!loc.valid) return

    expect(loc.x).toBe(10)
    expect(loc.y).toBe(20)
    expect(loc.z).toBe(30)
    expect(loc.xRot).toBe(45)
    expect(loc.yRot).toBe(90)
  })

  it('should emit event on location with rotation change', () => {
    Settings.worldDatabase.set(group.id, { [point.id]: '10 20 30 45 90' })
    const loc = locationWithRotation(point)
    const callback = vi.fn()

    loc.onLoad.subscribe(callback)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 10, y: 20, z: 30, xRot: 45, yRot: 90 }))

    const settings = Settings.parseConfig(Settings.worldDatabase, group.id, Settings.worldMap[group.id] ?? {})
    settings[point.id] = '40 50 60 30 60'

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 40, y: 50, z: 60, xRot: 30, yRot: 60 }))
  })

  it('should teleport', () => {
    const loc = locationWithRotation(point, { x: 0, y: 1, z: 1, xRot: 90, yRot: 0 })
    // @ts-expect-error
    const player = new Player(false) as Player
    loc.teleport(player)
    expect((player.teleport as unknown as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual([
      { x: 0.5, y: 0, z: 0.5 },
      { rotation: { x: 90, y: 0 } },
    ])
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
    Settings.worldDatabase.set(group.id, { [point.id]: '10 20 30 5' })
    const loc = locationWithRadius(point)

    expect(loc.valid).toBe(true)
    if (!loc.valid) return

    expect(loc.x).toBe(10)
    expect(loc.y).toBe(20)
    expect(loc.z).toBe(30)
    expect(loc.radius).toBe(5)
  })

  it('should emit event on location with radius change', () => {
    Settings.worldDatabase.set(group.id, { [point.id]: '10 20 30 5' })
    const loc = locationWithRadius(point)
    const callback = vi.fn()
    loc.onLoad.subscribe(callback)

    const settings = Settings.parseConfig(Settings.worldDatabase, group.id, Settings.worldMap[group.id] ?? {})
    settings[point.id] = '40 50 60 10'

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 40, y: 50, z: 60, radius: 10 }))
  })
})

describe('migrate', () => {
  it('should migrate location', () => {
    Settings.worldDatabase.get(group.id)[point.id] = '1 0 1'
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
    Settings.worldDatabase.get(group.id)[point.id] = '1 0 1'
    const consoleErrorSpy = vi.spyOn(console, 'warn')

    migrateLocationName('unknown group', 'does not exists', group.id, point.id)

    expect(consoleErrorSpy.mock.calls[0]).toBeUndefined()
    expect(Settings.worldDatabase.get(group.id)[point.id]).toBe('1 0 1')
  })

  it('should not migrate location that was empty', () => {
    const consoleErrorSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    migrateLocationName('unknown group', 'was never defined', group.id, point.id)

    expect(consoleErrorSpy.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "§cNo location found at §funknown group§c:§fwas never defined§c",
      ]
    `)
    expect(Settings.worldDatabase.get(group.id)[point.id]).toBeUndefined()
  })
})
