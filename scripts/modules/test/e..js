import { world } from "@minecraft/server";
import { Database } from "../../lib/Database/Rubedo.js";

new XA.Command({ name: "test" }).executes(() => {
	const DB = new Database("test");
	// test
	const start1 = Date.now();
	DB.set(`entry`, start1); // change "set" here
	world.sendMessage(`single: ${Date.now() - start1}ms`);

	const times = [];
	const start2 = Date.now();
	for (let i = 0; i < 500; i++) {
		const time = Date.now();
		DB.set(`entry${i}`, time); // change "set" here
		times.push(Date.now() - time);
	}
	world.sendMessage(`x500: ${Date.now() - start2}ms`);
	const avg = (times.reduce((a, b) => a + b) / times.length).toFixed(1);
	world.sendMessage(`avg: ${avg}ms`);
});
