import {
	DynamicPropertiesDefinition,
	EntityTypes,
	world,
} from "@minecraft/server";

world.events.worldInitialize.subscribe((data) => {
	const def = new DynamicPropertiesDefinition();

	def.defineString("data", 100);

	data.propertyRegistry.registerEntityTypeDynamicProperties(
		def,
		EntityTypes.get("f:t")
	);
});
