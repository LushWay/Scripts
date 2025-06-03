import { Player } from '@minecraft/server'
import { ActionForm } from 'lib/form/action'
import { ArrayForm } from 'lib/form/array'
import { MessageForm, ask } from 'lib/form/message'
import { ModalForm } from 'lib/form/modal'
import { selectPlayer } from 'lib/form/select-player'
import { BUTTON } from 'lib/form/utils'
import { Mail } from 'lib/mail'
import { t, textTable } from 'lib/text'
import { Rewards } from 'lib/utils/rewards'
import { Clan } from './clan'

export function clanMenu(player: Player, back?: VoidFunction) {
  const clan = Clan.getPlayerClan(player.id)

  if (clan) {
    return [
      t.badge`§6Ваш клан ${clan.isOwner(player.id) ? clan.db.joinRequests.length : 0}`,
      () => inClanMenu(player, clan, back),
    ] as const
  } else {
    const invitedTo = getInvites(player.id)
    return [t.badge`§6Кланы ${invitedTo.length}`, () => selectOrCreateClanMenu(player, back)] as const
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
  new ArrayForm('Выбор клана', [...Clan.getAll()].reverse())
    .description('Выберите клан, чтобы отправить заявку или создайте свой клан!')
    .addCustomButtonBeforeArray(form => {
      const invitedTo = getInvites(player.id)
      if (invitedTo.length)
        form.addButton(t.badge`§3Приглашения ${invitedTo.length}`, () => {
          new ArrayForm('Приглашения', invitedTo)
            .button(clan => [getClanName(clan), () => clan.add(player)])
            .back(() => selectOrCreateClanMenu(player, back))
            .show(player)
        })
      form.addButton('§3Создать свой клан', () => createClan(player, () => selectOrCreateClanMenu(player, back)))
    })
    .button(clan => [
      getClanName(clan, clan.db.joinRequests.includes(player.id) ? '§7' : '§f'),
      () => clan.requestJoin(player),
    ])
    .back(back)
    .show(player)

  function getClanName(clan: Clan, color = '§f'): string {
    return `§7[${clan.db.shortname}] ${color}${clan.db.name}\nУчастники: ${clan.db.members.length}`
  }
}
function createClan(player: Player, back: VoidFunction, name?: string, shortname?: string) {
  new ModalForm('Создать клан')
    .addTextField('Имя клана', 'Ну, давай, придумай чета оригинальное', name)
    .addTextField('Краткое имя клана', 'Чтобы блатными в чате выглядеть', shortname)
    .show(player, (_, name, shortname) => {
      function err(reason: string) {
        return new MessageForm('Ошибка', reason)
          .setButton1('Щас исправлю', () => createClan(player, back, name, shortname))
          .setButton2('Та ну я лучше вступлю куда-то', back)
          .show(player)
      }

      if (name.includes('§')) return err('Имя не может содержать параграф')
      if (shortname.includes('§')) return err('Короткое имя не может содержать параграф')
      if (shortname.length > 5) return err('Короткое имя должно быть КОРОТКИМ, меньше 5 символов')
      if (shortname.length < 2)
        return err(
          `Короткое имя не может быть СЛИШКОМ коротким, минимум 2 символа. А то как понять че это за клан '${shortname}'`,
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
    'Меню клана',
    textTable({ 'Имя клана': clan.db.name, 'Дата создания': clan.createdAt.toYYYYMMDD() }),
  ).addButtonBack(back)

  const selfback = () => inClanMenu(player, clan, back)
  const isOwner = clan.isOwner(player.id)

  form.addButton(t.badge`§7Базы клана ${0}`, () => {
    player.fail('СКОРО')
  })

  form.addButton(t`Участники (${clan.db.members.length})`, () => clanMembers(player, clan, selfback))

  if (isOwner) {
    form.addButton(t.badge`Заявки на вступление ${clan.db.joinRequests.length}`, () =>
      clanJoinRequests(player, clan, back),
    )

    form.addButton(t.badge`Приглашения ${clan.db.invites.length}`, () => clanInvites(player, clan, selfback))
    form.addButtonAsk('§cУдалить клан', '§cУдалить', () => clan.delete())
  }
  form.show(player)
}
function clanJoinRequests(player: Player, clan: Clan, back?: VoidFunction) {
  const proceed = (id: string) => {
    clan.db.joinRequests = clan.db.joinRequests.filter(e => e !== id)
    clanJoinRequests(player, clan, back)
  }
  new ArrayForm('Заявки на вступление', clan.db.joinRequests)
    .button(id => {
      const name = Player.name(id) ?? 'ХТО ТЫ'
      return [
        name,
        () =>
          new MessageForm('Выбор', 'Принять игрока "' + name + '" в клан?')
            .setButton1('Принять!', () => {
              clan.add(id)
              proceed(id)
            })
            .setButton2('Нет, не заслужил', () => {
              Mail.send(id, 'Вы НЕ приняты в клан ' + clan.db.name, 'Онет', new Rewards())

              proceed(id)
            })
            .show(player),
      ]
    })
    .back(back)
    .show(player)
}
function clanInvites(player: Player, clan: Clan, back?: VoidFunction) {
  new ArrayForm(`Приглашения в клан '${clan.db.name}'`, clan.db.invites)
    .addCustomButtonBeforeArray(form =>
      form.addButton('§3Новое приглашение', BUTTON['+'], () =>
        inviteToClan(player, clan, () => clanInvites(player, clan, back)),
      ),
    )
    .button(id => {
      const name = Player.name(id) ?? 'Хто-то'
      return [
        name,
        () =>
          void ask(
            player,
            'отозвать приглашение?',
            'Да, отозать',
            () => (clan.db.invites = clan.db.invites.filter(e => e !== id)),
          ),
      ]
    })
    .back(back)
    .show(player)
}
function inviteToClan(player: Player, clan: Clan, back?: VoidFunction) {
  selectPlayer(player, 'пригласить в клан', back).then(({ id, name }) => {
    clan.invite(id)
    player.success(t`Игрок ${name} успешно приглашен в клан!`)
    back?.()
  })
}
function clanMembers(player: Player, clan: Clan, back?: VoidFunction) {
  new ArrayForm('Участники клана', clan.db.members)
    .back(back)
    .button(id => {
      const name = Player.name(id) ?? 'Неизвестный чел'
      return [name, () => clanMember(player, clan, id, name, () => clanMembers(player, clan, back))]
    })
    .show(player)
}
function clanMember(player: Player, clan: Clan, member: string, memberName: string, back?: VoidFunction) {
  const form = new ActionForm('Участник').addButtonBack(back)
  const selfback = () => clanMember(player, clan, member, memberName, back)

  const isOwner = clan.isOwner(player.id)
  const isMemberOwner = clan.isOwner(member)

  if (isOwner) {
    form
      .addButton(isMemberOwner ? 'Понизить до участника' : 'Повысить до владельца', () => {
        clan.setRole(member, isMemberOwner ? 'member' : 'owner')
        player.success(`Роль участника клана ${memberName} сменена успешно.`)

        const action = isMemberOwner ? 'понижены' : 'повышены'
        Mail.send(member, `Вы были ${action}`, `Вы были ${action} в клане '${clan.db.name}'`, new Rewards())
        selfback()
      })
      .addButton('§cВыгнать', () => {
        new ModalForm(`Выгнать участника '${memberName}'`)
          .addTextField('Причина', 'Ничего не произойдет, если вы не укажете причину')
          .show(player, (_, reason) => {
            if (reason) {
              clan.kickMember(member, player.name, reason)
              player.success(t`Участник ${memberName} успешно выгнан из клана ${clan.db.name}`)
            } else player.info('Причина не была указана, участник остался в клане')
            selfback()
          })
      })
  }

  form.show(player)
}
