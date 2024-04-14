import { Player, Vector, system, world } from '@minecraft/server'
import { ActionForm, getRoleAndName, isProduction, util } from 'lib.js'
import { isBuilding } from 'modules/Build/isBuilding'
import { DefaultPlaceWithSafeArea } from 'modules/Places/Default/WithSafeArea.js'
import { Spawn } from 'modules/Places/Spawn.js'
import { StoneQuarry } from 'modules/Places/StoneQuarry.js'
import { TechCity } from 'modules/Places/TechCity.js'
import { VillageOfExplorers } from 'modules/Places/VillafeOfExplorers.js'
import { VillageOfMiners } from 'modules/Places/VillageOfMiners.js'

new Command({
  name: 'tp',
  role: isProduction() ? 'techAdmin' : 'spectator',
  description: 'Открывает меню телепортации',
}).executes(ctx => {
  if (ctx.sender.database.role === 'member')
    return ctx.error('Команда доступна только тестерам, наблюдателям и администраторам.')
  tpMenu(ctx.sender)
})

/**
 * @param {Player} player
 */
function tpMenu(player) {
  const form = new ActionForm(
    'Выберите локацию',
    'Также доступна из команды .tp\n\nПосле выхода из беты команда не будет доступна!'
  )

  const players = world.getAllPlayers().map(e => ({ player, location: e.location }))

  /**
   * @type {Record<string, ReturnType<typeof location>>}
   */
  const locations = {
    'Деревня шахтеров': location(VillageOfMiners, '136 71 13457 140 -10', players),
    'Деревня исследователей': location(VillageOfExplorers, '-35 75 13661 0 20', players),
    'Каменоломня': location(StoneQuarry, '-1300 76 14800 -90 5', players),
    'Техноград': location(TechCity, '-1288 64 13626 90 -10', players),
  }

  if (Spawn.region)
    locations['Спавн'] = location({ safeArea: Spawn.region, portalTeleportsTo: Spawn.location }, '', players)

  for (const [name, { location, players }] of Object.entries(locations)) {
    form.addButton(`${name} §7(${players} ${util.ngettext(players, ['игрок', 'игрока', 'игроков'])})`, () => {
      if (player.database.inv !== 'anarchy' && !isBuilding(player)) {
        return player.fail(
          'Вы должны зайти на анархию или перейти в режим креатива, прежде чем телепортироваться! В противном случае вас просто вернет обратно на спавн.'
        )
      }
      player.runCommand('tp ' + location)
    })
  }

  form.addButton('Телепорт к игроку...', () => tpToPlayer(player))

  return form.show(player)
}

/**
 * @param {Player} player
 */
function tpToPlayer(player) {
  const form = new ActionForm('Телепорт к игроку...')

  form.addButtonBack(() => tpMenu(player))

  for (const p of world.getAllPlayers()) {
    form.addButton(`${getRoleAndName(p)}`, () => player.teleport(p.location))
  }

  form.show(player)
}

/**
 *
 * @param {Pick<DefaultPlaceWithSafeArea, 'portalTeleportsTo' | 'safeArea'>} place
 * @param {string} fallback
 * @param {{player: Player, location: Vector3}[]} players
 */
function location(place, fallback, players) {
  const playersC = players.filter(e => place.safeArea.vectorInRegion(e.location)).length

  if (place.portalTeleportsTo.valid) {
    return {
      players: playersC,
      location:
        Vector.string(place.portalTeleportsTo) +
        ' ' +
        place.portalTeleportsTo.xRot +
        ' ' +
        place.portalTeleportsTo.yRot,
    }
  }

  return { location: fallback, players: playersC }
}
/**
 * @type {Set<string>}
 */
const SENT = new Set()

/**
 * @param {Player} player
 */
export function tpMenuOnce(player) {
  if (!SENT.has(player.id)) {
    tpMenu(player).then(() =>
      system.runTimeout(
        () => {
          SENT.delete(player.id)
        },
        'tp menu sent reset',
        40
      )
    )
    SENT.add(player.id)
  }
}
