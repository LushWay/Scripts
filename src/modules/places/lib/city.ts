import { LootTable } from 'lib'
import { ChestLoot } from 'lib/chest-loot/chest-loot'
import { Cutscene } from 'lib/cutscene'
import { Quest } from 'lib/quest'
import { t } from 'lib/text'
import { Jeweler } from 'modules/places/lib/npc/jeweler'
import { PlaceWithSafeArea } from './place-with-safearea'

export class City extends PlaceWithSafeArea {
  quests: Quest[] = []

  createQuest() {
    // return new Quest()
  }

  protected createKits(normalLoot: LootTable, donutLoot: LootTable) {
    const normal = new ChestLoot(this.group.point('normal kit').name(t`§7Обычный`), normalLoot)
    const donut = new ChestLoot(this.group.point('donut kit').name(t`§6Донатный`), donutLoot)

    return { normal, donut }
  }

  cutscene = new Cutscene(this.group.id, 'Исследование ' + this.name)

  jeweler = new Jeweler(this.group)
}
