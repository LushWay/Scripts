import { Player } from '@minecraft/server'
import { emoji } from 'lib/assets/emoji'
import { ModalForm } from 'lib/form/modal'
import { form } from 'lib/form/new'
import { selectPlayer } from 'lib/form/select-player'
import { noI18n } from 'lib/i18n/text'
import { ROLES } from 'lib/roles'

new Command('chat')
  .setDescription('Управление отображением игрока/ранга в чате/игре')
  .setPermissions('techAdmin')
  .executes(ctx => {
    const player = ctx.player
    chatForm(player)
  })

function chatForm(player: Player) {
  selectPlayer(player, 'настроить его отображение в чате/игре').then(e => {
    chatPlayerEditForm({ target: e }).show(player)
  })
}

const chatPlayerEditForm = form.params<{ target: { name: string; id: string } }>(
  (f, { player, self, params: { target } }) => {
    f.title(target.name)
    const db = Player.database.getImmutable(target.id)
    f.body(
      noI18n`Видимый ранг: ${db.displayRole}\nРоль: ${ROLES[db.role].to(player.lang)}\nЭмоджи: ${db.emoji}\nЦвет сообщения в чате: ${`${db.chatTextColor ?? ''}сообщение`}`,
    )
    f.button('Назад', () => {
      chatForm(player)
    })
    f.button(
      `Изменить эмоджи`,
      form(f => {
        f.button(`Очистить выбор: ${db.emoji ?? 'Не выбрано'}`, () => {
          const ddb = Player.database.get(target.id)
          delete ddb.emoji
          self()
        })
        for (const [name, e] of Object.entries(emoji.nickname)) {
          f.button(`${name} ${e}`, () => {
            const ddb = Player.database.get(target.id)
            ddb.emoji = e
            self()
          })
        }
      }),
    )
    f.button('Изменить', () => {
      new ModalForm('Изменить')
        .addTextField('Видимый ранг', 'очистит ее', db.displayRole)
        .addTextField('Цвет сообщения в чате', 'очистит его', db.chatTextColor)
        .show(player, (ctx, displayRole, textColor) => {
          const ddb = Player.database.get(target.id)
          if (!displayRole) delete ddb.displayRole
          else ddb.displayRole = displayRole
          if (!textColor) delete ddb.chatTextColor
          else ddb.chatTextColor = textColor
          self()
        })
    })
  },
)
