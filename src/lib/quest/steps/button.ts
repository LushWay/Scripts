import { form } from 'lib/form/new'
import { Rewards } from 'lib/utils/rewards'
import { QS, QSBuilder } from '../step'

export class QSButton extends QS {
  protected activate(): QS.Cleanup {
    return
  }
}

export class QSButtonBuilder extends QSBuilder<QSButton> {
  create([text]: [text: QS.Text, ...args: unknown[]] | []) {
    super.create(text ? [text] : ['Заберите награду'])
  }

  reward(reward: Rewards) {
    this.activate(ctx => {
      ctx.subscribe(ctx.quest.button.override, ({ step, player }) => {
        if (player.id !== ctx.player.id) return false

        return [
          `${step.text()}\n§aЗавершено! §6Заберите награду.`,
          undefined,
          form(f => {
            f.title(ctx.quest.name)
            f.body(reward.toString())
            f.button('Забрать награду', () => {
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
