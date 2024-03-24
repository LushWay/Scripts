import { Player, ScoreboardIdentityType, ScoreboardObjective, world } from '@minecraft/server'
import { ActionForm, BUTTON, Leaderboard, ModalForm, PLAYER_DB } from 'lib.js'
import { ScoreboardDB } from 'lib/Database/Scoreboard.js'

new Command({
  name: 'scores',
  description: 'Управляет счетом игроков (монеты, листья)',
  role: 'chefAdmin',
}).executes(ctx => {
  scoreManagerMenu(ctx.sender)
})

/**
 * @param {Player} player
 */
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
 *
 * @param {Player} player
 * @param {ScoreboardObjective} scoreboard
 */
function scoreboardMenu(player, scoreboard) {
  const form = new ActionForm(scoreboard.displayName)
  form.addButtonBack(() => scoreManagerMenu(player))

  form.addButton('§3Добавить', BUTTON['+'], () => {
    const players = world.getAllPlayers()
    let arr = []
    for (const [id, data] of Object.entries(PLAYER_DB)) {
      const player = players.find(e => e.id === id)
      const name = player?.name ?? data.name ?? id
      arr.push({ online: !!player, name, id })
    }

    arr = arr.sort((a, b) => (!a.online && b.online ? -1 : a.online ? 0 : 1))

    const form = new ActionForm('Выберите игрока')
    form.addButtonBack(() => scoreboardMenu(player, scoreboard))

    for (const { id, name } of arr) {
      form.addButton(name, () => {
        editPlayerScore(player, scoreboard, id, name, () => form.show(player))
      })
    }

    form.show(player)
  })

  const manager = new ScoreboardDB(scoreboard.id)

  for (const p of scoreboard.getParticipants()) {
    if (p.type === ScoreboardIdentityType.FakePlayer) {
      const name = Player.name(p.displayName)
      if (!name) continue
      form.addButton(`${name}§r §6${Leaderboard.parseCustomScore(scoreboard.id, manager.get(p.displayName))}`, () => {
        editPlayerScore(player, scoreboard, p.displayName, name)
      })
    }
  }

  form.show(player)
}

/**
 *
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
 * @param {string} targetName
 * @param {string} targetId
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
 *
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
      mode === 'set' ? manager.get(targetId).toString() : undefined
    )
    .show(player, (ctx, value) => {
      if (value) {
        if (isNaN(parseInt(value))) return ctx.error('Значение не является целым числом: §l§f' + value)

        manager[mode](targetId, parseInt(value))

        Player.byId(targetId)?.info(
          `§7Игрок §f${player.name}§r§7 ${mode === 'add' ? 'начислил вам' : 'установил значение счета'} §f${
            manager.scoreboard.displayName
          }§r§7 ${mode === 'set' ? 'на ' : ''}§f§l${value}`
        )
      } // If no value then do nothing

      back()
    })
}
