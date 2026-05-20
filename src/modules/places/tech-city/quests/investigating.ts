import { i18n } from 'lib/i18n/text'
import { CityInvestigating } from 'modules/places/lib/city-investigating-quest'
import { TechCity } from '../tech-city'

export const techCityInvestigating = new CityInvestigating(TechCity, (place, q, player) => {
  q.cutscene('tsShowcase1', i18n`Приветствуем в самом технологичном городе!`)
  q.cutscene('tsShowcase2', i18n`Мы обосновались вокруг озера, оставшегося после взрыва бункера`)
  q.cutscene('tsShowcase3', i18n`И переняли уцелевшие технологии прошлой эпохи`)
  q.cutscene('tsShowcase4', i18n`Идите к ${i18n.accent`Инженеру`}, он расскажет вам что такое ${i18n.accent`База`}`)

  q.dialogue(place.engineer.npc, undefined, true)

  q.cutscene('tsBase1', i18n`Чтобы ваши постройки не разложились из-за радиации...`)
  q.cutscene('tsBase2', i18n`...и не были разворованы другими выжившими...`)
  q.cutscene('tsBase3', i18n`...мы изобрели ${i18n.accent`Базу`}`)

  q.cutscene('tsBase5', i18n`База - самый дорогой предмет в нашу эпоху, для нее нужно много ресурсов`)
  q.cutscene('tsBase4', i18n`Только я могу ее собрать`)

  q.end(ctx => {
    ctx.player.tell(
      'Тут он скажет типа возьми задание на сбор ресов для базы. После этого задания пошлет к самому инжику мол купи базу',
    )
  })
})
