import { Player } from '@minecraft/server'
import { defaultLang } from './assets/lang'
import { Clan } from './clan/clan'
import { i18n } from './i18n/text'
import { getRole, ROLES } from './roles'
import { EquippmentLevel } from './rpg/equipment-level'
// TODO Rewrite to class// TODO Rewrite to class// TODO Rewrite to class// TODO Rewrite to class// TODO Rewrite to class// TODO Rewrite to class// TODO Rewrite to class// TODO Rewrite to class
/**
 * Gets displayable the role of this player
 *
 * @example
 *   getDisplayRole(player.id) === '§aРуководство §r§fXilLeR228§r'
 *
 * @example
 *   getDisplayRole(player.id, { name: false }) === '§aРуководство§r'
 *
 * @param playerID - Player or his id to get role from
 * @param o - Options
 * @param o.role - Whenther to include role or not. Default is `true`
 * @param o.name - Whenether to include player name or not. Default is `true`
 * @param o.noName - Name to display if no name was found. Default is `'Unknown'`
 * @param o.nameColor - String used between role and name. Default is `'§r§f'`
 * @param o.clearColorAfter - Whenether to add §r at the end of the string or not
 * @param o.nameSpacing - Add spacing after role. Defaults to !!name
 */

export function getFullname(
  playerID: Player | string,
  {
    role: useRole = true,
    clan: useClan = true,
    newbie: useNewbie = true,
    equippment = false,
    name = true,
    noName = 'Unknown',
    nameColor = '§r§f',
    clearColorAfter = true,
  }: {
    newbie?: boolean
    clan?: boolean
    role?: boolean
    name?: boolean
    noName?: string
    nameColor?: string
    clearColorAfter?: boolean
    equippment?: boolean
  } = {},
) {
  const id = playerID instanceof Player ? playerID.id : playerID
  let result = ''
  const add = (text: string) => (result += result ? ' ' + text : text)

  if (useNewbie && Player.database.getImmutable(id).survival.newbie) add(i18n.nocolor`§bНовичок`.to(defaultLang))

  if (useRole) {
    const role = getRole(playerID)
    if (role !== 'member') add(ROLES[role].to(defaultLang))
  }

  if (equippment && playerID instanceof Player) {
    const emoji = EquippmentLevel.getEmoji(playerID)
    if (emoji) add(emoji)
  }

  if (useClan) {
    const clan = Clan.getPlayerClan(id)
    if (clan) add('§r§7[' + clan.db.shortname + ']§f')
  }

  if (name) {
    result += nameColor
    if (playerID instanceof Player) {
      add(playerID.name)
    } else {
      const name = Player.name(playerID)
      add(name ?? noName)
    }
  }

  if (clearColorAfter && result) result += '§r'

  return result
}
