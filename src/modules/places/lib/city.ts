import { LootTable } from 'lib'
import { Crate } from 'lib/crates/crate'
import { Cutscene } from 'lib/cutscene'
import { Quest } from 'lib/quest'
import { t } from 'lib/text'
import { Jeweler } from 'modules/places/lib/npc/jeweler'
import { Scavenger } from './npc/scavenger'
import { SafePlace } from './safe-place'

export class City extends SafePlace {
  quests: Quest[] = []

  createQuest() {
    // return new Quest()
  }

  protected createKits(normalLoot: LootTable, donutLoot: LootTable) {
    normalLoot.id = `§7${this.group.id}§f Normal Crate`
    donutLoot.id = `§7${this.group.id}§f Donut Crate`
    const normal = new Crate(this.group.point('normal kit').name(t`§7Обычный`), normalLoot)
    const donut = new Crate(this.group.point('donut kit').name(t`§bУсиленный`), donutLoot)

    return { normal, donut }
  }

  cutscene = new Cutscene(this.group.id, 'Исследование ' + this.name)

  jeweler = new Jeweler(this.group)

  scavenger = new Scavenger(this.group)
}
