import { world } from "@minecraft/server";
import { setTickTimeout, sleep, XA } from "xapi.js";
import { WB_CONFIG } from "../../config.js";
import { Cuboid } from "../utils/Cuboid.js";

export class Structure {
	/**
	 * Creates a new structure save
	 * @param {string} prefix
	 * @param {Vector3} pos1
	 * @param {Vector3} pos2
	 */
	constructor(prefix, pos1, pos2) {
		this.id = Date.now().toString(32);
		this.prefix = `${prefix}|${this.id}`;
		this.pos1 = pos1;
		this.pos2 = pos2;

		this.files = [];

		this.save();
	}

	async save() {
		const regions = new Cuboid(this.pos1, this.pos2).split(WB_CONFIG.STRUCTURE_CHUNK_SIZE);
		let errors = 0;
		let all = 0;
		for (const region of regions) {
			const name = `${this.prefix}|${regions.indexOf(region)}`;
			const pos1 = region.pos1;
			const pos2 = region.pos2;
			const result = await XA.runCommandX(
				`structure save "${name}" ${pos1.x} ${pos1.y} ${pos1.z} ${pos2.x} ${pos2.y} ${pos2.z} memory`,
				{ showError: true }
			);
			all++;
			if (result > 0) {
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
		if (errors > 0) throw new Error(`§c${errors}§f/§a${all}§f не сохранено.`);
	}

	async load() {
		let errors = 0;
		let all = 0;
		for (const file of this.files) {
			const result = await XA.runCommandX(
				`structure load "${file.name}" ${file.pos1.x} ${file.pos1.y} ${file.pos1.z}`,
				{
					showError: true,
				}
			);
			all++;
			if (result === 0) {
				errors++;
				// world.say("§c► §fЧанки будут подгружены с помощью области");
				// XA.runCommandX(`tickingarea remove safezone`);
				// XA.runCommandX(
				// 	`tickingarea add ${file.pos1.x} ${file.pos1.y} ${file.pos1.z} ${file.pos2.x} ${file.pos2.y} ${file.pos2.z} safezone`
				// );
				// setTickTimeout(
				// 	() => {
				// 		world.say("§9►");
				// 		XA.runCommandX(`structure load ${file.name} ${file.pos1.x} ${file.pos1.y} ${file.pos1.z}`);
				// 		world.say("§9► §fЗагружено.");
				// 	},
				// 	40,
				// 	"structureLoad"
				// );
			}
			await sleep(1);
		}
		if (errors > 0) throw new Error(`§c${errors}§f/§a${all}§f не загружено.`);
	}
}
