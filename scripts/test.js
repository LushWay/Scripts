import { world } from "@minecraft/server";

world.debug = (...data) => {
	world.sendMessage(data.map((e) => JSON.stringify(e)).join(" "));
};

world.events.beforeItemUseOn.subscribe((data) => {
	world.debug("beforeItemUseOn", data.getBlockLocation());
});

world.events.itemStartUseOn.subscribe((data) => {
	world.debug("itemUseOn", data.getBlockLocation());
});
