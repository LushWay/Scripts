import { CityInvestigating } from 'modules/places/lib/city-investigating-quest'
import { TechCity } from '../tech-city'

export const techCityInvestigating = new CityInvestigating(TechCity, (place, q, player) => {
  q.dialogue(place.engineer.npc)
})
