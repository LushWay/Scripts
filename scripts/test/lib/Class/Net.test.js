import { Tags, registerAsync } from "@minecraft/server-gametest";
import { APIRequest } from "../../../lib/Class/Net.js";

registerAsync("class", "net", async (test) => {
	const res = await APIRequest("ping", "");
	test.assert(res.status === 200, "Response status should be 200");
	test.succeed();
}).tag(Tags.suiteDefault);
