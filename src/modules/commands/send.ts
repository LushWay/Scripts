/* i18n-ignore */

import { Player, ScoreName, world } from '@minecraft/server'
import { ActionForm, Mail, ModalForm } from 'lib'
import { createSelectPlayerMenu } from 'lib/form/select-player'
import { i18n } from 'lib/i18n/text'
import { Rewards } from 'lib/utils/rewards'

interface SendState {
  recipients: { id: string; name: string }[]
  rewards: Rewards
  title: string
  contents: string
  back: VoidFunction
}

new Command('send')
  .setDescription('Отправляет письмо игроку/-ам')
  .setPermissions('admin')
  .executes(ctx => sendMenu(ctx.player))

function addScoresMenu(player: Player, state: SendState) {
  new ModalForm('Добавить награду: счёт')
    .addDropdown(
      'Счёт',
      world.scoreboard.getObjectives().map(objective => objective.id as ScoreName),
    )
    .addTextField('Количество', '1000', '0')
    .show(player, (_ctx, score, amountStr) => {
      const amount = parseInt(amountStr)
      if (!isNaN(amount) && amount != 0) state.rewards.score(score, amount)
      sendMenu(player, state.back, state)
    })
}

function editEmailMenu(player: Player, state: SendState) {
  new ModalForm('Изменить письмо')
    .addTextField('Заголовок', 'Название письма')
    .addTextField('Строка 1', 'Добрый день, уважаемый строитель!')
    .addTextField('Строка 2', '')
    .addTextField('Строка 3', 'Благодаря вашему усердному труду,')
    .addTextField('Строка 4', 'наш сервер становится только')
    .addTextField('Строка 5', 'лучше и лучше!')
    .addTextField('Строка 6', '')
    .addTextField('Строка 7', 'Именно поэтому мы решили')
    .addTextField('Строка 8', 'наградить вас листьями!')
    .addTextField('Строка 9', '')
    .addTextField('Строка 10', 'С уважением, Администрация')
    .show(player, (_ctx, title, ...lines) => {
      state.title = title
      state.contents = lines.filter(Boolean).join('\n')
      sendMenu(player, state.back, state)
    })
}

export function sendMenu(player: Player, back?: VoidFunction, state?: SendState) {
  back ??= () => null
  state ??= { recipients: createSelectPlayerMenu.defaultAll(), rewards: new Rewards(), title: '', contents: '', back }

  const form = new ActionForm('Отправить письмо')

  form.button(
    ...createSelectPlayerMenu(player, state.recipients, () => sendMenu(player, back, state), {
      title: 'Выбрать игроков',
    }),
  )

  form.button('Добавить счёт', () => addScoresMenu(player, state))
  const rewards = state.rewards.serialize()
  for (const reward of rewards) {
    // We want to use the index
    form.button(Rewards.rewardToString(reward, player), () => {
      state.rewards.remove(reward)
      sendMenu(player, state.back, state)
    })
  }

  form.button('Изменить тему и текст', () => editEmailMenu(player, state))

  form.button('Отправить', () =>
    Mail.sendMultiple(
      state.recipients.length == 0 ? [...Player.database.keys()] : state.recipients.map(p => p.id),
      i18n.join`${state.title}`,
      i18n.join`${state.contents}`,
      state.rewards,
    ),
  )

  form.show(player)
}
