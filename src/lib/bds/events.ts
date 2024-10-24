import { system } from '@minecraft/server'
import { externalSource } from './api'
import { ScriptServerRpc } from './routes'

const scriptevents: { [K in keyof ScriptServerRpc.Events]: (request: ScriptServerRpc.Events[K]) => void } = {
  giveAirdropKey({ level }) {
    console.log('Gave airdrop key with level', level)
  },
  updatePlayerMeta(meta) {
    externalSource.playerMetadata = meta
  },
  updatePlayerLangs(request) {
    for (const player of externalSource.playerMetadata) {
      if (player.xuid === request.xuid || (player.pfid && request.pfid && player.pfid === request.pfid)) {
        player.lang = request.lang
      }
    }
  },
}

system.afterEvents.scriptEventReceive.subscribe(
  event => {
    const id = event.id.split(':')[1]
    if (id in scriptevents) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      scriptevents[id as keyof typeof scriptevents](JSON.parse(decodeURI(event.message)))
    }
  },
  { namespaces: ['bds-api'] },
)
