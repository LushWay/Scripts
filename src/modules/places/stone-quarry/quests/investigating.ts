import { isNotPlaying, Vector } from 'lib'
import { Quest } from 'lib/quest/index'
import { RegionEvents } from 'lib/region/events'
import { StoneQuarry } from 'modules/places/stone-quarry/stone-quarry'

class StoneQuarryInvestigating {
  private place = StoneQuarry

  quest = new Quest('StoneQuarryInvestigating', StoneQuarry.name, 'Исследуйте новый город!', (q, p) => {
    if (!StoneQuarry.safeArea || !StoneQuarry.cutscene.start) return q.failed('Каменеломня не настроена')

    if (!StoneQuarry.safeArea.area.isVectorIn(p.location, p.dimension.type)) {
      q.place(...Vector.around(StoneQuarry.cutscene.start, 4), 'Доберитесь до города!')
      q.dynamic('Обзор города').activate(ctx => {
        this.place.cutscene.play(ctx.player)?.finally(() => ctx.next())
      })
    }
    q.dialogue(this.place.commonOvener.npc)
      .body('ПРивет я продаю печки даааaaаааа')
      .buttons([
        'Хоршо отлично я у тебя их куплю и переплавлю руду',
        ctx => {
          ctx.next()
        },
      ])
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

export const stoneQuarryInvestigating = new StoneQuarryInvestigating()
