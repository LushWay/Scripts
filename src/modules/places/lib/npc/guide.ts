import { Quest } from 'lib/quest'
import { NpcForm, NpcFormCreator } from 'lib/rpg/npc-form'
import { Group } from 'lib/rpg/place'

export class GuideNpc extends NpcForm {
  constructor(
    group: Group,
    name: SharedText,
    create: NpcFormCreator,
    readonly point = group.place('guide').name(name),
  ) {
    super(point, (f, ctx) => {
      f.title(name)
      create(f, ctx)

      for (const quest of Quest.quests.values()) {
        if (quest.guideIgnore) continue
        if (quest.place.group === group) f.quest(quest)
      }
    })
  }
}
