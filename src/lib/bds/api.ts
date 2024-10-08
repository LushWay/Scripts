import { t } from 'lib/text'
import { inspect } from 'lib/util'
import { ServerModules } from './modules'
import { ServerRpc } from './routes'

class RequestError extends Error {}

/** Makes http request to node instance */
export async function request<Path extends keyof ServerRpc.Routes>(
  path: Path,
  body: ServerRpc.Routes[Path]['req'],
): Promise<ServerRpc.Routes[Path]['res']> {
  console.info(t`request(${path}, ${body})`)

  if (ServerModules.Net) {
    const { http, HttpRequest, HttpRequestMethod } = ServerModules.Net

    const stringifiedBody = JSON.stringify(body)
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

    try {
      return JSON.parse(response.body) as ServerRpc.Routes[Path]['res']
    } catch (error) {
      throw new RequestError(
        t.error`request(${path}): Failed to parse NodeServer response.body(${inspect(response.body)}): ${error}`,
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
export function sendPacketToStdout<T extends keyof ServerRpc.StdoutPackets>(
  type: T,
  packet: ServerRpc.StdoutPackets[T],
) {
  console.log(`[Packet] [${type}] ${JSON.stringify(packet)}`)
}
