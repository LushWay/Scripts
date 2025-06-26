import { Player, world } from '@minecraft/server'
import { ArrayForm } from 'lib/form/array'
import { BUTTON } from 'lib/form/utils'
import { i18n } from 'lib/i18n/text'
import { NewFormCallback } from './new'

/**
 * Creates select player menu
 *
 *       function someMenu(player: Player, targets = createSelectPlayerMenu.defaultAllTargets()) {
 *         new ActionForm('Форма')
 *           .addButton(
 *             ...createSelectPlayerMenu(player, targets, () => someMenu(player, targets), {
 *               title: 'Выбрать игроков',
 *             }),
 *           )
 *           .show(player)
 *       }
 *
 * @param player
 * @param selected
 * @param back
 * @param options
 * @returns
 */
export function createSelectPlayerMenu(
  player: Player,
  selected: { id: string; name: string }[] = [],
  back: VoidFunction,
  options: { offline?: boolean; title: string },
) {
  const { players, getAllPlayersSelected } = getPlayersForSelectMenu(options.offline)

  const callback = () =>
    new ArrayForm(options.title, players)
      .button(([id, { name = '' }]) => {
        const isSelected = selected.find(e => e.id === id)
        return [
          `${isSelected ? '§a√ §f' : '§7'}${name}`,
          () => {
            if (!isSelected) selected.push({ id, name })
            else selected.splice(selected.indexOf(isSelected), 1)
            callback()
          },
        ]
      })
      .addCustomButtonBeforeArray(form => {
        if (selected.length) {
          form.button(i18n.accent`Убрать выделение`.size(selected.length).to(player.lang), BUTTON['-'], () => {
            selected.splice(0, selected.length)
            callback()
          })
        } else {
          form.button(i18n.accent`Выбрать всех`.size(players.length).to(player.lang), BUTTON['+'], () => {
            selected.splice(0, selected.length, ...getAllPlayersSelected())
            callback()
          })
        }
      })
      .back(back)
      .show(player)

  return [
    `${options.title}§r §f§l${selected.length}§7/${players.length}\n§r§7${selected
      .slice(0, 10)
      .map(e => e.name)
      .join(', §r§7')}`,
    BUTTON['+'],
    callback,
  ] as const
}

export namespace createSelectPlayerMenu {
  export function defaultAll() {
    return getPlayersForSelectMenu().getAllPlayersSelected()
  }

  export function defaultNone() {
    return [] as { id: string; name: string }[]
  }
}

function getPlayersForSelectMenu(offline = true) {
  let players = Player.database.entries()
  if (!offline) {
    const online = world.getAllPlayers().map(e => e.id)
    players = players.filter(([id]) => online.includes(id))
  }

  return { players, getAllPlayersSelected: () => players.map(([id, { name = '' }]) => ({ id, name })) }
}

export function selectPlayer(
  player: Player,
  reason: string,
  back?: NewFormCallback,
): Promise<{ id: string; name: string; player?: Player }> {
  return new Promise(resolve => {
    const onlinePlayers = world.getAllPlayers()
    const players = []

    for (const [id, db] of Player.database.entries()) {
      const player = onlinePlayers.find(e => e.id === id)

      const name = player?.name ?? db.name ?? id
      players.push({ online: !!player, name, id, player })
    }

    new ArrayForm(i18n`§3Выберите игрока чтобы ${reason}`, players)
      .filters({
        sort: {
          name: i18n`Сортировать по`,
          value: [
            ['online', i18n`Онлайну`],
            ['date', i18n`Дате входа`],
          ],
        },
      })
      .sort((players, filters) => {
        if (filters.sort === 'online') return players.sort((a, b) => (!a.online && b.online ? 1 : a.online ? 0 : -1))
        return players
      })
      .button(({ id, name, online }) => {
        return [(online ? '§f' : '§8') + name, () => resolve({ id, name })]
      })
      .back(back)
      .show(player)
  })
}
