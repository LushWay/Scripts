import { CityInvestigating } from 'modules/places/lib/city-investigating-quest'
import { VillageOfExplorers } from '../village-of-explorers'
import { t } from 'lib/text'

export const villageOfExplorersInvestigating = new CityInvestigating(VillageOfExplorers, (place, q, player) => {
  q.dialogue(place.mage.npc, t`Посетите Мага`)
})
