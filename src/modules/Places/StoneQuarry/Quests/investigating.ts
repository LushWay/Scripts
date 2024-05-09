import { Region, Temporary } from 'lib'
import { StoneQuarry } from 'modules/Places/StoneQuarry/StoneQuarry'
import { Cutscene } from 'modules/Quests/lib/Cutscene'
import { Quest } from 'modules/Quests/lib/Quest'
import { isNotPlaying } from 'modules/WorldEdit/isBuilding'

class StoneQuarryInvestigating {
  static place = StoneQuarry

  static cutscene = new Cutscene('StoneQuarryInvestigating', 'Исследование каменоломни')

  static quest = new Quest(
    {
      id: 'stone quarry investigating',
      name: 'Каменоломня',
      desc: 'Исследуйте новый город!',
    },
    (q, p) => {
      q.dynamic({
        text: 'поговорите с горожанами',
        description: 'Лучше всего узнавать о городе у местных, поговорите с ними!',
        activate() {
          // @ts-expect-error TS(2554) FIXME: Expected 2 arguments, but got 1.
          return new Temporary(() => {})
        },
      })
    },
  )

  static init() {
    Region.onEnter(this.place.safeArea, player => {
      if (isNotPlaying(player)) return

      this.quest.enter(player)
      this.cutscene.play(player)
    })
  }
}

StoneQuarryInvestigating.init()
