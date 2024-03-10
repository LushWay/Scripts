import { util } from 'lib/util.js'
import { BDS } from './modules.js'

class RequestError extends Error {}

/**
 * Makes http request to node.js instance
 * @template {keyof BDS.Routes} Path
 * @param {Path} path
 * @param {BDS.Routes[Path]["req"]} body
 * @returns {Promise<BDS.Routes[Path]["res"]>}
 */
export async function request(path, body) {
  const sbody = JSON.stringify(body)
  const prefix = `request('${path}'`
  console.warn(`${prefix},`, body, '§r)')
  if (BDS.ServerNet) {
    const { http, HttpRequest, HttpRequestMethod } = BDS.ServerNet
    // TODO Use secrets to get port
    const response = await http.request(
      new HttpRequest('http://localhost:19514/' + path)
        .setMethod(HttpRequestMethod.Post)
        .addHeader('content-type', 'text/plain')
        .addHeader('content-length', sbody.length.toString())
        .setBody(sbody)
    )

    let body
    try {
      body = JSON.parse(response.body)
    } catch (e) {
      const error = util.error(e, { parseOnly: true })
      throw new RequestError(
        `${prefix}): Failed to parse NodeServer response.body: ${util.inspect(response.body)}\n${error}`
      )
    }

    if (body.status === 404) {
      throw new RequestError(`${prefix}): Unkown path!`)
    }

    return body
  } else console.error('NET MODULE IS DISABLED, SKIPPING')
}

/**
 * Sends packet message to the core nodejs process running BDS.
 * Used mostly for console/chat logging purposes, when data must
 * be sent but the response is not needed.
 * @template {keyof BDS.StdoutPackets} T
 * @param {T} type - Packet type
 * @param {BDS.StdoutPackets[T]} packet - Packet content
 */
export function sendPacketToStdout(type, packet) {
  console.log(`[Packet] [${type}] ${JSON.stringify(packet)}`)
}

/**
 * @typedef {import("./routes.js")} I
 */
