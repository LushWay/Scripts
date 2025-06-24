import { isNotPlaying } from 'lib'
import { t } from 'lib/i18n/text'
import { Quest } from 'lib/quest'
import { RegionEvents } from 'lib/region/events'
import { City } from './city'

export class CityInvestigating<T extends City> {
  static list: CityInvestigating<City>[] = []

  quest: Quest

  goToCityQuest = new Quest(
    this.city.group.place('goTo').name(''),
    t`Доберитесь до указанного города или деревни`,
    q => {
      if (!this.city.safeArea) return q.failed(t`Город не настроен!`)

      q.reachRegion(this.city.safeArea, t`Доберитесь до города!`)
    },
    true,
  )

  constructor(
    readonly city: T,
    private q: (city: T, ...params: Parameters<Quest['create']>) => void,
  ) {
    CityInvestigating.list.push(this as unknown as CityInvestigating<City>)

    Quest.onLoad.subscribe(() => {
      if (this.city.safeArea) {
        RegionEvents.onEnter(this.city.safeArea, player => {
          if (isNotPlaying(player)) return
          if (!this.quest.hadEntered(player)) this.quest.enter(player)
        })
      }
    })

    this.quest = new Quest(
      this.city.group.place('investigating').name(''),
      t`Исследуйте новый город!`,
      (q, player) => {
        if (!this.city.safeArea) return q.failed(t`Город не настроен!`)

        if (this.city.cutscene.sections.length)
          q.dynamic(t`Обзор города`).activate(ctx => {
            this.city.cutscene.play(ctx.player)?.finally(() => ctx.next())
          })

        q.dialogue(this.city.guide)

        this.q(this.city, q, player)
      },
      true,
    )
  }
}
