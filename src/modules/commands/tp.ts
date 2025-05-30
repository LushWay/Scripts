/** I18n-ignore */

import { Player, world } from '@minecraft/server'
import { ActionForm, Vec } from 'lib'
import { debounceMenu } from 'lib/form/utils'
import { isNotPlaying } from 'lib/game-utils'
import { getFullname } from 'lib/get-fullname'
import { ngettext } from 'lib/utils/ngettext'
import { SafePlace } from 'modules/places/lib/safe-place'
import { Spawn } from 'modules/places/spawn'
import { StoneQuarry } from 'modules/places/stone-quarry/stone-quarry'
import { TechCity } from 'modules/places/tech-city/tech-city'
import { VillageOfExplorers } from 'modules/places/village-of-explorers/village-of-explorers'
import { VillageOfMiners } from 'modules/places/village-of-miners/village-of-miners'

new Command('tp')
  .setPermissions(__RELEASE__ ? 'techAdmin' : 'everybody')
  .setDescription('Открывает меню телепортации')
  .executes(ctx => {
    if (ctx.player.database.role === 'member')
      return ctx.error('Команда доступна только тестерам, наблюдателям и администраторам.')
    tpMenu(ctx.player)
  })

function tpMenu(player: Player) {
  const form = new ActionForm(
    'Выберите локацию',
    'Также доступна из команды .tp\n\nПосле выхода из беты команда не будет доступна!',
  )

  const players = world.getAllPlayers().map(player => ({
    vector: player.location,
    dimensionType: player.dimension.type,
  }))

  const locations: Record<string, ReturnType<typeof location>> = {
    [VillageOfMiners.name]: location(VillageOfMiners, '136 71 13457 140 -10', players),
    [VillageOfExplorers.name]: location(VillageOfExplorers, '-35 75 13661 0 20', players),
    [StoneQuarry.name]: location(StoneQuarry, '-1300 76 14800 -90 5', players),
    [TechCity.name]: location(TechCity, '-1288 64 13626 90 -10', players),
  }

  if (Spawn.region)
    locations['Спавн'] = location({ safeArea: Spawn.region, portalTeleportsTo: Spawn.location }, '', players)

  for (const [name, { location, players }] of Object.entries(locations)) {
    form.addButton(`${name} §7(${players} ${ngettext(players, ['игрок', 'игрока', 'игроков'])})`, () => {
      if (player.database.inv !== 'anarchy' && !isNotPlaying(player)) {
        return player.fail(
          'Вы должны зайти на анархию или перейти в режим креатива, прежде чем телепортироваться! В противном случае вас просто вернет обратно на спавн.',
        )
      }
      player.runCommand('tp ' + location)
    })
  }

  form.addButton('Телепорт к игроку...', () => tpToPlayer(player))

  return form.show(player)
}

function tpToPlayer(player: Player) {
  const form = new ActionForm('Телепорт к игроку...')

  form.addButtonBack(() => tpMenu(player))

  for (const p of world.getAllPlayers()) {
    form.addButton(getFullname(p), () => player.teleport(p.location))
  }

  form.show(player)
}

function location(
  place: Pick<SafePlace, 'portalTeleportsTo' | 'safeArea'>,
  fallback: string,
  players: { vector: Vector3; dimensionType: DimensionType }[],
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
