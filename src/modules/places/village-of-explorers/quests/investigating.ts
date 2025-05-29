import { CityInvestigating } from 'modules/places/lib/city-investigating-quest'
import { VillageOfExplorers } from '../village-of-explorers'

export const villageOfExplorersInvestigating = new CityInvestigating(VillageOfExplorers, (place, q, player) => {
  q.dialogue(place.guide)
    .body(
      'Привет я исследователь на пенсии поэтому стою тут а ты иди исследуй деревню село хату мою че стоишь кого ждешь',
    )
    .buttons(['Хорошо отлично досвидания пока агрокомплекс', ctx => ctx.next()])

  q.dialogue(place.mage.npc, 'Посетите Мага').body('').buttons()
})
