/* i18n-ignore */

import { Player, ScoreboardIdentityType, ScoreboardObjective, world } from '@minecraft/server'
import { ActionForm, BUTTON, Leaderboard, ModalForm, noBoolean } from 'lib'
import { defaultLang } from 'lib/assets/lang'
import { ScoreboardDB } from 'lib/database/scoreboard'
import { ArrayForm } from 'lib/form/array'
import { selectPlayer } from 'lib/form/select-player'
import { i18n, noI18n, textTable } from 'lib/i18n/text'

new Command('scores')
  .setDescription('Управляет счетом игроков (монеты, листья)')
  .setPermissions('chefAdmin')
  .executes(ctx => {
    scoreManagerMenu(ctx.player)
  })

alias('leafs')
alias('money')

function alias(name = 'leafs') {
  const cmd = new Command(name)
    .setDescription('Управляет счетом игроков (' + name + ')')
    .setPermissions('chefAdmin')
    .executes(ctx => {
      const obj = world.scoreboard.getObjective(name)
      if (obj) scoreboardMenu(ctx.player, obj)
    })

  cmd.int('add').executes((ctx, add) => {
    const obj = world.scoreboard.getObjective(name)
    if (obj) {
      const proxy = new ScoreboardDB(obj.id)
      const been = proxy.get(ctx.player)
      proxy.add(ctx.player, add)
      ctx.player.tell(`${ScoreboardDB.getName(name).to(ctx.player.lang)} ${been} -> ${proxy.get(ctx.player)}`)
    }
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
    form.button(ScoreboardDB.getName(scoreboard).to(player.lang), () => {
      scoreboardMenu(player, scoreboard)
    })
  }

  form.show(player)
}

function scoreboardMenu(player: Player, objective: ScoreboardObjective) {
  const scoreboard = new ScoreboardDB(objective.id)

  new ArrayForm(ScoreboardDB.getName(objective).to(player.lang) + '§r§f $page/$max', objective.getParticipants())
    .filters({
      online: {
        name: 'Онлайн',
        description: 'Показывать только игроков онлайн',
        value: false,
      },
    })
    .sort((array, filters) => {
      const online = world.getAllPlayers().map(e => e.id)
      if (!filters.online)
        return array.sort((a, b) => {
          const ao = online.includes(a.displayName)
          const bo = online.includes(b.displayName)
          if (ao && bo) return 0
          if (ao) return -1
          return 1
        })

      return array.filter(e => online.includes(e.displayName))
    })
    .button(p => {
      if (p.type !== ScoreboardIdentityType.FakePlayer) return false

      const name = Player.name(p.displayName)
      if (!name) return false

      return [
        i18n.nocolor.join`${name}§r §6${Leaderboard.formatScore(objective.id, scoreboard.get(p.displayName))}`,
        () => editPlayerScore(player, objective, p.displayName, name),
      ]
    })
    .addCustomButtonBeforeArray(form => {
      form.button('§3Добавить', BUTTON['+'], () => addTargetToScoreboardMenu(player, objective))
      form.ask(
        noI18n.error`Удалить таблицу`,
        noI18n.error`Удалить`,
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

  selectPlayer(player, 'добавить его в таблицу', self).then(e => editPlayerScore(player, objective, e.id, e.name, self))
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
    .addButtonBack(back, player.lang)
    .button('Добавить к счету', () => addOrSetPlayerScore(player, targetId, targetName, manager, self, 'add'))
    .button('Установить значение', () => addOrSetPlayerScore(player, targetId, targetName, manager, self, 'set'))
    .show(player)
}

function getScoreDescription(targetId: string, targetName: string, manager: ScoreboardDB) {
  const converted = Leaderboard.formatScore(manager.scoreboard.id, manager.get(targetId))
  const raw = manager.get(targetId)
  return textTable(
    (
      [
        ['Игрок', targetName],
        ['Значение', raw],
        converted !== raw ? (['Конвертированное', converted] as const) : false,
      ] as const
    ).filter(noBoolean),
  ).to(defaultLang)
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
  new ModalForm(ScoreboardDB.getName(manager.scoreboard).to(player.lang) + '§r§7 / §f' + action)
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
          noI18n`Игрок ${player.name} ${mode === 'add' ? 'начислил вам' : 'установил значение счета'} ${ScoreboardDB.getName(
            manager.scoreboard,
          ).to(defaultLang)}: ${value}`,
        )
      } // If no value then do nothing

      back()
    })
}
