import { system, world } from "@minecraft/server";
import { onWorldLoad } from "../Setup/loader.js";
import { util } from "../Setup/utils.js";

class MinecraftManager {
	/**
	 * Maps reciever to scriptevent path
	 * @template {keyof import("./routes.js").MINECRAFT_ROUTES} Path
	 * @param {Path} scriptevent
	 * @template {{req: any, res: any}} [Route=import("./routes.js").MINECRAFT_ROUTES[Path]]
	 * @param {(req: Route["req"]) => Route["res"]} reciever
	 */
	Route(scriptevent, reciever) {
		this.EVENT_ROUTES[scriptevent] = reciever;
	}
	/**
	 * Makes http request to node.js instance
	 * @template {keyof import("./routes.js").NODE_ROUTES} Path
	 * @param {Path} path
	 * @param {import("./routes.js").NODE_ROUTES[Path]["req"]} body
	 * @returns {Promise<import("./routes.js").NODE_ROUTES[Path]["res"]>}
	 */
	async SendToNode(path, body) {
		const sbody = JSON.stringify(body);
		console.warn("REQ TO ", path, " WITH BODY ", sbody);
		if (NET) {
			const res = await NET.http.request(
				new NET.HttpRequest("http://localhost:9090/" + path)
					.setMethod(NET.HttpRequestMethod.POST)
					.setHeaders([
						new NET.HttpHeader("content-type", "text/plain"),
						new NET.HttpHeader("content-length", sbody.length.toString()),
					])
					.setBody(sbody)
			);
			const body = JSON.safeParse(res.body, null, (err) =>
				console.warn("Error while parsing ")
			);
			if (!body || body.status === 404)
				throw new Error(body?.message ?? "Got unexpected body: " + res.body);
			return body;
		} else console.warn("NO NET MODULE");
	}

	/**
	 * @type {Record<string, (body: any) => any>}
	 * @private

	 */
	EVENT_ROUTES = {};

	/**
	 * @type {Record<string, string>}
	 * @private
	 */
	CHUNKS = {};

	constructor() {
		system.events.scriptEventReceive.subscribe(
			async (data) => {
				try {
					const path = data.id.replace(/^NODE:/, "");
					if (path in this.EVENT_ROUTES) {
						if (data.message.startsWith("{")) {
							// Plain data
							await this.receiveDataFromNode(path, JSON.parse(data.message));
						} else {
							// Chunked data
							/**
							 * @type {import("../../../../../X-API-node/src/Net/routes.js").MCDataChunk}
							 */
							const dataChank = JSON.parse(data.message);
							if (dataChank.done) {
								this.receiveDataFromNode(path, {
									uuid: dataChank.uuid,
									data: this.CHUNKS[dataChank.uuid] + dataChank.chunk,
								});

								delete this.CHUNKS[dataChank.uuid];
							} else {
								this.CHUNKS[dataChank.uuid] += dataChank.chunk;
							}
						}
					}
				} catch (e) {
					util.error(e, { errorName: "NodeReceiverError" });
				}
			},
			{ namespaces: ["NODE"] }
		);
	}

	/**
	 * @param {string} scriptevent
	 * @param {{uuid: string, data: string}} body
	 * @private
	 */
	async receiveDataFromNode(scriptevent, body) {
		const { uuid, data } = body;
		const response = await this.EVENT_ROUTES[scriptevent](data);
		await this.SendToNode("scripteventResponse", { uuid, response });
	}
}

export const MCApp = new MinecraftManager();

/**
 * Module not avaible on common worlds, so using boilerplate
 * @type {typeof import("@minecraft/server-net")}
 */
let NET;

void (async function load() {
	try {
		NET = await import("@minecraft/server-net");
	} catch (e) {
		console.warn("server-net DISABLED");
	}
})();

onWorldLoad(() => {
	console.warn("AAAAAAAAAAAA");
	const o = world.overworld.runCommand("function connect", {
		showError: true,
		showOutput: true,
	});
	console.warn(o, "BBBBBBBBBB");
});