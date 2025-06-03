import { PlaceAction } from 'lib/action'
import { Vec } from 'lib/vector'
import { PlayerQuest } from '../player'

export function QSReachArea(
  this: PlayerQuest,
  from: Vector3,
  to: Vector3,
  text: Text,
  dimensionType: DimensionType = 'overworld',
) {
  return this.dynamic(text).activate(ctx => {
    const actions = [...Vec.forEach(from, to)].map(pos =>
      PlaceAction.onEnter(
        pos,
        player => {
          if (player.id !== this.player.id) return
          ctx.next()
        },
        dimensionType,
      ),
    )

    const min = Vec.min(from, to)
    const max = Vec.max(from, to)
    const size = Vec.subtract(max, min)
    const edge = Vec.multiply(size, 0.5)
    ctx.target = { location: Vec.add(Vec.add(min, edge), { x: 1, y: 1, z: 1 }), dimensionType }

    return { cleanup: () => actions.forEach(a => a.unsubscribe()) }
  })
}
