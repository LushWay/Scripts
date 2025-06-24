import { t } from 'lib/i18n/text'
import { CityInvestigating } from 'modules/places/lib/city-investigating-quest'
import { VillageOfExplorers } from '../village-of-explorers'

export const villageOfExplorersInvestigating = new CityInvestigating(VillageOfExplorers, (place, q, player) => {
  q.dialogue(place.mage.npc, t`Посетите Мага`)
})
