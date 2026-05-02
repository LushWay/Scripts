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

    ctx.target = { location: Vec.center(from, to), dimensionType }

    return { cleanup: () => actions.forEach(a => a.unsubscribe()) }
  })
}
