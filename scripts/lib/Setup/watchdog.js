import { system, WatchdogTerminateReason, world } from "@minecraft/server";

/** @type {Record<WatchdogTerminateReason, string>} */
const reasons = {
	hang: "Скрипт завис",
	stackOverflow: "Стэк переполнен",
};

system.events.beforeWatchdogTerminate.subscribe((event) => {
	event.cancel = true;
	world.say("§cСобакаСутулая: §f" + reasons[event.terminateReason]);
});
