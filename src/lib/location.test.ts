import { beforeEach, describe, expect, it, vi } from 'vitest'
import { table } from './database/abstract'
import { location, locationWithRadius, locationWithRotation } from './location'
import { Settings } from './settings'

beforeEach(() => {
  Settings.worldMap = {}
  Settings.worldDatabase = table('location', () => ({}))
})

describe('location', () => {
  it('should create a location with default values', () => {
    const loc = location('group1', 'name1')
    expect(loc.valid).toBe(false)
    expect(loc.onLoad).toBeDefined()
    expect(loc.teleport).toBeDefined()
  })

  it('should load and update location from Settings', () => {
    Settings.worldDatabase['group1'] = { name1: '10 20 30' }
    const loc = location('group1', 'name1')
    expect(loc.valid).toBe(true)
    if (!loc.valid) return

    expect(loc.x).toBe(10)
    expect(loc.y).toBe(20)
    expect(loc.z).toBe(30)
  })

  it('should emit event on location change', () => {
    Settings.worldDatabase['group1'] = { name1: '0 0 1' }
    const loc = location('group1', 'name1')
    const callback = vi.fn()

    loc.onLoad.subscribe(callback)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 0, y: 0, z: 1 }))
    expect(loc.firstLoad).toBe(true)

    const settings = Settings.parseConfig(Settings.worldDatabase, 'group1', Settings.worldMap['group1'])
    settings['name1'] = '40 50 60'
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 40, y: 50, z: 60 }))
    expect(loc.firstLoad).toBe(false)
  })
})

describe('locationWithRotation', () => {
  it('should create a location with rotation with default values', () => {
    const loc = locationWithRotation('group2', 'name2')

    expect(loc.valid).toBe(false)
    expect(loc.onLoad).toBeDefined()
    expect(loc.teleport).toBeDefined()
  })

  it('should load and update location with rotation from Settings', () => {
    Settings.worldDatabase['group2'] = { name2: '10 20 30 45 90' }
    const loc = locationWithRotation('group2', 'name2')

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
    const loc = locationWithRotation('group2', 'name2')
    const callback = vi.fn()

    loc.onLoad.subscribe(callback)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 10, y: 20, z: 30, xRot: 45, yRot: 90 }))

    const settings = Settings.parseConfig(Settings.worldDatabase, 'group2', Settings.worldMap['group2'])
    settings['name2'] = '40 50 60 30 60'

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 40, y: 50, z: 60, xRot: 30, yRot: 60 }))
  })
})

describe('locationWithRadius', () => {
  it('should create a location with radius with default values', () => {
    const loc = locationWithRadius('group3', 'name3')
    expect(loc.valid).toBe(false)
    expect(loc.onLoad).toBeDefined()
    expect(loc.teleport).toBeDefined()
  })

  it('should load and update location with radius from Settings', () => {
    Settings.worldDatabase['group3'] = { name3: '10 20 30 5' }
    const loc = locationWithRadius('group3', 'name3')

    expect(loc.valid).toBe(true)
    if (!loc.valid) return

    expect(loc.x).toBe(10)
    expect(loc.y).toBe(20)
    expect(loc.z).toBe(30)
    expect(loc.radius).toBe(5)
  })

  it('should emit event on location with radius change', () => {
    Settings.worldDatabase['group3'] = { name3: '10 20 30 5' }
    const loc = locationWithRadius('group3', 'name3')
    const callback = vi.fn()
    loc.onLoad.subscribe(callback)

    const settings = Settings.parseConfig(Settings.worldDatabase, 'group3', Settings.worldMap['group3'])
    settings['name3'] = '40 50 60 10'

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ x: 40, y: 50, z: 60, radius: 10 }))
  })
})
