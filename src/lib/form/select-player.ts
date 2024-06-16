import { Player, world } from '@minecraft/server'
import { ArrayForm } from 'lib/form/array'
import { BUTTON } from 'lib/form/utils'
import { util } from 'lib/util'

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
          form.addButton(util.badge('§3Убрать выделение', selected.length), BUTTON['-'], () => {
            selected.splice(0, selected.length)
            callback()
          })
        } else {
          form.addButton(util.badge('§3Выбрать всех', players.length), BUTTON['+'], () => {
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
  let players = Object.entries(Player.database)
  if (!offline) {
    const online = world.getAllPlayers().map(e => e.id)
    players = players.filter(([id]) => online.includes(id))
  }

  return { players, getAllPlayersSelected: () => players.map(([id, { name = '' }]) => ({ id, name })) }
}

export function selectPlayer(
  player: Player,
  back?: VoidFunction,
): Promise<{ id: string; name: string; player?: Player }> {
  return new Promise(resolve => {
    const onlinePlayers = world.getAllPlayers()
    const players = []

    for (const [id, db] of Object.entries(Player.database)) {
      const player = onlinePlayers.find(e => e.id === id)

      const name = player?.name ?? db.name ?? id
      players.push({ online: !!player, name, id, player })
    }

    new ArrayForm('§3Выберите игрока', players)
      .filters({
        sort: {
          name: 'Сортировать по',
          value: [
            ['online', 'Онлайну'],
            ['date', 'Дате входа'],
          ],
        },
      })
      .sort((players, filters) => {
        if (filters.sort === 'online') return players.sort((a, b) => (!a.online && b.online ? -1 : a.online ? 0 : 1))
        return players
      })
      .button(({ id, name }) => {
        return [name, () => resolve({ id, name })]
      })
      .back(back)
      .show(player)
  })
}
