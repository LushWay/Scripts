import "lib/Extensions/import.js";

import { DynamicPropertiesDefinition, system, world } from "@minecraft/server";
import { WorldDynamicPropertiesKey } from "lib/Database/Properties.js";
import { Database } from "lib/Database/Rubedo.js";
import { util } from "lib/util.js";

const type = "performance";

world.afterEvents.worldInitialize.subscribe(({ propertyRegistry }) => {
	propertyRegistry.registerWorldDynamicProperties(
		new DynamicPropertiesDefinition().defineString("test", 1000),
	);

	world.overworld.runCommandAsync(
		"tickingarea add 0 -64 0 0 200 0 database true",
	);
});

async function test(gi = 0) {
	const loadEnd = util.benchmark(
		Database.isTablesInited ? "restore" : "load",
		type,
	);
	/**
	 * @type {WorldDynamicPropertiesKey<string, undefined | JSONLike>}
	 */
	const DB = new WorldDynamicPropertiesKey("test", {
		defaultValue(key) {
			return { defaulValueKey: key };
		},
	});

	/** @type {ReturnType<typeof DB.proxy> & {array?: Array<number>}} */
	const db = DB.proxy();
	loadEnd();

	console.log("loaded number " + gi);

	for (let i = 0; i < (gi === 0 ? 10 : 10); i++) {
		const end = util.benchmark("work", type);
		(db[i] ??= {}).value = { settedValue: i };
		end();
		await null;
		if (i % 100 === 0) console.log("num", i);
	}

	if (gi === 0) {
		db.array = [1, 2, 3];
		db.array.push(4);

		console.log(db.array);

		system.runTimeout(
			() => {
				const prop = world.getDynamicProperty("test");
				if (typeof prop === "string")
					console.log("Array: ", JSON.parse(prop).array);
			},
			"teaada",
			20,
		);
	}

	console.log("done.");
}

world.afterEvents.worldInitialize.subscribe((data) => {
	const totalEnd = util.benchmark("totalTime", type);
	(async function () {
		for (let i = 0; i < 1; i++) {
			await test(i);
		}
	})()
		.then(totalEnd)
		.then(visualise_benchmark_result)
		.then(console.log)
		.catch(util.error);
});

function visualise_benchmark_result() {
	let output = "";
	let res = [];
	for (const [key, val] of Object.entries(util.benchmark.results[type])) {
		const total_count = val.length;
		const total_time = val.reduce((p, c) => p + c);
		const average = total_time / total_count;

		res.push({ key, total_count, total_time, average });
	}

	res = res.sort((a, b) => a.average - b.average);

	for (const { key, total_count, total_time, average } of res) {
		/** @type {[number, string][]} */
		const style = [
			[0.1, "§a"],
			[0.3, "§2"],
			[0.5, "§g"],
			[0.65, "§6"],
			[0.8, "§c"],
		];

		const cur_style = style.find((e) => e[0] > average)?.[1] ?? "§4";

		output += `§3Label §f${key}§r\n`;
		output += `§3| §7average: ${cur_style}${average.toFixed(2)}ms\n`;
		output += `§3| §7total time: §f${total_time}ms\n`;
		output += `§3| §7call count: §f${total_count}\n`;
		output += "\n\n";
	}
	return output;
}
