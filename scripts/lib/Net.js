// TODO Move import of shared types into shared repo
/**
 * @typedef {import("../../../../tools/server/routes.js").NODE_ROUTES} NODE_ROUTES
 */

import { util } from 'lib/util.js'
import { MODULE } from './OptionalModules.js'

class APIError extends Error {}

/**
 * Makes http request to node.js instance
 * @template {keyof NODE_ROUTES} Path
 * @param {Path} path
 * @param {NODE_ROUTES[Path]["req"]} body
 * @returns {Promise<NODE_ROUTES[Path]["res"]>}
 */
export async function APIRequest(path, body) {
  const sbody = JSON.stringify(body)
  const prefix = `APIRequest('${path}'`
  console.warn(`${prefix},`, body, '§r)')
  if (MODULE.ServerNet) {
    const { http, HttpRequest, HttpRequestMethod } = MODULE.ServerNet
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
      throw new APIError(
        `${prefix}): Failed to parse NodeServer response.body: ${util.inspect(response.body)}\n${error}`
      )
    }

    if (body.status === 404) {
      throw new APIError(`${prefix}): Unkown path!`)
    }

    return body
  } else console.error('NET MODULE IS DISABLED, ABORTING')
}
