import { PlaceAction } from 'lib/action'
import { RegionEvents } from 'lib/region/events'
import { Region } from 'lib/region/index'
import { Vector } from 'lib/vector'
import { PlayerQuest } from '../player'

export function QSPlace(this: PlayerQuest, from: Vector3, to: Vector3, text: Text) {
  return this.dynamic(text).activate(ctx => {
    const actions = [...Vector.forEach(from, to)].map(pos =>
      PlaceAction.onEnter(pos, player => {
        if (player.id !== this.player.id) return
        ctx.next()
      }),
    )

    const min = Vector.min(from, to)
    const max = Vector.max(from, to)
    const size = Vector.subtract(max, min)
    const edge = Vector.multiply(size, 0.5)
    ctx.place = Vector.add(Vector.add(min, edge), { x: 1, y: 1, z: 1 })

    return { cleanup: () => actions.forEach(a => a.unsubscribe()) }
  })
}

export function QSPlaceRegion(this: PlayerQuest, region: Region, text: Text) {
  return this.dynamic(text).activate(ctx => {
    ctx.place = region.area.center

    const unsubscribe = RegionEvents.onEnter(region, player => {
      if (player.id !== this.player.id) return
      ctx.next()
    })

    return { cleanup: unsubscribe }
  })
}
