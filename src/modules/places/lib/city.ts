import { location, LootTable } from 'lib'
import { Crate } from 'lib/crates/crate'
import { Cutscene } from 'lib/cutscene'
import { Quest } from 'lib/quest'
import { FloatingText } from 'lib/rpg/floating-text'
import { t } from 'lib/text'
import { Jeweler } from 'modules/places/lib/npc/jeweler'
import { Scavenger } from './npc/scavenger'
import { SafePlace } from './safe-place'
import { form, NewFormCreator } from 'lib/form/new'
import { Npc } from 'lib/rpg/npc'

export abstract class City extends SafePlace {
  quests: Quest[] = []

  createQuest() {
    // return new Quest()
  }

  protected createKits(normalLoot: LootTable, donutLoot: LootTable) {
    normalLoot.id = `§7${this.group.id}§f Normal Crate`
    donutLoot.id = `§7${this.group.id}§f Donut Crate`
    const normal = new Crate(this.group.point('normal kit').name(t`§7Обычный`), normalLoot)
    const donut = new Crate(this.group.point('donut kit').name(t`§bУсиленный`), donutLoot)
    const storageLocationpoint = this.group.point('storage text').name(t`§9Хранилище`)
    const storageLocation = location(storageLocationpoint)
    const storageFloatingText = new FloatingText(storageLocationpoint.fullId, this.group.dimensionType)
    storageLocation.onLoad.subscribe(location => {
      storageFloatingText.update(location, storageLocationpoint.name)
    })

    return { normal, donut }
  }

  cutscene = new Cutscene(this.group.id, 'Исследование ' + this.name)

  jeweler = new Jeweler(this.group)

  scavenger = new Scavenger(this.group)

  abstract guide: Npc
}
