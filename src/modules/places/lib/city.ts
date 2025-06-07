import { location, LootTable } from 'lib'
import { Crate } from 'lib/crates/crate'
import { Cutscene } from 'lib/cutscene'
import { Quest } from 'lib/quest'
import { FloatingText } from 'lib/rpg/floating-text'
import { Npc } from 'lib/rpg/npc'
import { t } from 'lib/text'
import { Jeweler } from 'modules/places/lib/npc/jeweler'
import { Scavenger } from './npc/scavenger'
import { SafePlace } from './safe-place'
import { DailyQuest } from 'lib/quest/quest'

export abstract class City extends SafePlace {
  protected createKits(normalLoot: LootTable, donutLoot: LootTable) {
    normalLoot.id = `§7${this.group.id}§f Normal Crate`
    donutLoot.id = `§7${this.group.id}§f Donut Crate`
    const normal = new Crate(this.group.place('normal kit').name(t`§7Обычный`), normalLoot)
    const donut = new Crate(this.group.place('donut kit').name(t`§bУсиленный`), donutLoot)
    const storageLocationpoint = this.group.place('storage text').name(t`§9Хранилище`)
    const storageLocation = location(storageLocationpoint)
    const storageFloatingText = new FloatingText(storageLocationpoint.id, this.group.dimensionType)
    storageLocation.onLoad.subscribe(location => {
      storageFloatingText.update(location, storageLocationpoint.name)
    })

    return { normal, donut }
  }

  cutscene = new Cutscene(this.group.id, 'Исследование ' + this.name)

  jeweler = new Jeweler(this.group)

  scavenger = new Scavenger(this.group)

  // TODO Standartized guide ui
  // use quests from the Quest.quests and filter them by linked place
  // also add some info about the city
  abstract guide: Npc

  visitCityQuest = new DailyQuest(
    this.group.place('visit').name(''),
    'Сходи в город, сделай запланированые покупки',
    q => {
      if (this.safeArea) q.reachRegion(this.safeArea, `Посети ${this.group.name}`)
    },
  )
}
