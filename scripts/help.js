import { Player, world } from "@minecraft/server";

world.say("e");

world.events.entityHurt.subscribe((data) => {
	world.say("triggered");
	if (!(data.hurtEntity instanceof Player)) return;
	const health = data.hurtEntity.getComponent("health");
	if (health.current - data.damage > 0) return;
	world.say("s");
});
