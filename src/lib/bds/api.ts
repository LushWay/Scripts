import { i18n, noI18n } from 'lib/i18n/text'
import { inspect } from 'lib/util'
import './events'
import { ServerModules } from './modules'
import { ScriptServerRpc } from './routes'

class RequestError extends Error {}

/**
 * Makes http request to node instance
 *
 * @deprecated Temporary not working
 */
export async function request<Path extends keyof ScriptServerRpc.OutgoingRoutes>(
  path: Path,
  body: ScriptServerRpc.OutgoingRoutes[Path]['req'],
): Promise<ScriptServerRpc.OutgoingRoutes[Path]['res']> {
  console.info(i18n`request(${path}, ${body})`)

  if (ServerModules.Net) {
    const { http, HttpRequest, HttpRequestMethod } = ServerModules.Net

    const stringifiedBody = body ? JSON.stringify(body) : ''
    const response = await http.request(
      new HttpRequest(`http://localhost:${__SERVER_PORT__}/` + path)
        .setMethod(HttpRequestMethod.Post)
        .addHeader('content-type', 'text/plain')
        .addHeader('content-length', stringifiedBody.length.toString())
        .setBody(stringifiedBody),
    )

    if (response.status === 404) {
      throw new RequestError(`request(${path}): Unknown path!`)
    }

    if (response.status !== 200) {
      throw new RequestError(`request(${path}): Unknown status ${response.status}. Expected 200.`)
    }

    try {
      return (response.body ? JSON.parse(response.body) : undefined) as ScriptServerRpc.OutgoingRoutes[Path]['res']
    } catch (error) {
      throw new RequestError(
        noI18n.error`request(${path}): Failed to parse NodeServer response.body(${inspect(response.body)}): ${error}`,
      )
    }
  } else console.error('NET MODULE IS DISABLED, SKIPPING')
}

/**
 * Sends packet message to the core nodejs process running BDS. Used mostly for console/chat logging purposes, when data
 * must be sent but the response is not needed.
 *
 * @param type - Packet type
 * @param packet - Packet content
 */
export function sendPacketToStdout<T extends keyof ScriptServerRpc.OutgoingPackets>(
  type: T,
  packet: ScriptServerRpc.OutgoingPackets[T],
) {
  console.log(`[Packet] [${type}] ${JSON.stringify(packet)}`)
}

/** Data in this source comes from API so it may be unavailable */
export const externalSource: { playerMetadata: ScriptServerRpc.IncomingScriptEvents['updatePlayerMeta'] } = {
  playerMetadata: [],
}
