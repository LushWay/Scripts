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
  options: { offline?: boolean; one?: boolean; title: string },
) {
  const [players, getPlayers] = getPlayersForSelectMenu(options.offline)
  const callback = () =>
    new ArrayForm(options.title, '', players, {
      filters: {},
      button([id, { name = '' }]) {
        const isSelected = selected.find(e => e.id === id)
        return [
          `${isSelected ? '§a√ §f' : '§7'}${name}`,
          null,
          () => {
            if (!isSelected) selected.push({ id, name })
            else selected.splice(selected.indexOf(isSelected), 1)

            if (options.one) back()
            else callback()
          },
        ]
      },
      addCustomButtonBeforeArray(form) {
        form.addButton(
          util.badge(selected.length ? '§3Убрать выделение' : '§3Выбрать всех', selected.length || players.length),
          selected.length ? BUTTON['-'] : BUTTON['+'],
          () => {
            if (selected.length) {
              selected.splice(0, selected.length)
              callback()
            } else {
              selected.splice(0, selected.length, ...getPlayers())
              callback()
            }
          },
        )
      },
      back: back,
    }).show(player)

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
  export function defaultAllTargets() {
    return getPlayersForSelectMenu()[1]()
  }
}

function getPlayersForSelectMenu(offline = true) {
  let players = Object.entries(Player.database)
  if (!offline) {
    const online = world.getAllPlayers().map(e => e.id)
    players = players.filter(([id]) => online.includes(id))
  }

  return [players, () => players.map(([id, { name = '' }]) => ({ id, name }))] as const
}
