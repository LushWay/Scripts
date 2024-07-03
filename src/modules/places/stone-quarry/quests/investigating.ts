import { isNotPlaying, Temporary } from 'lib'
import { Quest } from 'lib/quest/index'
import { RegionEvents } from 'lib/region/events'
import { StoneQuarry } from 'modules/places/stone-quarry/stone-quarry'

class StoneQuarryInvestigating {
  place = StoneQuarry

  quest = new Quest('StoneQuarryInvestigating', StoneQuarry.name, 'Исследуйте новый город!', (q, p) => {
    q.dynamic('поговорите с горожанами')
      .description('Лучше всего узнавать о городе у местных, поговорите с ними!')
      .activate(ctx => {
        return new Temporary(() => {
          // TODO
        })
      })
  })

  constructor() {
    if (this.place.safeArea) {
      if (__RELEASE__)
        RegionEvents.onEnter(this.place.safeArea, player => {
          if (isNotPlaying(player)) return
          this.quest.enter(player)
          this.place.cutscene.play(player)
        })
    }
  }
}

new StoneQuarryInvestigating()
