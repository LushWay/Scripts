import { Player } from '@minecraft/server'
import { is, Portal, stringify } from 'lib'
import { Achievement } from 'lib/achievements/achievement'
import { LoreForm } from 'lib/form/lore'
import { form } from 'lib/form/new'
import { selectPlayer } from 'lib/form/select-player'
import { t } from 'lib/text'
import { showStats } from './stats'

new Command('player')
  .setAliases('p', 'profile')
  .setPermissions('everybody')
  .setDescription(t`Общее меню игрока`)
  .executes(ctx => playerMenu(ctx.player.id).command(ctx))

const playerMenu = (targetId: string) =>
  form((f, player) => {
    const back = () => playerMenu(targetId).show(player)
    const moder = is(player.id, 'moderator')
    const db = Player.database.getImmutable(targetId)
    f.title(db.name ?? targetId)

    if (moder) {
      f.button(t`Другие игроки`, () => {
        selectPlayer(player, t`открыть его меню`, back).then(target => {
          playerMenu(target.id).show(player, back)
        })
      })
    }
    f.button(t`Статистика`, () => showStats(player, targetId, back))

    f.button(
      t`Задания`,
      form(f => f.body(stringify(db.quests))),
    )
    f.button(
      form(f => {
        const all = Achievement.list.length
        const completed = db.achivs?.s.filter(e => !!e.r).length ?? 0
        f.title(t`Достижения ${completed}/${all} (${((completed / all) * 100).toFixed(0)}%%)`)
        f.body(stringify(db.achivs))
      }),
    )
    f.button(
      form(f => {
        const portals = db.unlockedPortals
        f.title(t`Порталы ${portals?.length ?? 0}/${Portal.portals.size}`)
        f.body(portals?.join('\n') ?? '')
      }),
    )
    f.button(
      form(f => {
        const lore = LoreForm.getAll(targetId)
        f.title(t`Лор прочитан${t.size(lore.length)}`)
        f.body(lore.map(e => stringify(e)).join('\n'))
      }),
    )
  })
