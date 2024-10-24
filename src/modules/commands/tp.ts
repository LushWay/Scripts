/** I18n-ignore */

import { Player, system, world } from '@minecraft/server'
import { ActionForm, Vector } from 'lib'
import { isNotPlaying } from 'lib/game-utils'
import { getFullname } from 'lib/get-fullname'
import { ngettext } from 'lib/utils/ngettext'
import { PlaceWithSafeArea } from 'modules/places/lib/place-with-safearea'
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

  const players = world.getAllPlayers().map(e => ({
    location: e.location,
    dimension: e.dimension.type,
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
  place: Pick<PlaceWithSafeArea, 'portalTeleportsTo' | 'safeArea'>,
  fallback: string,
  players: { location: Vector3; dimension: Dimensions }[],
) {
  const playersC = players.filter(e => place.safeArea?.area.isVectorIn(e.location, e.dimension)).length

  if (place.portalTeleportsTo.valid) {
    return {
      players: playersC,
      location: `${Vector.string(place.portalTeleportsTo)} ${place.portalTeleportsTo.xRot} ${place.portalTeleportsTo.yRot}`,
    }
  }

  return { location: fallback, players: playersC }
}

const SENT = new Set<string>()

export function tpMenuOnce(player: Player) {
  if (!SENT.has(player.id)) {
    tpMenu(player).then(() =>
      system.runTimeout(
        () => {
          SENT.delete(player.id)
        },
        'tp menu sent reset',
        40,
      ),
    )
    SENT.add(player.id)
  }
}
