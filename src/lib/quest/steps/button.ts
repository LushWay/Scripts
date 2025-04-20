import { form } from 'lib/form/new'
import { Rewards } from 'lib/shop/rewards'
import { QS, QSBuilder } from '../step'

export class QSButton extends QS {
  protected activate(): QS.Cleanup {
    // uh idk?
  }
}

export class QSButtonBuilder extends QSBuilder<QSButton> {
  create([text]: [text: QS.Text, ...args: unknown[]] | []) {
    super.create(text ? [text] : ['Заберите награду'])
  }

  reward(reward: Rewards) {
    this.activate(ctx => {
      ctx.quest.button.renderOverride.set(ctx.player, (_, step) => {
        return [
          `${step.text()}\n§aЗавершено!`,
          undefined,
          form(f => {
            f.title('Задание').button('Забрать награду', () => reward.give(ctx.player))
          }),
        ]
      })
    })
  }
}
