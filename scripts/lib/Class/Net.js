import { HttpResponse } from "@minecraft/server-net";

/**
 * Module not avaible on common worlds, so using boilerplate
 * @type {typeof import("@minecraft/server-net")}
 */
let NET;

// TODO routes shema validation
// TODO scriptevent routes with validation
/**
 *
 * @param {string} path
 * @param {JSONLike} body
 * @returns {Promise<HttpResponse>}
 */
export function fetch(path, body) {
	const sbody = JSON.stringify(body);
	console.warn("REQ TO ", path, " WITH BODY ", sbody);
	if (NET)
		return NET.http.request(
			new NET.HttpRequest("http://localhost:9091/" + path)
				.setMethod(NET.HttpRequestMethod.POST)
				.setHeaders([
					new NET.HttpHeader("content-type", "text/plain"),
					new NET.HttpHeader("content-length", sbody.length.toString()),
				])
				.setBody(sbody)
		);
}

async function load() {
	try {
		NET = await import("@minecraft/server-net");
	} catch (e) {
		console.warn("server-net UNAVAIBLE");
	}
}

load();
