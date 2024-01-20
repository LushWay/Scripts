import { Player, ScoreboardIdentityType, ScoreboardObjective, world } from '@minecraft/server'
import { ScoreboardDB } from 'lib/Database/Scoreboard.js'
import { ActionForm, BUTTON, Leaderboard, ModalForm, PLAYER_DB } from 'smapi.js'

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

  for (const scoreboard of world.scoreboard.getObjectives()) {
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
 * @param {string} id
 * @param {string} name
 */
function editPlayerScore(player, scoreboard, id, name, back = () => scoreboardMenu(player, scoreboard)) {
  const manager = new ScoreboardDB(scoreboard.id)
  new ActionForm(
    'Редактировать счет',
    `Игрок: ${name}\nСчет: ${manager.get(id)}\nКонвертированный счет: ${Leaderboard.parseCustomScore(
      scoreboard.id,
      manager.get(id)
    )}`
  )
    .addButtonBack(back)
    .addButton('Добавить', () => {
      new ModalForm('Значение').addTextField('Значение', 'Ничего не произойдет').show(player, (ctx, value) => {
        if (value) {
          if (isNaN(parseInt(value))) return ctx.error('Значение не является целым числом: ' + value)

          manager.add(id, parseInt(value))
        }
        editPlayerScore(player, scoreboard, id, name)
      })
    })
    .addButton('Ввести число', () => {
      new ModalForm('Значение')
        .addTextField('Значение', 'Ничего не произойдет', manager.get(id) + '')
        .show(player, (ctx, value) => {
          if (value) {
            if (isNaN(parseInt(value))) return ctx.error('Значение не является целым числом: ' + value)

            manager.set(id, parseInt(value))
          }
          editPlayerScore(player, scoreboard, id, name, back)
        })
    })
    .show(player)
}
