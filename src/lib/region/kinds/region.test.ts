import { Player } from '@minecraft/server'
import 'lib/load/extensions'

import { Vector } from 'lib'
import 'lib/database/player'
import { describe, expect, it } from 'vitest'
import { SphereArea } from '../areas/sphere'
import { Region } from './region'

describe('Region', () => {
  it('should create region', () => {
    expect(Region.create(new SphereArea({ center: Vector.zero, radius: 0 }, 'overworld'))).toBeInstanceOf(Region)
  })

  it('should return owner name', () => {
    // @ts-expect-error
    const player = new Player() as Player
    const region = Region.create(new SphereArea({ center: Vector.zero, radius: 0 }, 'overworld'), {
      permissions: { owners: [player.id] },
    })

    expect(region.ownerName).toBe(player.name)
  })
})
