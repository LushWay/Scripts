import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { i18n } from 'lib/i18n/text'
import { assertLoaded } from 'lib/util'
import { CityInvestigating } from 'modules/places/lib/city-investigating-quest'
import { StoneQuarry } from 'modules/places/stone-quarry/stone-quarry'
import { villageOfExplorersInvestigating } from 'modules/places/village-of-explorers/quests/investigating'
import { VillageOfExplorers } from 'modules/places/village-of-explorers/village-of-explorers'

export const stoneQuarryInvestigating = new CityInvestigating(StoneQuarry, (place, q, player) => {
  assertLoaded(VillageOfExplorers.safeArea, 'VillageOfExplorers.safeArea')

  q.cutscene('sqOverview1', i18n`Приветствуем в самом старом и большом городе новой эпохи!`)
  q.cutscene('sqOverview2', i18n`Мы специализируемся на обработке руды`)
  q.cutscene('sqOverview3', i18n`У ${i18n.accent`Печкина`} можно купить ключ доступа к печам`)

  q.item(i18n`Купите у ${i18n.accent`Печкина`} ключ доступа к печам`)
    .isItem(item => place.commonOvener.isKey(item))
    .target(place.commonOvener.npc.location.toPoint())

  q.dynamic(i18n`Откройте печку с помощью ключа`).activate(ctx => {
    ctx.subscribe(place.commonOvener.onFurnaceLock, event => {
      if (event.player.id === player.id) ctx.next()
    })
  })

  q.item(i18n`Переплавьте необработанное железо в слиток`).isItem(e => e.typeId === MinecraftItemTypes.IronIngot)

  q.item(i18n`Сделайте железную кирку`)
    .isItem(e => e.typeId === MinecraftItemTypes.IronPickaxe)
    .target(place.craftingTable.toPoint())

  q.item(i18n`Сделайте железный меч`)
    .isItem(e => e.typeId === MinecraftItemTypes.IronSword)
    .target(place.craftingTable.toPoint())

  q.item(i18n`Сделайте железный нагрудник`)
    .isItem(e => e.typeId === MinecraftItemTypes.IronChestplate)
    .target(place.craftingTable.toPoint())

  q.item(i18n`Сделайте железный шлем`)
    .isItem(e => e.typeId === MinecraftItemTypes.IronHelmet)
    .target(place.craftingTable.toPoint())

  q.item(i18n`Сделайте железные поножи`)
    .isItem(e => e.typeId === MinecraftItemTypes.IronLeggings)
    .target(place.craftingTable.toPoint())

  q.item(i18n`Сделайте железные ботинки`)
    .isItem(e => e.typeId === MinecraftItemTypes.IronBoots)
    .target(place.craftingTable.toPoint())

  q.dialogue(place.foodOvener.npc)

  q.dialogue(place.gunsmith.npc)

  q.dialogue(place.auntzina.npc)

  q.dialogue(place.coachman.npc)

  q.dialogue(place.scavenger.npc)

  q.reachRegion(VillageOfExplorers.safeArea, i18n`Доберитесь до ${i18n.accent`Деревни исследователей`} по дороге`)

  q.nextQuest(villageOfExplorersInvestigating.quest)
})
