import { Player } from '@minecraft/server'
import { ArrayForm } from 'lib/form/array'
import { MessageForm, ask } from 'lib/form/message'
import { ModalForm } from 'lib/form/modal'
import { form } from 'lib/form/new'
import { selectPlayer } from 'lib/form/select-player'
import { BUTTON } from 'lib/form/utils'
import { i18n, textTable } from 'lib/i18n/text'
import { Mail } from 'lib/mail'
import { Rewards } from 'lib/utils/rewards'
import { Clan } from './clan'

export function clanMenu(player: Player, back?: VoidFunction) {
  const clan = Clan.getPlayerClan(player.id)

  if (clan) {
    return [
      i18n.header`Ваш клан`.badge(clan.isOwner(player.id) ? clan.db.joinRequests.length : 0),
      () => inClanMenu({ clan }).show(player, back),
    ] as const
  } else {
    const invitedTo = getInvites(player.id)
    return [i18n.header`Кланы`.badge(invitedTo.length), () => selectOrCreateClanMenu(player, back)] as const
  }
}

function getInvites(playerId: string) {
  const invitedTo: Clan[] = []
  for (const clan of Clan.getAll()) {
    if (clan.db.invites.includes(playerId)) {
      invitedTo.push(clan)
    }
  }
  return invitedTo
}

function selectOrCreateClanMenu(player: Player, back?: VoidFunction) {
  new ArrayForm(i18n`Выбор клана`, [...Clan.getAll()].reverse())
    .description(i18n`Выберите клан, чтобы отправить заявку или создайте свой клан!`)
    .addCustomButtonBeforeArray(form => {
      const invitedTo = getInvites(player.id)
      if (invitedTo.length)
        form.button(i18n.accent`Приглашения`.badge(invitedTo.length).to(player.lang), () => {
          new ArrayForm(i18n`Приглашения`, invitedTo)
            .button(clan => [getClanName(clan), () => clan.add(player)])
            .back(() => selectOrCreateClanMenu(player, back))
            .show(player)
        })
      form.button(i18n.accent`Создать свой клан`.to(player.lang), () =>
        createClan(player, () => selectOrCreateClanMenu(player, back)),
      )
    })
    .button(clan => [
      getClanName(clan, clan.db.joinRequests.includes(player.id) ? '§7' : '§f'),
      () => clan.requestJoin(player),
    ])
    .back(back)
    .show(player)

  function getClanName(clan: Clan, color = '§f'): Text {
    return i18n.nocolor`§7[${clan.db.shortname}] ${color}${clan.db.name}\nУчастники: ${clan.db.members.length}`
  }
}
function createClan(player: Player, back: VoidFunction, name?: string, shortname?: string) {
  new ModalForm(i18n`Создать клан`.to(player.lang))
    .addTextField(i18n`Имя клана`.to(player.lang), i18n`Ну, давай, придумай чета оригинальное`.to(player.lang), name)
    .addTextField(
      i18n`Краткое имя клана`.to(player.lang),
      i18n`Чтобы блатными в чате выглядеть`.to(player.lang),
      shortname,
    )
    .show(player, (_, name, shortname) => {
      function err(reason: Text) {
        return new MessageForm(i18n`Ошибка`.to(player.lang), reason.to(player.lang))
          .setButton1(i18n`Щас исправлю`.to(player.lang), () => createClan(player, back, name, shortname))
          .setButton2(i18n`Та ну я лучше вступлю куда-то`.to(player.lang), back)
          .show(player)
      }

      if (name.includes('§')) return err(i18n`Имя не может содержать параграф`)
      if (shortname.includes('§')) return err(i18n`Короткое имя не может содержать параграф`)
      if (shortname.length > 5) return err(i18n`Короткое имя должно быть КОРОТКИМ, меньше 5 символов`)
      if (shortname.length < 2)
        return err(
          i18n.error`Короткое имя не может быть СЛИШКОМ коротким, минимум 2 символа. А то как понять че это за клан '${shortname}'`,
        )

      for (const clan of Clan.getAll()) {
        if (clan.db.name === name)
          return err(
            i18n.error`Клан с именем ${name} уже существует. Либо вступи туда, либо придумай что-то более оригильное`,
          )
        if (clan.db.shortname === shortname) return err(i18n.error`Короткое имя ${shortname} уже занято.`)
      }

      const clan = Clan.create(player, name, shortname)
      clanInvites(player, clan, () => clanMenu(player)[1]())
    })
}
const inClanMenu = form.params<{ clan: Clan }>((f, { self, player, params: { clan } }) => {
  f.title(i18n`Меню клана`)
  f.body(
    textTable([
      [i18n`Имя клана`, clan.db.name],
      [i18n`Дата создания`, clan.createdAt.toYYYYMMDD(player.lang)],
    ]).to(player.lang),
  )

  const isOwner = clan.isOwner(player.id)

  f.button(i18n`Базы клана`.size(0), () => {
    player.fail(i18n`СКОРО`)
  })

  f.button(i18n`Участники`.size(clan.db.members.length), () => clanMembers(player, clan, self))

  if (isOwner) {
    f.button(i18n`Заявки на вступление`.badge(clan.db.joinRequests.length), () => clanJoinRequests(player, clan, self))

    f.button(i18n`Приглашения`.badge(clan.db.invites.length), () => clanInvites(player, clan, self))
    f.ask(i18n.error`Удалить клан`, i18n.error`Удалить`, () => clan.delete())
  }
})
function clanJoinRequests(player: Player, clan: Clan, back?: VoidFunction) {
  const proceed = (id: string) => {
    clan.db.joinRequests = clan.db.joinRequests.filter(e => e !== id)
    clanJoinRequests(player, clan, back)
  }
  new ArrayForm(i18n`Заявки на вступление`, clan.db.joinRequests)
    .button(id => {
      const name = Player.nameOrUnknown(id)
      return [
        name,
        () =>
          new MessageForm(i18n`Выбор`.to(player.lang), i18n`Принять игрока "${name}" в клан?`.to(player.lang))
            .setButton1(i18n`Принять!`.to(player.lang), () => {
              clan.add(id)
              proceed(id)
            })
            .setButton2(i18n`Нет, не заслужил`.to(player.lang), () => {
              Mail.send(id, i18n`Вы НЕ приняты в клан ${clan.db.name}`, i18n`Онет`, new Rewards())

              proceed(id)
            })
            .show(player),
      ]
    })
    .back(back)
    .show(player)
}
function clanInvites(player: Player, clan: Clan, back?: VoidFunction) {
  new ArrayForm(i18n`Приглашения в клан '${clan.db.name}'`, clan.db.invites)
    .addCustomButtonBeforeArray(form =>
      form.button(i18n.accent`Новое приглашение`.to(player.lang), BUTTON['+'], () =>
        inviteToClan(player, clan, () => clanInvites(player, clan, back)),
      ),
    )
    .button(id => {
      const name = Player.nameOrUnknown(id)
      return [
        name,
        () =>
          void ask(
            player,
            i18n`отозвать приглашение?`,
            i18n`Да, отозать`,
            () => (clan.db.invites = clan.db.invites.filter(e => e !== id)),
          ),
      ]
    })
    .back(back)
    .show(player)
}
function inviteToClan(player: Player, clan: Clan, back?: VoidFunction) {
  selectPlayer(player, i18n`пригласить в клан`.to(player.lang), back).then(({ id, name }) => {
    clan.invite(id)
    player.success(i18n`Игрок ${name} успешно приглашен в клан!`)
    back?.()
  })
}
function clanMembers(player: Player, clan: Clan, back?: VoidFunction) {
  const self = () => clanMembers(player, clan, back)
  new ArrayForm(i18n`Участники клана`, clan.db.members)
    .back(back)
    .button(id => {
      const memberName = Player.nameOrUnknown(id)
      return [memberName, () => clanMember({ clan, member: id, memberName }).show(player, self)]
    })
    .show(player)
}
const clanMember = form.params<{ clan: Clan; member: string; memberName: string }>(
  (f, { player, self, params: { clan, member, memberName } }) => {
    f.title(i18n`Участник`)

    const isOwner = clan.isOwner(player.id)
    const isMemberOwner = clan.isOwner(member)

    if (isOwner) {
      f.button(isMemberOwner ? i18n`Понизить до участника` : i18n`Повысить до владельца`, () => {
        clan.setRole(member, isMemberOwner ? 'member' : 'owner')
        player.success(i18n`Роль участника клана ${memberName} сменена успешно.`)

        const action = isMemberOwner ? i18n`понижены` : i18n`повышены`
        Mail.send(
          member,
          i18n.nocolor`Вы были ${action}`,
          i18n`Вы были ${action} в клане '${clan.db.name}'`,
          new Rewards(),
        )
        self()
      }).button(i18n.error`Выгнать`, () => {
        new ModalForm(i18n`Выгнать участника '${memberName}'`.to(player.lang))
          .addTextField(
            i18n`Причина`.to(player.lang),
            i18n`Ничего не произойдет, если вы не укажете причину`.to(player.lang),
          )
          .show(player, (_, reason) => {
            if (reason) {
              clan.kickMember(member, player.name, reason)
              player.success(i18n`Участник ${memberName} успешно выгнан из клана ${clan.db.name}`)
            } else player.info(i18n`Причина не была указана, участник остался в клане`)
            self()
          })
      })
    }
  },
)
