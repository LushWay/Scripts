import { Player, ScoreboardIdentityType, ScoreboardObjective, world } from '@minecraft/server'
import { ActionForm, BUTTON, Leaderboard, ModalForm, PLAYER_DB } from 'lib.js'
import { ScoreboardDB } from 'lib/Database/Scoreboard.js'
import { ArrayForm } from 'lib/Form/ArrayForm.js'

new Command({
  name: 'scores',
  description: 'Управляет счетом игроков (монеты, листья)',
  role: 'chefAdmin',
}).executes(ctx => {
  scoreManagerMenu(ctx.sender)
})

alias('leafs')
alias('money')

function alias(name = 'leafs') {
  new Command({
    name,
    description: 'Управляет счетом игроков (' + name + ')',
    role: 'chefAdmin',
  }).executes(ctx => {
    const obj = world.scoreboard.getObjective(name)
    if (obj) scoreboardMenu(ctx.sender, obj)
  })
}

/** @param {Player} player */
function scoreManagerMenu(player) {
  const form = new ActionForm('Выберите счет')

  for (const scoreboard of world.scoreboard.getObjectives().sort((a, b) => {
    const a1 = a.displayName.includes('§')
    const b1 = b.displayName.includes('§')
    if (a1 && b1) return 0
    if (a1) return -1
    return 1
  })) {
    form.addButton(scoreboard.displayName, () => {
      scoreboardMenu(player, scoreboard)
    })
  }

  form.show(player)
}

/**
 * @param {Player} player
 * @param {ScoreboardObjective} scoreboard
 */
function scoreboardMenu(player, scoreboard) {
  const manager = new ScoreboardDB(scoreboard.id)

  new ArrayForm(scoreboard.displayName + ' $page/$max', '', scoreboard.getParticipants(), {
    filters: {
      online: {
        name: 'Онлайн',
        description: 'Показывать только игроков онлайн',
        value: false,
      },
    },
    sort(array, filters) {
      if (!filters.online) return array
      const online = world.getAllPlayers().map(e => e.id)
      return array.filter(e => online.includes(e.displayName))
    },
    button(p) {
      if (p.type === ScoreboardIdentityType.FakePlayer) {
        const name = Player.name(p.displayName)
        if (!name) return false
        return [
          `${name}§r §6${Leaderboard.parseCustomScore(scoreboard.id, manager.get(p.displayName))}`,
          null,
          () => editPlayerScore(player, scoreboard, p.displayName, name),
        ]
      } else return false
    },
    back: () => scoreManagerMenu(player),
    addCustomButtonBeforeArray(form) {
      form.addButton('§3Добавить', BUTTON['+'], () => addTargetToScoreboardMenu(player, scoreboard))
    },
  }).show(player)
}

/**
 * @param {Player} player
 * @param {ScoreboardObjective} scoreboard
 * @returns
 */
function addTargetToScoreboardMenu(player, scoreboard) {
  const onlinePlayers = world.getAllPlayers()
  const players = []
  for (const [id, data] of Object.entries(PLAYER_DB)) {
    const player = onlinePlayers.find(e => e.id === id)
    const name = player?.name ?? data.name ?? id
    players.push({ online: !!player, name, id })
  }

  new ArrayForm('§3Выберите игрока', '', players, {
    filters: {
      sort: {
        name: 'Сортировать по',
        value: [
          ['online', 'Онлайну'],
          ['date', 'Дате входа'],
        ],
      },
    },
    sort(players, filters) {
      if (filters.sort) {
        return players.sort((a, b) => (!a.online && b.online ? -1 : a.online ? 0 : 1))
      }

      return players
    },
    button({ id, name }) {
      return [
        name,
        null,
        () => {
          editPlayerScore(player, scoreboard, id, name, () => addTargetToScoreboardMenu(player, scoreboard))
        },
      ]
    },
    back: () => scoreboardMenu(player, scoreboard),
  }).show(player)
}

/**
 * @param {Player} player
 * @param {ScoreboardObjective} scoreboard
 * @param {string} targetId
 * @param {string} targetName
 */
function editPlayerScore(player, scoreboard, targetId, targetName, back = () => scoreboardMenu(player, scoreboard)) {
  const manager = new ScoreboardDB(scoreboard.id)
  const self = () => editPlayerScore(player, scoreboard, targetId, targetName, back)
  const description = getScoreDescription(targetId, targetName, manager)
  new ActionForm(scoreboard.displayName, description)
    .addButtonBack(back)
    .addButton('Добавить к счету', () => addOrSetPlayerScore(player, targetId, targetName, manager, self, 'add'))
    .addButton('Установить значение', () => addOrSetPlayerScore(player, targetId, targetName, manager, self, 'set'))
    .show(player)
}

/**
 * @param {string} targetId
 * @param {string} targetName
 * @param {ScoreboardDB} manager
 */
function getScoreDescription(targetId, targetName, manager) {
  const converted = Leaderboard.parseCustomScore(manager.scoreboard.id, manager.get(targetId))
  const raw = manager.get(targetId)
  return `
§l§7Игрок: §r§f${targetName}§r
§l§7Значение:§r §f${raw}
${converted !== raw ? `§l§7Конвертированный счет: §r§f${converted}` : ''}`.trim()
}

/**
 * @param {Player} player
 * @param {string} targetId
 * @param {string} targetName
 * @param {ScoreboardDB} manager
 * @param {VoidFunction} back
 * @param {'add' | 'set'} [mode]
 */
function addOrSetPlayerScore(player, targetId, targetName, manager, back, mode = 'add') {
  const action = mode === 'add' ? 'Добавить' : 'Установить'
  new ModalForm(manager.scoreboard.displayName + '§r§7 / §f' + action)
    .addTextField(
      `${getScoreDescription(targetId, targetName, manager)}\n§l§7${action}:§r`,
      'Ничего не произойдет',
      mode === 'set' ? manager.get(targetId).toString() : undefined,
    )
    .show(player, (ctx, value) => {
      if (value) {
        if (isNaN(parseInt(value))) return ctx.error('Значение не является целым числом: §l§f' + value)

        manager[mode](targetId, parseInt(value))

        Player.getById(targetId)?.info(
          `§7Игрок §f${player.name}§r§7 ${mode === 'add' ? 'начислил вам' : 'установил значение счета'} §f${
            manager.scoreboard.displayName
          }§r§7 ${mode === 'set' ? 'на ' : ''}§f§l${value}`,
        )
      } // If no value then do nothing

      back()
    })
}
