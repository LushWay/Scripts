import { Player } from '@minecraft/server'
import { ArrayForm } from 'lib/form/array'
import { form, NewFormCallback } from 'lib/form/new'
import { t } from 'lib/i18n/text'
import { is } from 'lib/roles'
import { Achievement } from './achievement'

Achievement.command = new Command('achiv')
  .setAliases('ach', 'achievement', 'achiev', 'achivs', 'achievs')
  .setDescription(t`Достижения`)
  .setPermissions('member')
  .executes(ctx => achievementsForm(ctx.player))

export function achievementsFormName(player: Player) {
  const notTaken = Achievement.list.filter(e => e.isDone(player) && !e.isRewardTaken(player))
  return t.warn`Достижения${t.badge(notTaken.length)}`
}

export function achievementsForm(player: Player, back?: NewFormCallback) {
  const self = () => achievementsForm(player, back)

  new ArrayForm(t`Достижения`, Achievement.list)
    .back(back)
    .filters({
      sortMode: {
        name: t`Режим сортировки`,
        value: [
          ['achivDate', t`По дате получения`],
          ['alphabet', t`По алфавиту`],
        ],
      },
      hideUnknown: {
        name: t`Скрыть неизвестные`,
        value: false,
      },
      showOnlyUncollected: {
        name: t`Несобранные вверху`,
        value: true,
      },
    })
    .sort((array, filters) => {
      if (filters.hideUnknown) array = array.filter(e => e.isDone(player))

      if (filters.sortMode === 'alphabet') {
        array = array.slice().sort((a, b) => b.name.localeCompare(a.name))
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
      return [
        isDone ? (isRewardTaken ? item.name : t`${item.name}§c*\n§aЗаберите награды!`) : t`?\nНеизвестно`,
        isDone ? p => achievementDetails(item).show(p, self) : self,
      ] as const
    })
    .show(player)
}

const achievementDetails = (achiv: Achievement<unknown>) =>
  form((f, player, back) => {
    f.title(achiv.name)
    f.body(t.raw`Награда: ${achiv.reward.toString()}`)
    f.button(
      achiv.isRewardTaken(player) ? t`Награды забраны` : t`§aЗабрать награды`,
      () => (achiv.takeRewards(player), achievementDetails(achiv).show(player, back)),
    )
    if (is(player.id, 'admin')) {
      f.button('admin: unachieve', () => achiv.undone(player))
    }
  })
