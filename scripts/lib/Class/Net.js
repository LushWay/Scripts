/**
 * Module not avaible on common worlds, so using boilerplate
 * @type {typeof import("@minecraft/server-net")}
 */
let NET;

import("@minecraft/server-net")
	.then((MODULE) => {
		NET = MODULE;
	})
	.catch(() => console.log("MODULE @minecraft/server-net ARE DISABLED"));

/**
 * @typedef {import("../../../../../tools/server/Net/routes.js").NODE_ROUTES} NODE_ROUTES
 */

/**
 * Makes http request to node.js instance
 * @template {keyof NODE_ROUTES} Path
 * @param {Path} path
 * @param {NODE_ROUTES[Path]["req"]} body
 * @returns {Promise<NODE_ROUTES[Path]["res"]>}
 */
export async function APIRequest(path, body) {
	const sbody = JSON.stringify(body);
	console.warn("REQ TO ", path, " WITH BODY ", sbody);
	if (NET) {
		const res = await NET.http.request(
			new NET.HttpRequest("http://localhost:9090/" + path)
				.setMethod(NET.HttpRequestMethod.Post)
				.setHeaders([
					new NET.HttpHeader("content-type", "text/plain"),
					new NET.HttpHeader("content-length", sbody.length.toString()),
				])
				.setBody(sbody)
		);
		const body = JSON.safeParse(res.body, null, (err) =>
			console.warn("Error while parsing ", res.body, err)
		);

		if (!body || body.status === 404)
			throw new Error(body?.message ?? "Got unexpected body: " + res.body);

		return body;
	} else console.error("NET MODULE ARE DISABLED, ABORTING");
}
