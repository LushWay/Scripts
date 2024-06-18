import { Player, ScoreboardIdentityType, ScoreboardObjective, world } from '@minecraft/server'
import { ActionForm, BUTTON, Leaderboard, ModalForm } from 'lib'
import { ScoreboardDB } from 'lib/database/scoreboard'
import { ArrayForm } from 'lib/form/array'
import { selectPlayer } from 'lib/form/select-player'

new Command('scores')
  .setDescription('Управляет счетом игроков (монеты, листья)')
  .setPermissions('chefAdmin')
  .executes(ctx => {
    scoreManagerMenu(ctx.player)
  })

alias('leafs')
alias('money')

function alias(name = 'leafs') {
  new Command(name)
    .setDescription('Управляет счетом игроков (' + name + ')')
    .setPermissions('chefAdmin')
    .executes(ctx => {
      const obj = world.scoreboard.getObjective(name)
      if (obj) scoreboardMenu(ctx.player, obj)
    })
}

function scoreManagerMenu(player: Player) {
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

function scoreboardMenu(player: Player, objective: ScoreboardObjective) {
  const scoreboard = new ScoreboardDB(objective.id)

  new ArrayForm(objective.displayName + '§r§f $page/$max', objective.getParticipants())
    .filters({
      online: {
        name: 'Онлайн',
        description: 'Показывать только игроков онлайн',
        value: false,
      },
    })
    .sort((array, filters) => {
      if (!filters.online) return array

      const online = world.getAllPlayers().map(e => e.id)

      return array.filter(e => online.includes(e.displayName))
    })
    .button(p => {
      if (p.type !== ScoreboardIdentityType.FakePlayer) return false

      const name = Player.name(p.displayName)
      if (!name) return false

      return [
        `${name}§r §6${Leaderboard.parseCustomScore(objective.id, scoreboard.get(p.displayName))}`,
        () => editPlayerScore(player, objective, p.displayName, name),
      ]
    })
    .addCustomButtonBeforeArray(form => {
      form.addButton('§3Добавить', BUTTON['+'], () => addTargetToScoreboardMenu(player, objective))
      form.addButtonPrompt(
        '§cУдалить таблицу',
        '§cУдалить',
        () => world.scoreboard.removeObjective(objective.id),
        undefined,
        'textures/ui/trash_light',
      )
    })
    .back(() => scoreManagerMenu(player))
    .show(player)
}

function addTargetToScoreboardMenu(player: Player, objective: ScoreboardObjective) {
  const self = () => addTargetToScoreboardMenu(player, objective)

  selectPlayer(player, self).then(e => editPlayerScore(player, objective, e.id, e.name, self))
}

function editPlayerScore(
  player: Player,
  scoreboard: ScoreboardObjective,
  targetId: string,
  targetName: string,
  back = () => scoreboardMenu(player, scoreboard),
) {
  const manager = new ScoreboardDB(scoreboard.id)
  const self = () => editPlayerScore(player, scoreboard, targetId, targetName, back)
  const description = getScoreDescription(targetId, targetName, manager)
  new ActionForm(scoreboard.displayName, description)
    .addButtonBack(back)
    .addButton('Добавить к счету', () => addOrSetPlayerScore(player, targetId, targetName, manager, self, 'add'))
    .addButton('Установить значение', () => addOrSetPlayerScore(player, targetId, targetName, manager, self, 'set'))
    .show(player)
}

function getScoreDescription(targetId: string, targetName: string, manager: ScoreboardDB) {
  const converted = Leaderboard.parseCustomScore(manager.scoreboard.id, manager.get(targetId))
  const raw = manager.get(targetId)
  return `
§l§7Игрок: §r§f${targetName}§r
§l§7Значение:§r §f${raw}
${converted !== raw ? `§l§7Конвертированный счет: §r§f${converted}` : ''}`.trim()
}

function addOrSetPlayerScore(
  player: Player,
  targetId: string,
  targetName: string,
  manager: ScoreboardDB,
  back: VoidFunction,
  mode: 'add' | 'set' = 'add',
) {
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
