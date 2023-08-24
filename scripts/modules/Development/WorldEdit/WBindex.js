import {
	EquipmentSlot,
	Player,
	system,
	Vector,
	world,
} from "@minecraft/server";

// Lazy load to prevent script spike
system.runTimeout(() => import("./commands/index.js"), "command import", 40);

import { Options } from "xapi.js";
import "./builders/ToolBuilder.js";
import { WorldEditBuild } from "./builders/WorldEditBuilder.js";

export const WorldEditPlayerSettings = Options.player("Строитель мира", "we", {
	noBrushParticles: {
		name: "Партиклы кисти",
		desc: "Отключает партиклы у кисти",
		value: false,
	},
	enableMobile: {
		name: "Мобильное управление",
		desc: "Включает мобильное управление",
		value: false,
	},
});

system.runInterval(
	() => {
		WorldEditBuild.drawSelection();
	},
	"we Selection",
	20
);

world.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
	if (itemStack.typeId === "we:dash") {
		source.teleport(
			Vector.add(source.location, Vector.multiply(source.getViewDirection(), 5))
		);
	}
});
