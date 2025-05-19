import { CityInvestigating } from 'modules/places/lib/city-investigating-quest'
import { learningQuest } from 'modules/quests/learning/learning'
import { VillageOfMiners } from '../village-of-miners'

new CityInvestigating(VillageOfMiners, (place, q, player) => {
  q.dialogue(learningQuest.miner)
    .body('Привет я шахтер дадада')
    .buttons(['Хорошо отлично у меня нет денег иди в баню', ctx => ctx.next()])
})
