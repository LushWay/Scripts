import { Player } from '@minecraft/server'
import { Quest } from 'lib/quest'
import { FormCreator, NewFormCallback } from './new'

export class QuestForm {
  constructor(
    protected form: FormCreator,
    protected player: Player,
    protected back: NewFormCallback,
  ) {}

  quest(quest: Quest, textOverride?: Text, descriptionOverride?: Text) {
    const rendered = quest.button.render(this.player, () => this.back, descriptionOverride)
    if (!rendered) return

    this.form.button(textOverride && rendered[0] === quest.name ? textOverride : rendered[0], rendered[1], rendered[2])
  }
}
