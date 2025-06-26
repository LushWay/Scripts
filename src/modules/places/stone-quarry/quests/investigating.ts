import { CityInvestigating } from 'modules/places/lib/city-investigating-quest'
import { StoneQuarry } from 'modules/places/stone-quarry/stone-quarry'

export const stoneQuarryInvestigating = new CityInvestigating(StoneQuarry, (place, q, player) => {
  q.dialogue(place.commonOvener.npc)

  q.dialogue(place.barman.npc)

  q.dialogue(place.auntzina.npc)

  q.dialogue(place.coachman.npc)

  q.dialogue(place.scavenger.npc)

  q.dialogue(place.gunsmith.npc)

  q.dialogue(place.foodOvener.npc)
})
