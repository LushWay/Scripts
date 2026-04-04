import { Player } from '@minecraft/server'
import { sendPacketToStdout } from 'lib/bds/api'
import { getFullname } from 'lib/get-fullname'
import { noI18n } from 'lib/i18n/text'
import { JoinWithMessage } from 'lib/player-join'

export class LushWayJoin extends JoinWithMessage {
  onJoinMoveMessage(player: Player, where: 'air' | 'ground', message: Text): void {
    sendPacketToStdout('joinOrLeave', {
      name: player.name,
      role: getFullname(player, { name: false }),
      status: 'move',
      where,
      print: noI18n.nocolor`${'§l§f' + player.name} ${getFullname(player, { name: false })}: ${message}`,
    })
  }
}

new LushWayJoin()
