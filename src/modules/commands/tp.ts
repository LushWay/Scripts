/** I18n-ignore */

import { Player, world } from '@minecraft/server'
import { ActionForm, Vec } from 'lib'
import { debounceMenu } from 'lib/form/utils'
import { getFullname } from 'lib/get-fullname'
import { ngettext } from 'lib/i18n/ngettext'
import { i18n, noI18n } from 'lib/i18n/text'
import { isNotPlaying } from 'lib/utils/game'
import { VectorInDimension } from 'lib/utils/point'
import { SafePlace } from 'modules/places/lib/safe-place'
import { Spawn } from 'modules/places/spawn'
import { StoneQuarry } from 'modules/places/stone-quarry/stone-quarry'
import { TechCity } from 'modules/places/tech-city/tech-city'
import { VillageOfExplorers } from 'modules/places/village-of-explorers/village-of-explorers'
import { VillageOfMiners } from 'modules/places/village-of-miners/village-of-miners'

new Command('tp')
  .setPermissions(__RELEASE__ ? 'techAdmin' : 'everybody')
  .setDescription(i18n`Открывает меню телепортации`)
  .executes(ctx => {
    if (ctx.player.database.role === 'member')
      return ctx.error(i18n`Команда доступна только тестерам, наблюдателям и администраторам.`)
    tpMenu(ctx.player)
  })

function tpMenu(player: Player) {
  const form = new ActionForm(
    i18n`Выберите локацию`.toString(player.lang),
    i18n`Также доступна из команды .tp\n\nПосле выхода из беты команда не будет доступна!`.toString(player.lang),
  )

  const players = world.getAllPlayers().map(
    player =>
      ({
        location: player.location,
        dimensionType: player.dimension.type,
      }) satisfies VectorInDimension,
  )

  const locations: Record<string, ReturnType<typeof location>> = {
    [VillageOfMiners.name.toString(player.lang)]: location(VillageOfMiners, '136 71 13457 140 -10', players),
    [VillageOfExplorers.name.toString(player.lang)]: location(VillageOfExplorers, '-35 75 13661 0 20', players),
    [StoneQuarry.name.toString(player.lang)]: location(StoneQuarry, '-1300 76 14800 -90 5', players),
    [TechCity.name.toString(player.lang)]: location(TechCity, '-1288 64 13626 90 -10', players),
  }

  if (Spawn.region)
    locations[noI18n`Спавн`] = location({ safeArea: Spawn.region, portalTeleportsTo: Spawn.location }, '', players)

  for (const [name, { location, players }] of Object.entries(locations)) {
    form.button(`${name} §7(${players} ${ngettext(players, [noI18n`игрок`, noI18n`игрока`, noI18n`игроков`])})`, () => {
      if (player.database.inv !== 'anarchy' && !isNotPlaying(player)) {
        return player.fail(
          i18n`Вы должны зайти на анархию или перейти в режим креатива, прежде чем телепортироваться! В противном случае вас просто вернет обратно на спавн.`,
        )
      }
      player.runCommand('tp ' + location)
    })
  }

  form.button(noI18n`Телепорт к игроку...`, () => tpToPlayer(player))

  return form.show(player)
}

function tpToPlayer(player: Player) {
  const form = new ActionForm(noI18n`Телепорт к игроку...`)

  form.addButtonBack(() => tpMenu(player))

  for (const p of world.getAllPlayers()) {
    form.button(getFullname(p), () => player.teleport(p.location))
  }

  form.show(player)
}

function location(
  place: Pick<SafePlace, 'portalTeleportsTo' | 'safeArea'>,
  fallback: string,
  players: VectorInDimension[],
) {
  const playersC = players.filter(player => place.safeArea?.area.isIn(player)).length

  if (place.portalTeleportsTo.valid) {
    return {
      players: playersC,
      location: `${Vec.string(place.portalTeleportsTo)} ${place.portalTeleportsTo.xRot} ${place.portalTeleportsTo.yRot}`,
    }
  }

  return { location: fallback, players: playersC }
}

export const tpMenuOnce = debounceMenu(tpMenu)
