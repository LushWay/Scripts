import { Player, system, world } from '@minecraft/server'
import { ActionForm, Vector, getRoleAndName, util } from 'lib'
import { DefaultPlaceWithSafeArea } from 'modules/places/lib/DefaultWithSafeArea'
import { Spawn } from 'modules/places/spawn'
import { StoneQuarry } from 'modules/places/stone-quarry/stone-quarry'
import { TechCity } from 'modules/places/tech-city'
import { VillageOfExplorers } from 'modules/places/village-of-explorers'
import { VillageOfMiners } from 'modules/places/village-of-miners'
import { isNotPlaying } from 'modules/world-edit/isBuilding'

new Command('tp')
  .setPermissions(__PRODUCTION__ ? 'techAdmin' : 'everybody')
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
    'Деревня шахтеров': location(VillageOfMiners, '136 71 13457 140 -10', players),
    'Деревня исследователей': location(VillageOfExplorers, '-35 75 13661 0 20', players),
    'Каменоломня': location(StoneQuarry, '-1300 76 14800 -90 5', players),
    'Техноград': location(TechCity, '-1288 64 13626 90 -10', players),
  }

  if (Spawn.region)
    locations['Спавн'] = location({ safeArea: Spawn.region, portalTeleportsTo: Spawn.location }, '', players)

  for (const [name, { location, players }] of Object.entries(locations)) {
    form.addButton(`${name} §7(${players} ${util.ngettext(players, ['игрок', 'игрока', 'игроков'])})`, () => {
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
    form.addButton(getRoleAndName(p), () => player.teleport(p.location))
  }

  form.show(player)
}

function location(
  place: Pick<DefaultPlaceWithSafeArea, 'portalTeleportsTo' | 'safeArea'>,
  fallback: string,
  players: { location: Vector3; dimension: Dimensions }[],
) {
  const playersC = players.filter(e => place.safeArea.isVectorInRegion(e.location, e.dimension)).length

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
