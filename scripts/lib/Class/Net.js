/**
 * @typedef {import("../../../../../tools/server/Net/routes.js").NODE_ROUTES} NODE_ROUTES
 */

import { Module } from "./OptionalModules.js";

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
	if (Module.ServerNet) {
		const { http, HttpRequest, HttpRequestMethod } = Module.ServerNet;
		const response = await http.request(
			new HttpRequest("http://localhost:19000/" + path)
				.setMethod(HttpRequestMethod.Post)
				.addHeader("content-type", "text/plain")
				.addHeader("content-length", sbody.length.toString())
				.setBody(sbody),
		);
		const body = JSON.safeParse(response.body, void 0, (err) =>
			console.warn("Error while parsing ", response.body, err),
		);

		if (!body || body.status === 404)
			throw new Error(body?.message ?? "Got unexpected body: " + response.body);

		return body;
	} else console.error("NET MODULE ARE DISABLED, ABORTING");
}
