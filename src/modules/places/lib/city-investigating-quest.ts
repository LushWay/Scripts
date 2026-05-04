import { i18n, noI18nShared } from 'lib/i18n/text'
import { Quest } from 'lib/quest'
import { RegionEvents } from 'lib/region/events'
import { isNotPlaying } from 'lib/utils/game'
import { City } from './city'

export class CityInvestigating<T extends City> {
  static list: CityInvestigating<City>[] = []

  quest: Quest

  goToCityQuest = new Quest(
    this.city.group.place('goTo').name(noI18nShared``),
    i18n`Доберитесь до указанного города или деревни`,
    q => {
      if (!this.city.safeArea) return q.failed(i18n`${this.city.name}: задание исследования не настроено!`)

      q.reachRegion(this.city.safeArea, i18n`Доберитесь до города!`)
    },
    true,
  )

  constructor(
    readonly city: T,
    private q: (city: T, ...params: Parameters<Quest.Create>) => ReturnType<Quest.Create>,
  ) {
    CityInvestigating.list.push(this as unknown as CityInvestigating<City>)

    this.quest = new Quest(
      this.city.group.place('investigating').name(noI18nShared``),
      i18n`Исследуйте новый город!`,
      (q, player) => {
        if (!this.city.safeArea) return q.failed(i18n`${this.city.name}: задание исследования не настроено!`)

        q.dialogue(this.city.guide, undefined, true)

        return this.q(this.city, q, player)
      },
      true,
    )
  }
}
