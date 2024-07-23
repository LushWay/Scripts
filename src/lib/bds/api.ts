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
  const sbody = JSON.stringify(body)
  const prefix = `request('${path}'`
  console.warn(`${prefix},`, body, '§r)')

  if (ServerModules.Net) {
    const { http, HttpRequest, HttpRequestMethod } = ServerModules.Net

    const response = await http.request(
      new HttpRequest(`http://localhost:${__SERVER_PORT__}/` + path)
        .setMethod(HttpRequestMethod.Post)
        .addHeader('content-type', 'text/plain')
        .addHeader('content-length', sbody.length.toString())
        .setBody(sbody),
    )

    let body
    try {
      body = JSON.parse(response.body) as { status: number }
    } catch (error) {
      throw new RequestError(
        t.error`${prefix}): Failed to parse NodeServer response.body: ${inspect(response.body)}\n${error}`,
      )
    }

    if (body.status === 404) {
      throw new RequestError(`${prefix}): Unkown path!`)
    }

    return body
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
