import { Loot, LootTable } from 'lib'
import { ChestLoot } from 'lib/chest-loot/chest-loot'
import { Quest } from 'lib/quest'
import { t } from 'lib/text'
import { PlaceWithSafeArea } from './place-with-safearea'
import { Cutscene } from 'lib/cutscene'

export class City extends PlaceWithSafeArea {
  quests: Quest[] = []

  createQuest() {
    // return new Quest()
  }

  protected createKits(normalLoot: (loot: Loot) => LootTable, donutLoot: (loot: Loot) => LootTable) {
    const normal = new ChestLoot(
      'normal kit',
      this.group,
      t`§7Обычный`,
      normalLoot(new Loot(this.group + ' normal kit')),
    )
    const donut = new ChestLoot('donut kit', this.group, t`§6Донатный`, donutLoot(new Loot(this.group + ' donut kit')))

    return { normal, donut }
  }

  cutscene = new Cutscene(this.group, 'Исследование ' + this.name)
}
