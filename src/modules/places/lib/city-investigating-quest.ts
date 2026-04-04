import { i18n } from 'lib/i18n/text'
import { Quest } from 'lib/quest'
import { RegionEvents } from 'lib/region/events'
import { isNotPlaying } from 'lib/utils/game'
import { City } from './city'

export class CityInvestigating<T extends City> {
  static list: CityInvestigating<City>[] = []

  quest: Quest

  goToCityQuest = new Quest(
    this.city.group.place('goTo').name(''),
    i18n`Доберитесь до указанного города или деревни`,
    q => {
      if (!this.city.safeArea) return q.failed(i18n`Город не настроен!`)

      q.reachRegion(this.city.safeArea, i18n`Доберитесь до города!`)
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
      i18n`Исследуйте новый город!`,
      (q, player) => {
        if (!this.city.safeArea) return q.failed(i18n`Город не настроен!`)

        q.cutscene(this.city.cutscene, i18n`Обзор города`)

        q.dialogue(this.city.guide)

        this.q(this.city, q, player)
      },
      true,
    )
  }
}
