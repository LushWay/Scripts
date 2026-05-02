import { i18n, noI18n } from 'lib/i18n/text'
import { VectorInDimension } from 'lib/utils/point'
import { CityInvestigating } from 'modules/places/lib/city-investigating-quest'
import { StoneQuarry } from 'modules/places/stone-quarry/stone-quarry'
import { villageOfExplorersInvestigating } from 'modules/places/village-of-explorers/quests/investigating'
import { VillageOfExplorers } from 'modules/places/village-of-explorers/village-of-explorers'

export const stoneQuarryInvestigating = new CityInvestigating(StoneQuarry, (place, q, player) => {
  if (!VillageOfExplorers.safeArea) return q.failed(noI18n`Not loaded`)

  q.cutscene('sqOverview1', i18n`Это каменоломня`)
  q.cutscene('sqOverview2', i18n`Наш город специализируется на обработке руды`)
  q.cutscene('sqOverview3', i18n`У ${i18n.accent`Печкина`} можно купить ключ доступа к печам`)

  const buyKey = i18n`Купите у ${i18n.accent`Печкина`} ключ доступа к печам`
  q.dialogue(place.commonOvener.npc, buyKey)
  q.item(buyKey)
    .isItem(item => place.commonOvener.isKey(item))
    .target(place.commonOvener.npc.location.valid ? (place.commonOvener.npc as VectorInDimension) : undefined)

  q.dialogue(place.foodOvener.npc)

  // q.dialogue(place.barman.npc)

  q.dialogue(place.gunsmith.npc)

  q.dialogue(place.auntzina.npc)

  q.dialogue(place.coachman.npc)

  q.reachRegion(VillageOfExplorers.safeArea, i18n`Доберитесь до ${i18n.accent`Деревни исследователей`} по дороге`)

  q.nextQuest(villageOfExplorersInvestigating.quest)
})
