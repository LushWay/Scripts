import { world } from "@minecraft/server";
import { setTickTimeout, sleep, XA } from "xapi.js";
import { configuration } from "../config.js";
import { Cuboid } from "../utils/Cuboid.js";

export class Structure {
	/**
	 * Creates a new structure save
	 * @example new Shape(DefaultModes.sphere,BlockLocation, ["stone", "wood"], 10);
	 */
	constructor(prefix, pos1, pos2) {
		this.id = Date.now();
		this.prefix = `"${prefix}|${this.id}`;
		this.pos1 = pos1;
		this.pos2 = pos2;

		this.files = [];

		this.save();
	}

	async save() {
		const regions = new Cuboid(this.pos1, this.pos2).split(configuration.STRUCTURE_CHUNK_SIZE);
		let errors = 0;
		let all = 0;
		for (const region of regions) {
			const name = `${this.prefix}|${regions.indexOf(region)}"`;
			const pos1 = region.pos1;
			const pos2 = region.pos2;
			const out = await XA.runCommandX(
				`structure save ${name} ${pos1.x} ${pos1.y} ${pos1.z} ${pos2.x} ${pos2.y} ${pos2.z} memory`
			);
			all++;
			if (!out) {
				this.files.push({
					name: name,
					pos1: pos1,
					pos2: pos2,
				});
			} else {
				errors++;

				/*
        world.say(
          "§c► §fЧанки будут подгружены с помощью игрока"
        );
        XA.runCommandAsync(`tickingarea remove safezone`);
        XA.runCommandAsync(
          `tickingarea add ${pos1.x} ${pos1.y} ${pos1.z} ${pos2.x} ${pos2.y} ${pos2.z} safezone`
        );
        setTickTimeout(() => {
            XA.runCommandAsync(
            `structure save ${name} ${pos1.x} ${pos1.y} ${pos1.z} ${pos2.x} ${pos2.y} ${pos2.z} memory`
          )
          this.files.push({
            name: name,
            pos1: pos1,
            pos2: pos2,
          });
          world.say("§9► §fСохранено.");
        }, 80);
        */
			}
		}
		if (errors > 0) throw new Error(`§c${errors}§f\\§a${all}§f не сохранено.`);
	}

	async load() {
		let errors = 0;
		let all = 0;
		for (const file of this.files) {
			const out =
				(await XA.runCommandX(`structure load ${file.name} ${file.pos1.x} ${file.pos1.y} ${file.pos1.z}`))
					.successCount > 0;
			all++;
			if (out) {
				errors++;
				world.say("§c► §fЧанки будут подгружены с помощью области");
				XA.runCommandX(`tickingarea remove safezone`);
				XA.runCommandX(
					`tickingarea add ${file.pos1.x} ${file.pos1.y} ${file.pos1.z} ${file.pos2.x} ${file.pos2.y} ${file.pos2.z} safezone`
				);
				setTickTimeout(() => {
					world.say("§9►");
					XA.runCommandX(`structure load ${file.name} ${file.pos1.x} ${file.pos1.y} ${file.pos1.z}`);
					world.say("§9► §fЗагружено.");
				}, 40);
			}
			await sleep(1);
			if (errors > 0) throw new Error(`§c${errors}§f\\§a${all}§f не загружено.`);
		}
	}
}
