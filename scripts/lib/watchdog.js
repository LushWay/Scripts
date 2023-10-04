import {
	DynamicPropertiesDefinition,
	system,
	WatchdogTerminateReason,
	world,
} from "@minecraft/server";

/** @type {Record<WatchdogTerminateReason, string>} */
const reasons = {
	Hang: "Скрипт завис",
	StackOverflow: "Стэк переполнен",
};

system.beforeEvents.watchdogTerminate.subscribe((event) => {
	world.say("§cСобакаСутулая: §f" + reasons[event.terminateReason]);
	event.cancel = true;
});

world.afterEvents.worldInitialize.subscribe(({ propertyRegistry }) => {
	console.log("definition");
	propertyRegistry.registerWorldDynamicProperties(
		new DynamicPropertiesDefinition()
			.defineString("player", 1000)
			.defineString("blockSets", 1000)
			.defineString("options", 1000),
	);
});
