import { Player } from '@minecraft/server'
import { ShowForm } from 'lib/form/new'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { Quest } from './quest'
import { QS } from './step'

type RenderedQuestButton = false | [text: string, texture: string | undefined, callback: VoidFunction | ShowForm]

type RenderOverride = (back: VoidFunction, step: QS) => RenderedQuestButton

export class QuestButton {
  constructor(private quest: Quest) {}

  renderOverride = new WeakPlayerMap<RenderOverride | undefined>()

  render(player: Player, back: VoidFunction): RenderedQuestButton {
    const step = this.quest.getPlayerStep(player)
    if (!step) return [this.quest.name, undefined, () => this.quest.enter(player)]

    const override = this.renderOverride.get(player)?.(back, step)
    if (override) return override

    return [step.text(), undefined, () => back]
  }
}
