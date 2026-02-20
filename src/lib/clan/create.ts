import { Player } from '@minecraft/server'
import { Cooldown } from 'lib/cooldown'
import { registerResettableCooldown } from 'lib/cooldownreset'
import { ArrayForm } from 'lib/form/array'
import { MessageForm } from 'lib/form/message'
import { ModalForm } from 'lib/form/modal'
import { i18n } from 'lib/i18n/text'
import { Mail } from 'lib/mail'
import { onLoad } from 'lib/utils/load-ref'
import { ms } from 'lib/utils/ms'
import { Clan } from './clan'
import { clanInvites, clanMenu, inClanMenu } from './menu'

export function selectOrCreateClanMenu(player: Player, back?: VoidFunction) {
  new ArrayForm(i18n`Выбор клана`, [...Clan.getAll()].reverse())
    .description(i18n`Выберите клан, чтобы отправить заявку или создайте свой клан!`)
    .addCustomButtonBeforeArray(form => {
      const invitedTo = Clan.getInvites(player.id)
      if (invitedTo.length)
        form.button(i18n.accent`Приглашения`.badge(invitedTo.length).to(player.lang), () => {
          new ArrayForm(i18n`Приглашения`, invitedTo)
            .button(clan => [
              getClanButtonName(clan),
              () => {
                clan.addMember(player.id)
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
      getClanButtonName(clan, clan.isInvited(player.id) ? i18n.disabled : i18n),
      () => {
        if (!clan.requestJoin(player)) {
          return player.fail(
            i18n.error`Вы уже отправили заявку в клан '${Clan.getPlayerClan(player.id)?.name ?? clan.name}'!`,
          )
        }

        player.success(i18n`Заявка на вступление в клан '${clan.name}' отправлена!`)
        Mail.sendMultiple(
          clan.owners,
          i18n.nocolor`Запрос на вступление в клан от '${player.name}'`,
          i18n`Игрок хочет вступить в ваш клан, вы можете принять или отклонить его через меню кланов`,
        )
      },
    ])
    .back(back)
    .show(player)
}
export function getClanButtonName(clan: Clan, style: Text.Fn<Text, unknown> = i18n): Text {
  return style`[${clan.shortname}] ${clan.name}\nУчастники: ${clan.members.length} ${clan.owners.map(id => Player.nameOrUnknown(id)).join(', ')}`
}

const cooldown = onLoad(() => {
  const cd = new Cooldown(ms.from('day', 1), true, Cooldown.defaultDb.get('clan'))
  registerResettableCooldown('Создание/изменение названия клана', cd)
  return cd
})

export function promptClanNameShortname(
  player: Player,
  title: Text,
  onDone: (name: string, shortname: string) => void,
  back: VoidFunction,
  clan?: Clan,
  defaultName?: string,
  defaultShortname?: string,
) {
  if (!cooldown.value.isExpired(player, false)) return
  new ModalForm(title.to(player.lang))
    .addTextField(
      i18n`Название клана`.to(player.lang),
      i18n`Ну, давай, придумай чета оригинальное`.to(player.lang),
      defaultName,
    )
    .addTextField(
      i18n`Тэг клана`.to(player.lang),
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

      if (!cooldown.value.isExpired(player)) return

      onDone(name, shortname)
    })
}
