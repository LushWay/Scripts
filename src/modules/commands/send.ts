import { Player, ScoreName, world } from '@minecraft/server'
import { ActionForm, Mail, ModalForm } from 'lib'
import { createSelectPlayerMenu } from 'lib/form/selectPlayersMenu'
import { Rewards } from 'lib/rewards'

interface SendSettings {
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

function addScoresMenu(player: Player, settings: SendSettings) {
  new ModalForm('Добавить награду: счёт')
    .addDropdown(
      'Счёт',
      world.scoreboard.getObjectives().map(objective => objective.id as ScoreName),
    )
    .addTextField('Количество', '1000', '0')
    .show(player, (_ctx, score, amountStr) => {
      const amount = parseInt(amountStr)
      if (!isNaN(amount) && amount != 0) settings.rewards.scores(score, amount)
      sendMenu(player, settings.back, settings)
    })
}

function editEmailMenu(player: Player, settings: SendSettings) {
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
      settings.title = title
      settings.contents = lines.filter(Boolean).join('\n')
      sendMenu(player, settings.back, settings)
    })
}

export function sendMenu(player: Player, back?: VoidFunction, settings?: SendSettings) {
  if (!back) back = () => null
  if (!settings)
    settings = {
      recipients: createSelectPlayerMenu.defaultAllTargets(),
      rewards: new Rewards(),
      title: '',
      contents: '',
      back,
    }

  const form = new ActionForm('Отправить письмо')

  form.addButton(
    ...createSelectPlayerMenu(player, settings.recipients, () => sendMenu(player, back, settings), {
      title: 'Выбрать игроков',
    }),
  )

  form.addButton('Добавить счёт', () => addScoresMenu(player, settings))
  const rewards = settings.rewards.serialize()
  for (const reward of rewards) {
    // We want to use the index
    form.addButton(Rewards.rewardToString(reward), () => {
      settings.rewards.remove(reward)
      sendMenu(player, settings.back, settings)
    })
  }

  form.addButton('Изменить тему и текст', () => editEmailMenu(player, settings))

  form.addButton('Отправить', () =>
    Mail.sendMultiple(
      settings.recipients.length == 0 ? Object.keys(Player.database) : settings.recipients.map(p => p.id),
      settings.title,
      settings.contents,
      settings.rewards,
    ),
  )

  form.show(player)
}
