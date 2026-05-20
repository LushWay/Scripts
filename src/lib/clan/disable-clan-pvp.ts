import { Clan } from 'lib/clan/clan'
import { regionPermissions } from 'lib/region'

regionPermissions.isPvPallowed.push((attacker, reciever) => {
  if (attacker.database.inv !== 'anarchy' || reciever.database.inv !== 'anarchy') return

  const attackerClan = Clan.getPlayerClan(attacker.id)
  const recieverClan = Clan.getPlayerClan(reciever.id)
  if (attackerClan === recieverClan) return false
})
