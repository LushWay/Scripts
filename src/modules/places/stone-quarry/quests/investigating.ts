import { Temporary } from 'lib'
import { RegionEvents } from 'lib/region/events'
import { StoneQuarry } from 'modules/places/stone-quarry/stone-quarry'
import { Cutscene } from 'modules/quests/lib/cutscene'
import { Quest } from 'modules/quests/lib/quest'
import { isNotPlaying } from 'modules/world-edit/isBuilding'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
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
          return new Temporary(() => {
            // TODO WRITE
          })
        },
      })
    },
  )

  static init() {
    RegionEvents.onEnter(this.place.safeArea, player => {
      if (isNotPlaying(player)) return

      this.quest.enter(player)
      this.cutscene.play(player)
    })
  }
}

StoneQuarryInvestigating.init()
