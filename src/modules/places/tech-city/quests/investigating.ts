import { CityInvestigating } from 'modules/places/lib/city-investigating-quest'
import { TechCity } from '../tech-city'

export const techCityInvestigating = new CityInvestigating(TechCity, (place, q, player) => {
  q.dialogue(place.engineer.npc)
    .body('Привет я инжир купи у меня базу пушку все купи')
    .buttons(['Хорошо отлично у меня нет денег иди в баню', ctx => ctx.next()])
})
