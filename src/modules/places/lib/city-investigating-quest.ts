import { isNotPlaying } from 'lib'
import { Quest } from 'lib/quest'
import { RegionEvents } from 'lib/region/events'
import { City } from './city'

export class CityInvestigating<T extends City> {
  quest: Quest

  goToCityQuest = new Quest(
    `${this.place.group.id}GoTo`,
    this.place.name,
    'Доберитесь до указанного города или деревни',
    (q, player) => {
      if (!this.place.safeArea) return q.failed('Город не настроен!')

      q.region(this.place.safeArea, 'Доберитесь до города!')
    },
  )

  constructor(
    readonly place: T,
    private q: (city: T, ...params: Parameters<Quest['create']>) => void,
  ) {
    Quest.onLoad.subscribe(() => {
      if (this.place.safeArea) {
        RegionEvents.onEnter(this.place.safeArea, player => {
          if (isNotPlaying(player)) return
          if (!this.quest.isCompleted(player) && !this.quest.getPlayerStep(player)) this.quest.enter(player)
        })
      }
    })

    this.quest = new Quest(
      `${this.place.group.id}Investigating`,
      this.place.name,
      'Исследуйте новый город!',
      (q, player) => {
        if (!this.place.safeArea) return q.failed('Город не настроен!')

        if (this.place.cutscene.sections.length)
          q.dynamic('Обзор города').activate(ctx => {
            this.place.cutscene.play(ctx.player)?.finally(() => ctx.next())
          })

        this.q(this.place, q, player)
      },
    )
  }
}
