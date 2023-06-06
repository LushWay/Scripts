type NODE_ROUTES =
	import("../../../../../X-API-node/src/Net/routes.js").NODE_ROUTES;

export interface MINECRAFT_ROUTES {
	ping: { req: any; res: { status: number } };
	test: { req: any; res: any };
	minecraft: { req: any; res: { data: "YEE" } };
}
