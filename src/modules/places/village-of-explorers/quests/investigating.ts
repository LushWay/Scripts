import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { i18n } from 'lib/i18n/text'
import { ExperienceLevelResource, ResourcesSource } from 'lib/rpg/resource-source'
import { assertLoaded } from 'lib/util'
import { CityInvestigating } from 'modules/places/lib/city-investigating-quest'
import { techCityInvestigating } from 'modules/places/tech-city/quests/investigating'
import { TechCity } from 'modules/places/tech-city/tech-city'
import { mineQuests } from 'modules/wiki/wiki'
import { VillageOfExplorers } from '../village-of-explorers'

export const villageOfExplorersInvestigating = new CityInvestigating(VillageOfExplorers, async (place, q, player) => {
  await q.waitForLoad(VillageOfExplorers.slimeBoss.onRegionCreate)

  const slimeResourceLocation = ResourcesSource.getLocationsByResource(r => r instanceof ExperienceLevelResource).find(
    e => e.place === VillageOfExplorers.slimeBoss.place,
  )

  assertLoaded(slimeResourceLocation, 'Slime resource location')

  const lapisQuest = mineQuests.find(e => e.ore.types.includes(MinecraftBlockTypes.LapisOre))?.quest

  assertLoaded(lapisQuest, 'Lapis quest')
  assertLoaded(TechCity.safeArea, 'TechCity.safeArea')

  q.cutscene('veShowcase1', i18n`Приветствуем в нашей деревне!`)
  q.cutscene('sqOverview2', i18n`Здесь есть шахта, ведущая к ${i18n.accent`Вардену`}`)
  q.cutscene('sqOverview2', i18n`У ${i18n.accent`Мага`} можно зачаровать предметы`)

  q.dialogue(place.mage.npc, i18n`Посетите Мага`)

  q.subQuest(
    slimeResourceLocation.reachQuest,
    i18n`Откройте Меню -> Вики -> Ресурсы -> Опыт -> Магический слайм -> Взять задание`,
  )

  q.subQuest(lapisQuest, i18n`Откройте Меню -> Вики -> Руды -> Лазурит -> Взять задание`)

  q.dynamic(i18n`Зачаруйте любой предмет у Мага`)
    .activate(ctx => {
      ctx.subscribe(place.mage.onBuy, event => {
        if (event.player.id === player.id) ctx.next()
      })
    })
    .target(place.mage.npc.location.toPoint())

  q.reachRegion(TechCity.safeArea, i18n`Доберитесь до ${i18n.accent`Технограда`} по дороге`)

  q.nextQuest(techCityInvestigating.quest)
})
