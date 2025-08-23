import { form } from 'lib/form/new'
import { i18n } from 'lib/i18n/text'
import { Rewards } from 'lib/utils/rewards'
import { QS, QSBuilder } from '../step'

export class QSButton extends QS {
  protected activate(): QS.Cleanup {
    return
  }
}

export class QSButtonBuilder extends QSBuilder<QSButton> {
  create([text]: [text: QS.TextT, ...args: unknown[]] | []) {
    super.create(text ? [text] : [i18n`Заберите награду`])
  }

  reward(reward: Rewards) {
    this.activate(ctx => {
      ctx.subscribe(ctx.quest.button.override, ({ step, player }) => {
        if (player.id !== ctx.player.id) return false

        return [
          i18n`${step.text()}\n§aЗавершено! §6Заберите награду.`,
          undefined,
          form(f => {
            f.title(ctx.quest.name)
            f.body(reward.toString(player))
            f.button(i18n`Забрать награду`, () => {
              reward.give(ctx.player)
              ctx.next()
            })
          }),
        ]
      })
    })
    return this
  }
}
