import { Player } from '@minecraft/server'
import { ActionForm } from 'lib/form/action'
import { ArrayForm } from 'lib/form/array'
import { MessageForm, ask } from 'lib/form/message'
import { ModalForm } from 'lib/form/modal'
import { selectPlayer } from 'lib/form/select-player'
import { BUTTON } from 'lib/form/utils'
import { t, textTable } from 'lib/i18n/text'
import { Mail } from 'lib/mail'
import { Rewards } from 'lib/utils/rewards'
import { Clan } from './clan'

export function clanMenu(player: Player, back?: VoidFunction) {
  const clan = Clan.getPlayerClan(player.id)

  if (clan) {
    return [
      t.header`Ваш клан${t.badge(clan.isOwner(player.id) ? clan.db.joinRequests.length : 0)}`,
      () => inClanMenu(player, clan, back),
    ] as const
  } else {
    const invitedTo = getInvites(player.id)
    return [t.header`Кланы${t.badge(invitedTo.length)}`, () => selectOrCreateClanMenu(player, back)] as const
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
  new ArrayForm(t`Выбор клана`, [...Clan.getAll()].reverse())
    .description(t`Выберите клан, чтобы отправить заявку или создайте свой клан!`)
    .addCustomButtonBeforeArray(form => {
      const invitedTo = getInvites(player.id)
      if (invitedTo.length)
        form.addButton(t.accent`Приглашения${t.badge(invitedTo.length)}`, () => {
          new ArrayForm(t`Приглашения`, invitedTo)
            .button(clan => [getClanName(clan), () => clan.add(player)])
            .back(() => selectOrCreateClanMenu(player, back))
            .show(player)
        })
      form.addButton(t`§3Создать свой клан`, () => createClan(player, () => selectOrCreateClanMenu(player, back)))
    })
    .button(clan => [
      getClanName(clan, clan.db.joinRequests.includes(player.id) ? '§7' : '§f'),
      () => clan.requestJoin(player),
    ])
    .back(back)
    .show(player)

  function getClanName(clan: Clan, color = '§f'): string {
    return t.nocolor`§7[${clan.db.shortname}] ${color}${clan.db.name}\nУчастники: ${clan.db.members.length}`
  }
}
function createClan(player: Player, back: VoidFunction, name?: string, shortname?: string) {
  new ModalForm(t`Создать клан`)
    .addTextField(t`Имя клана`, t`Ну, давай, придумай чета оригинальное`, name)
    .addTextField(t`Краткое имя клана`, t`Чтобы блатными в чате выглядеть`, shortname)
    .show(player, (_, name, shortname) => {
      function err(reason: string) {
        return new MessageForm(t`Ошибка`, reason)
          .setButton1(t`Щас исправлю`, () => createClan(player, back, name, shortname))
          .setButton2(t`Та ну я лучше вступлю куда-то`, back)
          .show(player)
      }

      if (name.includes('§')) return err(t`Имя не может содержать параграф`)
      if (shortname.includes('§')) return err(t`Короткое имя не может содержать параграф`)
      if (shortname.length > 5) return err(t`Короткое имя должно быть КОРОТКИМ, меньше 5 символов`)
      if (shortname.length < 2)
        return err(
          t.error`Короткое имя не может быть СЛИШКОМ коротким, минимум 2 символа. А то как понять че это за клан '${shortname}'`,
        )

      for (const clan of Clan.getAll()) {
        if (clan.db.name === name)
          return err(
            t.error`Клан с именем ${name} уже существует. Либо вступи туда, либо придумай что-то более оригильное`,
          )
        if (clan.db.shortname === shortname) return err(t.error`Короткое имя ${shortname} уже занято.`)
      }

      const clan = Clan.create(player, name, shortname)
      clanInvites(player, clan, () => clanMenu(player)[1]())
    })
}
function inClanMenu(player: Player, clan: Clan, back?: VoidFunction) {
  const form = new ActionForm(
    t`Меню клана`,
    textTable([
      [t`Имя клана`, clan.db.name],
      [t`Дата создания`, clan.createdAt.toYYYYMMDD(player.lang)],
    ]),
  ).addButtonBack(back)

  const selfback = () => inClanMenu(player, clan, back)
  const isOwner = clan.isOwner(player.id)

  form.addButton(t`Базы клана${t.size(0)}`, () => {
    player.fail(t`СКОРО`)
  })

  form.addButton(t`Участники (${clan.db.members.length})`, () => clanMembers(player, clan, selfback))

  if (isOwner) {
    form.addButton(t`Заявки на вступление${t.badge(clan.db.joinRequests.length)}`, () =>
      clanJoinRequests(player, clan, back),
    )

    form.addButton(t`Приглашения${t.badge(clan.db.invites.length)}`, () => clanInvites(player, clan, selfback))
    form.addButtonAsk(t.error`Удалить клан`, t.error`Удалить`, () => clan.delete())
  }
  form.show(player)
}
function clanJoinRequests(player: Player, clan: Clan, back?: VoidFunction) {
  const proceed = (id: string) => {
    clan.db.joinRequests = clan.db.joinRequests.filter(e => e !== id)
    clanJoinRequests(player, clan, back)
  }
  new ArrayForm(t`Заявки на вступление`, clan.db.joinRequests)
    .button(id => {
      const name = Player.nameOrUnknown(id)
      return [
        name,
        () =>
          new MessageForm(t`Выбор`, t`Принять игрока "${name}" в клан?`)
            .setButton1(t`Принять!`, () => {
              clan.add(id)
              proceed(id)
            })
            .setButton2(t`Нет, не заслужил`, () => {
              Mail.send(id, t`Вы НЕ приняты в клан ` + clan.db.name, t`Онет`, new Rewards())

              proceed(id)
            })
            .show(player),
      ]
    })
    .back(back)
    .show(player)
}
function clanInvites(player: Player, clan: Clan, back?: VoidFunction) {
  new ArrayForm(t`Приглашения в клан '${clan.db.name}'`, clan.db.invites)
    .addCustomButtonBeforeArray(form =>
      form.addButton(t`§3Новое приглашение`, BUTTON['+'], () =>
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
            t`отозвать приглашение?`,
            t`Да, отозать`,
            () => (clan.db.invites = clan.db.invites.filter(e => e !== id)),
          ),
      ]
    })
    .back(back)
    .show(player)
}
function inviteToClan(player: Player, clan: Clan, back?: VoidFunction) {
  selectPlayer(player, t`пригласить в клан`, back).then(({ id, name }) => {
    clan.invite(id)
    player.success(t`Игрок ${name} успешно приглашен в клан!`)
    back?.()
  })
}
function clanMembers(player: Player, clan: Clan, back?: VoidFunction) {
  new ArrayForm(t`Участники клана`, clan.db.members)
    .back(back)
    .button(id => {
      const name = Player.nameOrUnknown(id)
      return [name, () => clanMember(player, clan, id, name, () => clanMembers(player, clan, back))]
    })
    .show(player)
}
function clanMember(player: Player, clan: Clan, member: string, memberName: string, back?: VoidFunction) {
  const form = new ActionForm(t`Участник`).addButtonBack(back)
  const selfback = () => clanMember(player, clan, member, memberName, back)

  const isOwner = clan.isOwner(player.id)
  const isMemberOwner = clan.isOwner(member)

  if (isOwner) {
    form
      .addButton(isMemberOwner ? t`Понизить до участника` : t`Повысить до владельца`, () => {
        clan.setRole(member, isMemberOwner ? 'member' : 'owner')
        player.success(t`Роль участника клана ${memberName} сменена успешно.`)

        const action = isMemberOwner ? t`понижены` : t`повышены`
        Mail.send(member, t.nocolor`Вы были ${action}`, t`Вы были ${action} в клане '${clan.db.name}'`, new Rewards())
        selfback()
      })
      .addButton(t`§cВыгнать`, () => {
        new ModalForm(t`Выгнать участника '${memberName}'`)
          .addTextField(t`Причина`, t`Ничего не произойдет, если вы не укажете причину`)
          .show(player, (_, reason) => {
            if (reason) {
              clan.kickMember(member, player.name, reason)
              player.success(t`Участник ${memberName} успешно выгнан из клана ${clan.db.name}`)
            } else player.info(t`Причина не была указана, участник остался в клане`)
            selfback()
          })
      })
  }

  form.show(player)
}
