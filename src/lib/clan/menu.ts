import { Player, world } from '@minecraft/server'
import { Cooldown } from 'lib/cooldown'
import { ArrayForm } from 'lib/form/array'
import { MessageForm, ask } from 'lib/form/message'
import { ModalForm } from 'lib/form/modal'
import { form } from 'lib/form/new'
import { selectPlayer } from 'lib/form/select-player'
import { BUTTON } from 'lib/form/utils'
import { getFullname } from 'lib/get-fullname'
import { i18n, textTable } from 'lib/i18n/text'
import { Mail } from 'lib/mail'
import { ms } from 'lib/utils/ms'
// import { registerResettableCooldown } from 'modules/commands/cooldownreset'
import { Clan } from './clan'

let cd: Cooldown

world.afterEvents.worldLoad.subscribe(() => {
  cd = new Cooldown(ms.from('day', 1), true, Cooldown.defaultDb.get('clan'))
  // registerResettableCooldown('Изменение/создание клана', cd)
})

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

function selectOrCreateClanMenu(player: Player, back?: VoidFunction) {
  new ArrayForm(i18n`Выбор клана`, [...Clan.getAll()].reverse())
    .description(i18n`Выберите клан, чтобы отправить заявку или создайте свой клан!`)
    .addCustomButtonBeforeArray(form => {
      const invitedTo = Clan.getInvites(player.id)
      if (invitedTo.length)
        form.button(i18n.accent`Приглашения`.badge(invitedTo.length).to(player.lang), () => {
          new ArrayForm(i18n`Приглашения`, invitedTo)
            .button(clan => [
              getClanName(clan),
              () => {
                clan.add(player.id)
                player.success(i18n`Вы приняли приглашение в клан '${clan.name}'`)
                inClanMenu({ clan }).show(player)
              },
            ])
            .back(() => selectOrCreateClanMenu(player, back))
            .show(player)
        })
      form.button(i18n.accent`Создать свой клан`.to(player.lang), () =>
        promptClanNameShortname(
          player,
          i18n`Создать клан`,
          (name, shortname) => {
            const clan = Clan.create(player, name, shortname)
            clanInvites(player, clan, () => clanMenu(player)[1]())
          },
          () => selectOrCreateClanMenu(player, back),
        ),
      )
    })
    .button(clan => [
      getClanName(clan, clan.isInvited(player.id) ? i18n.disabled : i18n),
      () => {
        if (!clan.requestJoin(player)) return
        player.fail(i18n.error`Вы уже отправили заявку в клан '${Clan.getPlayerClan(player.id)?.name ?? clan.name}'!`)

        Mail.sendMultiple(
          clan.owners,
          i18n.nocolor`Запрос на вступление в клан от '${player.name}'`,
          i18n`Игрок хочет вступить в ваш клан, вы можете принять или отклонить его через меню кланов`,
        )
        player.success(i18n`Заявка на вступление в клан '${clan.name}' отправлена!`)
      },
    ])
    .back(back)
    .show(player)

  function getClanName(clan: Clan, style: Text.Fn<Text, unknown> = i18n): Text {
    return style`[${clan.shortname}] ${clan.name}\nУчастники: ${clan.members.length}`
  }
}

function promptClanNameShortname(
  player: Player,
  title: Text,
  onDone: (name: string, shortname: string) => void,
  back: VoidFunction,
  clan?: Clan,
  defaultName?: string,
  defaultShortname?: string,
) {
  if (!cd.isExpired(player, false)) return
  new ModalForm(title.to(player.lang))
    .addTextField(
      i18n`Имя клана`.to(player.lang),
      i18n`Ну, давай, придумай чета оригинальное`.to(player.lang),
      defaultName,
    )
    .addTextField(
      i18n`Краткое имя клана`.to(player.lang),
      i18n`Чтобы блатными в чате выглядеть`.to(player.lang),
      defaultShortname,
    )
    .show(player, (_, name, shortname) => {
      name = name.trim()
      shortname = shortname.trim()

      function err(reason: Text) {
        return new MessageForm(i18n`Ошибка`.to(player.lang), reason.to(player.lang))
          .setButton1(i18n`Щас исправлю`.to(player.lang), () =>
            promptClanNameShortname(player, title, onDone, back, clan, name, shortname),
          )
          .setButton2(i18n`Та ну не надоело`.to(player.lang), back)
          .show(player)
      }

      if (name.includes('§')) return err(i18n`Имя '${name}' не может содержать параграф`)
      if (shortname.includes('§')) return err(i18n`Короткое имя '${shortname}' не может содержать параграф`)
      if (shortname.length > 5) return err(i18n`Короткое имя '${shortname}' должно быть КОРОТКИМ, меньше 5 символов`)
      if (shortname.length < 2)
        return err(
          i18n.error`Короткое имя '${shortname}' не может быть СЛИШКОМ коротким, минимум 2 символа. А то как понять че это за клан '${shortname}'`,
        )

      for (const c of Clan.getAll()) {
        if (c === clan) continue
        if (c.name === name) return err(i18n.error`Клан с именем '${name}' уже существует.`)
        if (c.shortname === shortname) return err(i18n.error`Короткое имя '${shortname}' уже занято.`)
      }

      if (!cd.isExpired(player)) return

      onDone(name, shortname)
    })
}

const inClanMenu = form.params<{ clan: Clan }>((f, { self, player, params: { clan } }) => {
  f.title(i18n`Меню клана`)
  f.body(
    textTable([
      [i18n`Имя клана`, clan.name],
      [i18n`Дата создания`, clan.createdAt.toYYYYMMDD(player.lang)],
    ]).to(player.lang),
  )

  const isOwner = clan.isOwner(player.id)

  f.button(i18n`Участники`.size(clan.members.length), () => clanMembers(player, clan, self))

  if (isOwner) {
    f.button(i18n`Заявки на вступление`.badge(clan.joinRequests.length), () => clanJoinRequests(player, clan, self))

    f.button(i18n`Приглашения`.badge(clan.invites.length), () => clanInvites(player, clan, self))
    f.button(i18n`Изменить имя/короткое имя`, () =>
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
    f.ask(i18n.error`Удалить клан`, i18n.error`Удалить`, () => {
      Mail.sendMultiple(
        clan.members,
        i18n.nocolor`Клан '${clan.name}' распущен`,
        i18n`К сожалению, клан был распущен. Хз че создателю не понравилось, найдите клан получше или создайте новый, печалиться смысла нет. Ну базы еще можете залутать, врятли создатель успел вас удалить из всех клановых баз.`,
      )
      clan.delete()
    })
  } else {
    f.ask(i18n.error`Покинуть клан`, i18n.error`Покинуть`, () => {
      clan.remove(player.id)
      Mail.sendMultiple(clan.owners, i18n.nocolor`Игрок ${player.name} покинул ваш клан`, i18n`Хз почему`)
      player.success(i18n`Клан '${clan.name}' покинут успешно`)
    })
  }

  f.button(i18n`Другие кланы\n§7Посмотреть`, () => {
    new ArrayForm('Кланы', [...Clan.getAll()].reverse())
      .button((clan, _, __) => {
        return [
          i18n.join`[${clan.shortname}] ${clan.name}`.size(clan.members.length).to(player.lang),
          form((f, { self }) => {
            f.title(clan.name)
            f.body(`Короткое имя: ${clan.shortname}`)

            for (const o of clan.members) {
              f.button(getFullname(o), self)
            }
          }).show,
        ]
      })
      .show(player)
  })
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
              Mail.send(id, message, i18n`Откройте меню клана с помощью /clan`)

              clan.add(id)
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
function clanInvites(player: Player, clan: Clan, back?: VoidFunction) {
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
    .button(id => {
      const memberName = getFullname(id)
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
        Mail.send(
          member,
          isMemberOwner ? i18n.nocolor`Вы были понижены до участника` : i18n.nocolor`Вы были повышены до владельца`,
          i18n`В клане '${clan.name}'`,
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
              clan.remove(member)
              Mail.send(
                member,
                i18n.nocolor`Вы выгнаны из клана '${clan.name}'`,
                i18n`Вы были выгнаны из клана игроком '${player.name}'. Причина: ${reason}`,
              )
              player.success(i18n`Участник ${memberName} успешно выгнан из клана ${clan.name}`)
            } else player.info(i18n`Причина не была указана, участник остался в клане`)
            self()
          })
      })
    }
  },
)
