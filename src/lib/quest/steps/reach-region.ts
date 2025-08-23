import { Region } from 'lib/region/kinds/region'
import { RegionEvents } from 'lib/region/events'
import { PlayerQuest } from '../player'

export function QSReachRegion(this: PlayerQuest, region: Region, text: Text) {
  return this.dynamic(text).activate(ctx => {
    ctx.target = { location: region.area.center, dimensionType: region.dimensionType }

    const unsubscribe = RegionEvents.onEnter(region, player => {
      if (player.id !== this.player.id) return
      ctx.next()
    })

    return { cleanup: unsubscribe }
  })
}
