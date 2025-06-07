import { Npc } from 'lib/rpg/npc'
import { Group } from 'lib/rpg/place'

export class GuideNpc extends Npc {
  constructor(
    group: Group,
    name: string,
    point = group.place('guide').name(name),
    onInteract: Npc.OnInteract = () => true,
  ) {
    super(point, onInteract)
  }
}
