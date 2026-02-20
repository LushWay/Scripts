import { Quest } from 'lib/quest'
import { FormContext, NewFormCallback, NewFormCreator } from './new'
import { Player } from '@minecraft/server'

export class QuestForm {
  constructor(
    protected form: NewFormCreator,
    protected player: Player,
    protected back: NewFormCallback,
  ) {}

  quest(quest: Quest, textOverride?: Text, descriptionOverride?: Text) {
    const rendered = quest.button.render(this.player, () => this.back, descriptionOverride)
    if (!rendered) return

    this.form.button(textOverride && rendered[0] === quest.name ? textOverride : rendered[0], rendered[1], rendered[2])
  }
}
