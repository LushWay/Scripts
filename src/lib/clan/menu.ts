import { Player } from '@minecraft/server'
import { ArrayForm } from 'lib/form/array'
import { ask, MessageForm } from 'lib/form/message'
import { ModalForm } from 'lib/form/modal'
import { form, FormContext, FormCreator } from 'lib/form/new'
import { selectPlayer } from 'lib/form/select-player'
import { BUTTON } from 'lib/form/utils'
import { getFullname } from 'lib/get-fullname'
import { i18n, textTable } from 'lib/i18n/text'
import { Mail } from 'lib/mail'
import { is } from 'lib/roles'
import { Clan, ClanMember, ClanRole } from './clan'
import { getClanButtonName, promptClanNameShortname, selectOrCreateClanMenu } from './create'

export function clanMenu(player: Player, back?: VoidFunction) {
  const clan = Clan.getPlayerClan(player.id)

  if (clan) {
    return [
      i18n.header`Ваш клан`.badge(clan.isOwner(player.id) ? clan.joinRequests.length : 0),
      () => inClanMenu({ clan }).show(player, back),
    ] as const
  } else {
    const invitedTo = Clan.getInvites(player.id)
    return [i18n.header`Кланы`.badge(invitedTo.length), () => selectOrCreateClanMenu(player, back)] as const
  }
}

interface ClanButtonContext {
  f: FormCreator
  clan: Clan
  formContext: FormContext<{ clan: Clan }>
  isOwner: boolean
  isHelper: boolean
}
const clanAdditionalButtons: ((ctx: ClanButtonContext) => void)[] = []
export function registerClanMenuButton(register: (ctx: ClanButtonContext) => void) {
  clanAdditionalButtons.push(register)
}

export const inClanMenu = form.params<{ clan: Clan }>((f, formContext) => {
  const {
    self,
    player,
    params: { clan },
  } = formContext
  f.title(i18n`Меню клана`)
  f.body(
    textTable([
      [i18n`Имя клана`, clan.name],
      [i18n`Дата создания`, clan.createdAt.toYYYYMMDD(player.lang)],
    ]).to(player.lang),
  )

  const isOwner = clan.isOwner(player.id)
  const isHelper = clan.isHelper(player.id)

  f.button(i18n`Участники`.size(clan.members.length), () => clanMembers(player, clan, self))

  if (isOwner || isHelper) {
    f.button(i18n`Заявки на вступление`.badge(clan.joinRequests.length), () => clanJoinRequests(player, clan, self))
    f.button(i18n`Приглашения`.badge(clan.invites.length), () => clanInvites(player, clan, self))
  }

  const context: ClanButtonContext = { clan, f, formContext, isHelper, isOwner }
  for (const button of clanAdditionalButtons) button(context)

  if (isOwner) {
    f.button(i18n`Изменить название или тэг клана`, () =>
      promptClanNameShortname(
        player,
        i18n`Изменить`,
        (name, shortname) => {
          clan.name = name
          clan.shortname = shortname
          self()
        },
        self,
        clan,
        clan.name,
        clan.shortname,
      ),
    )
    f.ask(i18n.error`Удалить клан`, i18n.error`Удалить клан без возможности восстановления?`, () => {
      Mail.sendMultiple(
        clan.membersIds,
        i18n.nocolor`Клан '${clan.name}' распущен`,
        i18n`К сожалению, клан был распущен. Хз че создателю не понравилось, найдите клан получше или создайте новый, печалиться смысла нет. Ну базы еще можете залутать, врятли создатель успел вас удалить из всех клановых баз.`,
      )
      clan.delete()
    })
  } else {
    f.ask(
      i18n.error`Покинуть клан`,
      i18n.error`Вы уверены, что хотите покинуть клан? Если вы передумаете, вам придется заново подавать заявку.`,
      () => {
        clan.remove(player.id)
        Mail.sendMultiple(clan.owners, i18n.nocolor`Игрок ${player.name} покинул ваш клан`, i18n`Хз почему`)
        player.success(i18n`Клан '${clan.name}' покинут успешно`)
      },
    )
  }

  f.button(i18n`Другие кланы\n§7Посмотреть`, () => {
    new ArrayForm(i18n`Кланы`, [...Clan.getAll()].reverse())
      .button((clan, _, __) => {
        return [
          getClanButtonName(clan),
          form((f, { self }) => {
            f.title(clan.name)
            f.body(i18n`Короткое имя: ${clan.shortname}`)

            for (const o of clan.members) {
              f.button(i18n`${getFullname(o.id)}\n${Clan.roleToString(o.role)}`, self)
            }
          }).show,
        ]
      })
      .show(player)
  })

  if (is(player.id, 'techAdmin')) {
    f.button(i18n`Админ: добавить игрока`, () =>
      selectPlayer(player, 'добавить в клан', self).then(e => {
        clan.addMember(e.id)
        player.success()
      }),
    )
  }
})

function clanJoinRequests(player: Player, clan: Clan, back?: VoidFunction) {
  const self = () => {
    clanJoinRequests(player, clan, back)
  }
  new ArrayForm(i18n`Заявки на вступление`, clan.joinRequests)
    .button(id => {
      const name = getFullname(id)
      return [
        name,
        () =>
          new MessageForm(i18n`Выбор`.to(player.lang), i18n`Принять игрока '${name}' в клан?`.to(player.lang))
            .setButton1(i18n`Принять!`.to(player.lang), () => {
              const message = i18n.nocolor`Вы приняты в клан ${clan.name}`
              Mail.send(id, message, i18n`Откройте меню клана с помощью .clan`)
              clan.addMember(id)
              self()
            })
            .setButton2(i18n`Нет, не заслужил`.to(player.lang), () => {
              Mail.send(id, i18n`Вы НЕ приняты в клан ${clan.name}`, i18n`Онет`)
              clan.rejectJoin(id)
              self()
            })
            .show(player),
      ]
    })
    .back(back)
    .show(player)
}
export function clanInvites(player: Player, clan: Clan, back?: VoidFunction) {
  new ArrayForm(i18n`Приглашения в клан '${clan.name}'`, clan.invites)
    .addCustomButtonBeforeArray(form =>
      form.button(i18n.accent`Новое приглашение`.to(player.lang), BUTTON['+'], () =>
        inviteToClan(player, clan, () => clanInvites(player, clan, back)),
      ),
    )
    .button(id => {
      const name = getFullname(id)
      return [name, () => void ask(player, i18n`отозвать приглашение?`, i18n`Да, отозать`, () => clan.undoInvite(id))]
    })
    .back(back)
    .show(player)
}

function inviteToClan(player: Player, clan: Clan, back?: VoidFunction) {
  selectPlayer(player, i18n`пригласить в клан`.to(player.lang), back).then(({ id, name }) => {
    if (clan.isMember(id)) return player.fail(i18n.error`Игрок ${name} уже состоит в вашем клане!`)
    const playerClan = Clan.getPlayerClan(id)
    if (playerClan) return player.fail(i18n.error`Игрок ${name} уже состоит в клане ${playerClan.name}!`)

    if (clan.sendInvite(id)) {
      Mail.send(
        id,
        i18n.nocolor`Приглашение в клан '${clan.name}'`,
        i18n`Вы были приглашены в клан! Чтобы вступить, используйте /clan или раздел кланов из основого меню`,
      )
      player.success(i18n`Игрок ${name} успешно приглашен в клан!`)
    } else {
      player.fail(i18n.error`Не удалось пригласить в клан`)
    }

    back?.()
  })
}
function clanMembers(player: Player, clan: Clan, back?: VoidFunction) {
  const self = () => clanMembers(player, clan, back)
  new ArrayForm(i18n`Участники клана`, clan.members)
    .back(back)
    .button(member => {
      const memberName = i18n`${getFullname(member.id)}\n${Clan.roleToString(member.role)}`
      return [memberName, () => clanMember({ clan, member, memberName }).show(player, self)]
    })
    .show(player)
}

const clanMember = form.params<{ clan: Clan; member: ClanMember; memberName: Text }>(
  (f, { player, self, params: { clan, member, memberName } }) => {
    f.title(i18n`Участник`)
    f.body(memberName)

    const isOwner = clan.isOwner(player.id)
    const isHelper = clan.isHelper(player.id)
    const isSelf = member.id === player.id

    if (isSelf) {
      if (isOwner) {
        const otherOwners = clan.owners.length > 1
        f.ask(
          (otherOwners ? i18n.error : i18n.disabled)`Отказаться от владения`,
          i18n`Вы уверены что хотите сбросить свою роль в клане до участника?`,
          () => {
            if (!otherOwners)
              return player.fail(
                i18n.error`Вы не можете отказаться от владения клана являясь единственным его владельцем`,
              )
            clan.setMemberRole(player.id, ClanRole.Member)
          },
        )

        f.button((otherOwners ? i18n.error : i18n.disabled)`Покинуть клан`, () => {
          if (!otherOwners)
            return player.fail(i18n.error`Вы единственный владелец. Кнопка удаления клана находится в меню клана снизу`)
          clan.remove(player.id)
        })
      }
    } else {
      if (isOwner) {
        const prevRole = Clan.roleToString(member.role)
        f.button(
          i18n`Сменить роль`,
          roleSelect({
            member,
            onSelect(role) {
              clan.setMemberRole(member.id, role)

              const changeString = i18n`${prevRole} -> ${Clan.roleToString(role)}`
              player.success(i18n`Роль участника клана ${memberName} сменена успешно: ${changeString}.`)
              Mail.send(
                member.id,
                i18n.nocolor`Роль в клане ${changeString}`,
                i18n`В клане '${clan.name}', сменена игроком ${getFullname(player)}`,
              )
              self()
            },
          }),
        )
      }
      if (member.role === ClanRole.Owner ? isOwner : isOwner || isHelper) {
        f.button(i18n.error`Выгнать`, () => {
          new ModalForm(i18n`Выгнать участника '${memberName}'`.to(player.lang))
            .addTextField(i18n`Причина`.to(player.lang), i18n`Причина обязательна`.to(player.lang))
            .show(player, (_, reason) => {
              if (reason) {
                clan.remove(member.id)
                Mail.send(
                  member.id,
                  i18n.nocolor`Вы выгнаны из клана '${clan.name}'`,
                  i18n`Вы были выгнаны из клана игроком '${player.name}'. Причина: ${reason}`,
                )
                player.success(i18n`Участник ${memberName} успешно выгнан из клана ${clan.name}`)
              } else player.fail(i18n`Причина не была указана, участник остался в клане`)
              self()
            })
        })
      }
    }
  },
)

const roleSelect = form.params<{ member: ClanMember; onSelect: (role: ClanRole) => void }>(
  (f, { params: { member, onSelect } }) => {
    f.title(i18n`Сменить роль ${Player.nameOrUnknown(member.id)}`)

    for (const role of Object.values(ClanRole)) {
      const color = member.role === role ? i18n.accent : i18n
      f.button(color`${Clan.roleToString(role)}`, onSelect.bind(undefined, role))
    }
  },
)
