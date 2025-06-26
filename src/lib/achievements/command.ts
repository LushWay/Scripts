import { Player } from '@minecraft/server'
import { ArrayForm } from 'lib/form/array'
import { form, NewFormCallback } from 'lib/form/new'
import { i18n } from 'lib/i18n/text'
import { is } from 'lib/roles'
import { Achievement } from './achievement'

Achievement.command = new Command('achiv')
  .setAliases('ach', 'achievement', 'achiev', 'achivs', 'achievs')
  .setDescription(i18n`Достижения`)
  .setPermissions('member')
  .executes(ctx => achievementsForm(ctx.player))

export function achievementsFormName(player: Player) {
  const notTaken = Achievement.list.filter(e => e.isDone(player) && !e.isRewardTaken(player))
  return i18n.warn`Достижения`.badge(notTaken.length)
}

export function achievementsForm(player: Player, back?: NewFormCallback) {
  const self = () => achievementsForm(player, back)

  new ArrayForm(i18n`Достижения`, Achievement.list)
    .back(back)
    .filters({
      sortMode: {
        name: i18n`Режим сортировки`,
        value: [
          ['achivDate', i18n`По дате получения`],
          ['alphabet', i18n`По алфавиту`],
        ],
      },
      hideUnknown: {
        name: i18n`Скрыть неизвестные`,
        value: false,
      },
      showOnlyUncollected: {
        name: i18n`Несобранные вверху`,
        value: true,
      },
    })
    .sort((array, filters) => {
      if (filters.hideUnknown) array = array.filter(e => e.isDone(player))

      if (filters.sortMode === 'alphabet') {
        array = array.slice().sort((a, b) => b.name.to(player.lang).localeCompare(a.name.to(player.lang)))
      } else array = array.slice().sort((a, b) => (b.getDatabase(player).d ?? 0) - (a.getDatabase(player).d ?? 0))

      const notTaken = array.filter(e => e.isDone(player) && !e.isRewardTaken(player))
      if (filters.showOnlyUncollected && notTaken.length) {
        return [...notTaken, ...array.filter(e => !notTaken.includes(e))]
      }

      return array
    })
    .button(item => {
      const isDone = item.isDone(player)
      const isRewardTaken = item.isRewardTaken(player)
      // TODO Fix colors
      return [
        isDone ? (isRewardTaken ? item.name : i18n`${item.name}§c*\n§aЗаберите награды!`) : i18n`?\nНеизвестно`,
        isDone ? p => achievementDetails(item).show(p, self) : self,
      ] as const
    })
    .show(player)
}

const achievementDetails = (achiv: Achievement<unknown>) =>
  form((f, { player, back }) => {
    f.title(achiv.name)
    f.body(i18n`Награда: ${achiv.reward.toString(player)}`)
    f.button(
      achiv.isRewardTaken(player) ? i18n`Награды забраны` : i18n.success`Забрать награды`,
      () => (achiv.takeRewards(player), achievementDetails(achiv).show(player, back)),
    )
    if (is(player.id, 'admin')) {
      f.button('admin: unachieve', () => achiv.undone(player))
    }
  })
