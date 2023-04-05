import { world } from "@minecraft/server";
import { Database } from "../../lib/Database/Rubedo.js";

new XA.Command({ name: "test" }).executes(() => {
	const DB = new Database("test");
	const times = [];
	const start2 = Date.now();
	for (let i = 0; i < 100; i++) {
		const time = Date.now();
		DB.set(`entry${i}`, time); // change "set" here
		times.push(Date.now() - time);
	}
	world.sendMessage(`x1000: ${Date.now() - start2}ms`);
	const avg = (times.reduce((a, b) => a + b) / times.length).toFixed(1);
	world.sendMessage(`avg: ${avg}ms`);
});
