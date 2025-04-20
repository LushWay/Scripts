import { Player } from '@minecraft/server'
import { EventSignal } from 'lib/event-signal'
import { form, ShowForm } from 'lib/form/new'
import { manageQuestMenu } from './menu'
import { Quest } from './quest'
import { QS } from './step'

type RenderedQuestButton = false | [text: string, texture: string | undefined, callback: VoidFunction | ShowForm]

export class QuestButton {
  constructor(private quest: Quest) {}

  override = new EventSignal<{ step: QS; back: VoidFunction; player: Player }, RenderedQuestButton>()

  render(player: Player, back: VoidFunction): RenderedQuestButton {
    const step = this.quest.getPlayerStep(player)
    if (!step)
      return [
        this.quest.name,
        undefined,
        form(f => {
          f.title(this.quest.name)
          f.body(this.quest.description)
          f.button('Взять задание', () => this.quest.enter(player))
        }),
      ]

    for (const [createOverride] of EventSignal.sortSubscribers(this.override)) {
      const override = createOverride({ back, step, player })
      if (override) return override
    }

    return [`§l${this.quest.name}§r\n§6${step.text()}`, undefined, manageQuestMenu(this.quest)]
  }
}
