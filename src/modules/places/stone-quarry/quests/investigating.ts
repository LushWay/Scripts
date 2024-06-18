import { Temporary } from 'lib'
import { Cutscene } from 'lib/cutscene/index'
import { Quest } from 'lib/quest/index'
import { StoneQuarry } from 'modules/places/stone-quarry/stone-quarry'

export class StoneQuarryInvestigating {
  static place = StoneQuarry

  static quest = new Quest('StoneQuarryInvestigating', StoneQuarry.name, 'Исследуйте новый город!', (q, p) => {
    q.dynamic('поговорите с горожанами')
      .description('Лучше всего узнавать о городе у местных, поговорите с ними!')
      .activate(ctx => {
        return new Temporary(() => {
          // TODO
        })
      })
  })

  static cutscene = new Cutscene(this.quest.id, 'Исследование каменоломни')

  static {
    // RegionEvents.onEnter(this.place.safeArea, player => {
    //   if (isNotPlaying(player)) return
    //   this.quest.enter(player)
    //   this.cutscene.play(player)
    // })
  }
}
