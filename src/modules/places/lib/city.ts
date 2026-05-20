import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Crate } from 'lib/crates/crate'
import { i18n, i18nShared } from 'lib/i18n/text'
import { location } from 'lib/location'
import { DailyQuest } from 'lib/quest/quest'
import { actionGuard, ActionGuardOrder } from 'lib/region'
import { FloatingText } from 'lib/rpg/floating-text'
import { LootTable } from 'lib/rpg/loot-table'
import { Npc } from 'lib/rpg/npc'
import { Jeweler } from 'modules/places/lib/npc/jeweler'
import { Scavenger } from './npc/scavenger'
import { SafePlace } from './safe-place'

export abstract class City extends SafePlace {
  protected createKits(normalLoot: LootTable, donutLoot: LootTable) {
    normalLoot.id = `§7${this.group.id}§f Normal Crate`
    donutLoot.id = `§7${this.group.id}§f Donut Crate`
    const normal = new Crate(this.group.place('normal kit').name(i18nShared`§7Обычный`), normalLoot)
    const donut = new Crate(this.group.place('donut kit').name(i18nShared`§bУсиленный`), donutLoot)
    const storageLocationpoint = this.group.place('storage text').name(i18nShared`§9Хранилище`)
    const storageLocation = location(storageLocationpoint)
    const storageFloatingText = new FloatingText(storageLocationpoint.id, this.group.dimensionType)
    storageLocation.onLoad.subscribe(location => {
      storageFloatingText.update(location, storageLocationpoint.name)
    })

    this.normalCrate = normal
    this.donutCrate = donut
  }

  normalCrate?: Crate

  donutCrate?: Crate

  jeweler = new Jeweler(this.group)

  scavenger = new Scavenger(this.group)

  abstract guide: Npc

  visitCityQuest = new DailyQuest(
    this.group.place('visit').name(i18nShared`Посети город`),
    i18n`Сходи в город, сделай запланированые покупки`,
    q => {
      if (this.safeArea) q.reachRegion(this.safeArea, `0/1`)
    },
    true,
  )
}

actionGuard((_, __, ctx) => {
  if (ctx.type === 'interactWithBlock' && ctx.event.block.typeId === MinecraftBlockTypes.EnderChest) return true
}, ActionGuardOrder.Feature)
