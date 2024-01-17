import { Player, Vector, world } from '@minecraft/server'
import { StoneQuarry } from 'modules/Survival/Place/StoneQuarry.js'
import { TechCity } from 'modules/Survival/Place/TechCity.js'
import { VillageOfExplorers } from 'modules/Survival/Place/VillafeOfExplorers.js'
import { VillageOfMiners } from 'modules/Survival/Place/VillageOfMiners.js'
import { DefaultPlaceWithSafeArea } from 'modules/Survival/utils/DefaultPlace.js'
import { ActionForm, ROLES, getRole } from 'smapi.js'

new Command({
  name: 'tp',
  role: 'member', // TODO! on release change role to builder
  description: 'Открывает меню телепортации',
}).executes(ctx => {
  tpMenu(ctx.sender)
})

/**
 * @param {Player} player
 */
export function tpMenu(player) {
  const form = new ActionForm('Выберите локацию', 'также доступна из команды -tp')

  const players = world.getAllPlayers().map(e => ({ player, location: e.location }))
  const locations = {
    'Деревня шахтеров': location(VillageOfMiners, '136 71 13457 140 -10', players),
    'Деревня исследователей': location(VillageOfExplorers, '-35 75 13661 0 20', players),
    'Каменоломня': location(StoneQuarry, '-1300 76 14800 -90 5', players),
    'Техноград': location(TechCity, '-1288 64 13626 90 -10', players),
  }

  for (const [name, { location, players }] of Object.entries(locations)) {
    form.addButton(name + '(' + players + ')', () => player.runCommand('tp ' + location))
  }

  form.addButton('Телепорт к игроку', () => tpToPlayer(player))

  return form.show(player)
}

/**
 * @param {Player} player
 */
function tpToPlayer(player) {
  const form = new ActionForm('Телепорт к игроку')

  form.addButtonBack(() => tpMenu(player))

  for (const p of world.getAllPlayers()) {
    form.addButton(`${ROLES[getRole(p.id)]} ${p.name}`, () => player.teleport(p.location))
  }

  form.show(player)
}

/**
 *
 * @param {DefaultPlaceWithSafeArea} place
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
