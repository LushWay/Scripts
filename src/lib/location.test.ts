import { Player } from '@minecraft/server'
import 'lib/extensions/player'

import 'lib/database/player'
import { MockInstance, beforeEach, describe, expect, it, vi } from 'vitest'
import { table } from './database/abstract'
import { location, locationWithRadius, locationWithRotation, migrateLocationName } from './location'
import { Settings } from './settings'

beforeEach(() => {
  Settings.worldMap = {}
  Settings.worldDatabase = table('location', () => ({}))
})

describe('location', () => {
  it('should create a location', () => {
    const loc = location('group1', 'name1', 'display name')
    expect(loc.valid).toBe(false)
    expect(loc.onLoad).toBeDefined()
    expect(loc.teleport).toBeDefined()
  })

  it('should create a location with default values', () => {
    const loc = location('group1', 'name1', 'display name', { x: 10, y: 40, z: 60 })
    expect(loc.valid).toBe(true)
    expect(loc.onLoad).toBeDefined()
    expect(loc.teleport).toBeDefined()
  })

  it('should load and update location from Settings', () => {
    Settings.worldDatabase['group1'] = { name1: '10 20 30' }
    const loc = location('group1', 'name1', 'display name')
    expect(loc.valid).toBe(true)
    if (!loc.valid) return

    expect(loc.x).toBe(10)
    expect(loc.y).toBe(20)
    expect(loc.z).toBe(30)

    Settings.worldDatabase['group1'] = { name1: '40 60 30' }
    Settings.worldMap['group1']['name1'].onChange?.()
    expect(loc.x).toBe(40)
    expect(loc.y).toBe(60)
    expect(loc.z).toBe(30)
  })

  it('should emit event on location change', () => {
    Settings.worldDatabase['group1'] = { name1: '0 0 1' }
    const loc = location('group1', 'name1', 'display name')
    const callback = vi.fn()

    loc.onLoad.subscribe(callback)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 0, y: 0, z: 1 }))
    expect(loc.firstLoad).toBe(true)

    const settings = Settings.parseConfig(Settings.worldDatabase, 'group1', Settings.worldMap['group1'])
    settings['name1'] = '40 50 60'
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 40, y: 50, z: 60 }))
    expect(loc.firstLoad).toBe(false)
  })

  it('should not load invalid location', () => {
    const consoleErrorSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    Settings.worldDatabase['group1'] = { name1: 'in va lid' }
    location('group1', 'name1', 'display name')

    expect(consoleErrorSpy.mock.calls[0]).toMatchInlineSnapshot(`
      [
        [TypeError: Invalid location, expected 'x y z' but recieved 'in va lid'],
      ]
    `)
  })

  it('should teleport', () => {
    const loc = location('group', 'name', 'display name', { x: 0, y: 1, z: 1 })
    // @ts-expect-error
    const player = new Player() as Player
    loc.teleport(player)
    expect((player.teleport as unknown as MockInstance).mock.calls[0]).toEqual([
      {
        x: 0.5,
        y: 0,
        z: 0.5,
      },
      {},
    ])
  })
})

describe('locationWithRotation', () => {
  it('should create a location with rotation with default values', () => {
    const loc = locationWithRotation('group2', 'name2', 'display name')

    expect(loc.valid).toBe(false)
    expect(loc.onLoad).toBeDefined()
    expect(loc.teleport).toBeDefined()
  })

  it('should load and update location with rotation from Settings', () => {
    Settings.worldDatabase['group2'] = { name2: '10 20 30 45 90' }
    const loc = locationWithRotation('group2', 'name2', 'display name')

    expect(loc.valid).toBe(true)
    if (!loc.valid) return

    expect(loc.x).toBe(10)
    expect(loc.y).toBe(20)
    expect(loc.z).toBe(30)
    expect(loc.xRot).toBe(45)
    expect(loc.yRot).toBe(90)
  })

  it('should emit event on location with rotation change', () => {
    Settings.worldDatabase['group2'] = { name2: '10 20 30 45 90' }
    const loc = locationWithRotation('group2', 'name2', 'display name')
    const callback = vi.fn()

    loc.onLoad.subscribe(callback)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 10, y: 20, z: 30, xRot: 45, yRot: 90 }))

    const settings = Settings.parseConfig(Settings.worldDatabase, 'group2', Settings.worldMap['group2'])
    settings['name2'] = '40 50 60 30 60'

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 40, y: 50, z: 60, xRot: 30, yRot: 60 }))
  })

  it('should teleport', () => {
    const loc = locationWithRotation('group', 'name', 'display name', { x: 0, y: 1, z: 1, xRot: 90, yRot: 0 })
    // @ts-expect-error
    const player = new Player() as Player
    loc.teleport(player)
    expect((player.teleport as unknown as MockInstance).mock.calls[0]).toEqual([
      {
        x: 0.5,
        y: 0,
        z: 0.5,
      },
      {
        rotation: {
          x: 90,
          y: 0,
        },
      },
    ])
  })
})

describe('locationWithRadius', () => {
  it('should create a location with radius with default values', () => {
    const loc = locationWithRadius('group3', 'name3', 'display name')
    expect(loc.valid).toBe(false)
    expect(loc.onLoad).toBeDefined()
    expect(loc.teleport).toBeDefined()
  })

  it('should load and update location with radius from Settings', () => {
    Settings.worldDatabase['group3'] = { name3: '10 20 30 5' }
    const loc = locationWithRadius('group3', 'name3', 'display name')

    expect(loc.valid).toBe(true)
    if (!loc.valid) return

    expect(loc.x).toBe(10)
    expect(loc.y).toBe(20)
    expect(loc.z).toBe(30)
    expect(loc.radius).toBe(5)
  })

  it('should emit event on location with radius change', () => {
    Settings.worldDatabase['group3'] = { name3: '10 20 30 5' }
    const loc = locationWithRadius('group3', 'name3', 'display name')
    const callback = vi.fn()
    loc.onLoad.subscribe(callback)

    const settings = Settings.parseConfig(Settings.worldDatabase, 'group3', Settings.worldMap['group3'])
    settings['name3'] = '40 50 60 10'

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 40, y: 50, z: 60, radius: 10 }))
  })
})

describe('migrate', () => {
  it('should migrate location', () => {
    Settings.worldDatabase['group']['name2'] = '1 0 1'
    const consoleLogSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})

    Settings.worldDatabase['locations']['oldname'] = '1 0 1'
    migrateLocationName('locations', 'oldname', 'group', 'name')

    expect(Settings.worldDatabase['group']['name']).toBe('1 0 1')
    expect(consoleLogSpy.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "§7Migrating location §flocations§7:§foldname§7 to §fgroup§7:§fname§7",
      ]
    `)
  })

  it('should not migrate already migrated location', () => {
    Settings.worldDatabase['group']['name2'] = '1 0 1'
    const consoleErrorSpy = vi.spyOn(console, 'warn')

    migrateLocationName('unknown group', 'does not exists', 'group', 'name2')

    expect(consoleErrorSpy.mock.calls[0]).toBeUndefined()
    expect(Settings.worldDatabase['group']['name2']).toBe('1 0 1')
  })

  it('should not migrate location that was empty', () => {
    Settings.worldDatabase['group']['name2'] = '1 0 1'
    const consoleErrorSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    migrateLocationName('unknown group', 'was never defined', 'group', 'name3')

    expect(consoleErrorSpy.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "§cNo location found at §funknown group§c:§fwas never defined§c",
      ]
    `)
    expect(Settings.worldDatabase['group']['name3']).toBeUndefined()
  })
})
