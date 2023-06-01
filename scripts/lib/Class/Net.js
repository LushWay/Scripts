/**
 * Module not avaible on common worlds, so using boilerplate
 * @type {typeof import("@minecraft/server-net")}
 */
let NET;

/**
 *
 * @param {string} path
 * @param {JSONLike} body
 */
export function fetch(path, body) {
	return (
		NET &&
		NET.http.request(
			new NET.HttpRequest("http://localhost:9091/" + path)
				.setMethod(NET.HttpRequestMethod.POST)
				.setHeaders([new NET.HttpHeader("Auth", "BASIC")])
				.setBody(JSON.stringify(body))
		)
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
