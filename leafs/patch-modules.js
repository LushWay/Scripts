// @ts-check

import * as fs from "fs/promises";
import path from "path";

/**
 * Replaces and adds code to a package's TypeScript definition file.
 * @param {string} packageName - The name of the package to patch.
 * @param {object} options - The patching options.
 * @param {{find: RegExp | string, replace: string, all?: boolean}[]} options.replaces - The replacements to make to the original code. Each object in the array should have a `find` and `replace` property.
 * @param {object} options.additions
 * @param {string} options.additions.beginning - The code to add to the beginning of the file.
 * @param {string} options.additions.afterImports - The code to add after any import statements.
 * @param {string} options.additions.ending - The code to add to the end of the file.
 */
async function patchPackage(packageName, options) {
	// Get the path to the package's TypeScript definition file
	const packagePath = path.join("node_modules", packageName, `index.d.ts`);

	// Read the original code from the file
	const originalCode = await fs.readFile(packagePath, "utf-8");

	// Apply the replacements
	let patchedCode = originalCode;
	for (const replace of options.replaces) {
		patchedCode = patchedCode[replace.all ? "replaceAll" : "replace"](
			replace.find,
			replace.replace
		);
	}

	options.additions.beginning ??= "";
	options.additions.ending ??= "";

	let newCode = `${options.additions.beginning}\n${patchedCode}\n${options.additions.ending}`;

	if (options.additions.afterImports) {
		const lines = newCode.split(/\n/g);

		let lastImport = 0;
		for (const [i, line] of lines.entries()) {
			if (line.trim().startsWith("import ")) lastImport = i + 1;
		}

		newCode = [
			...lines.slice(0, lastImport),
			options.additions.afterImports,
			...lines.slice(lastImport),
		].join("\n");
	}

	// Write the patched code back to the file
	await fs.writeFile(packagePath, newCode);
}

patchPackage("@minecraft/server", {
	replaces: [
		{
			find: "getComponent(componentName: string): any;",
			replace: `
getComponent<N extends keyof BlockComponents>(
	componentName: N
): BlockComponents[N];`.trim(),
		},
		{
			find: "getComponent(componentId: string): IEntityComponent;",
			replace: `
getComponent<N extends keyof EntityComponents>(
  componentName: N
): EntityComponents[N]`.trim(),
			all: true,
		},
	],
	additions: {
		beginning: "",
		afterImports: `

type BlockComponents = {
	"minecraft:inventory": BlockInventoryComponent;
	inventory: BlockInventoryComponent;
	"minecraft:lavaContainer": BlockLavaContainerComponent;
	lavaContainer: BlockLavaContainerComponent;
	"minecraft:piston": BlockPistonComponent;
	piston: BlockPistonComponent;
	"minecraft:potionContainer": BlockPotionContainerComponent;
	potionContainer: BlockPotionContainerComponent;
	"minecraft:recordPlayer": BlockRecordPlayerComponent;
	recordPlayer: BlockRecordPlayerComponent;
	"minecraft:sign": BlockSignComponent;
	sign: BlockSignComponent;
	"minecraft:snowContainer": BlockSnowContainerComponent;
	snowContainer: BlockSnowContainerComponent;
	"minecraft:waterContainer": BlockWaterContainerComponent;
	waterContainer: BlockWaterContainerComponent;
};    

type EntityComponents = {
	addrider: EntityAddRiderComponent;
	"minecraft:addrider": EntityAddRiderComponent;
	ageable: EntityAgeableComponent;
	"minecraft:ageable": EntityAgeableComponent;
	breathable: EntityBreathableComponent;
	"minecraft:breathable": EntityBreathableComponent;
	can_climb: EntityCanClimbComponent;
	"minecraft:can_climb": EntityCanClimbComponent;
	can_fly: EntityCanFlyComponent;
	"minecraft:can_fly": EntityCanFlyComponent;
	can_power_jump: EntityCanPowerJumpComponent;
	"minecraft:can_power_jump": EntityCanPowerJumpComponent;
	color: EntityColorComponent;
	"minecraft:color": EntityColorComponent;
	fire_immune: EntityFireImmuneComponent;
	"minecraft:fire_immune": EntityFireImmuneComponent;
	floats_in_liquid: EntityFloatsInLiquidComponent;
	"minecraft:floats_in_liquid": EntityFloatsInLiquidComponent;
	flying_speed: EntityFlyingSpeedComponent;
	"minecraft:flying_speed": EntityFlyingSpeedComponent;
	friction_modifier: EntityFrictionModifierComponent;
	"minecraft:friction_modifier": EntityFrictionModifierComponent;
	ground_offset: EntityGroundOffsetComponent;
	"minecraft:ground_offset": EntityGroundOffsetComponent;
	healable: EntityHealableComponent;
	"minecraft:healable": EntityHealableComponent;
	health: EntityHealthComponent;
	"minecraft:health": EntityHealthComponent;
	inventory: EntityInventoryComponent;
	"minecraft:inventory": EntityInventoryComponent;
	is_baby: EntityIsBabyComponent;
	"minecraft:is_baby": EntityIsBabyComponent;
	is_charged: EntityIsChargedComponent;
	"minecraft:is_charged": EntityIsChargedComponent;
	is_chested: EntityIsChestedComponent;
	"minecraft:is_chested": EntityIsChestedComponent;
	is_dyeable: EntityIsDyableComponent;
	"minecraft:is_dyeable": EntityIsDyableComponent;
	is_hidden_when_invisible: EntityIsHiddenWhenInvisibleComponent;
	"minecraft:is_hidden_when_invisible": EntityIsHiddenWhenInvisibleComponent;
	is_ignited: EntityIsIgnitedComponent;
	"minecraft:is_ignited": EntityIsIgnitedComponent;
	is_illager_captain: EntityIsIllagerCaptainComponent;
	"minecraft:is_illager_captain": EntityIsIllagerCaptainComponent;
	is_saddled: EntityIsSaddledComponent;
	"minecraft:is_saddled": EntityIsSaddledComponent;
	is_shaking: EntityIsShakingComponent;
	"minecraft:is_shaking": EntityIsShakingComponent;
	is_sheared: EntityIsShearedComponent;
	"minecraft:is_sheared": EntityIsShearedComponent;
	is_stackable: EntityIsStackableComponent;
	"minecraft:is_stackable": EntityIsStackableComponent;
	is_stunned: EntityIsStunnedComponent;
	"minecraft:is_stunned": EntityIsStunnedComponent;
	is_tamed: EntityIsTamedComponent;
	"minecraft:is_tamed": EntityIsTamedComponent;
	lava_movement: EntityLavaMovementComponent;
	"minecraft:lava_movement": EntityLavaMovementComponent;
	leashable: EntityLeashableComponent;
	"minecraft:leashable": EntityLeashableComponent;
	mark_variant: EntityMarkVariantComponent;
	"minecraft:mark_variant": EntityMarkVariantComponent;
	tamemount: EntityMountTamingComponent;
	"minecraft:tamemount": EntityMountTamingComponent;
	"movement.amphibious": EntityMovementAmphibiousComponent;
	"minecraft:movement.amphibious": EntityMovementAmphibiousComponent;
	"movement.basic": EntityMovementBasicComponent;
	"minecraft:movement.basic": EntityMovementBasicComponent;
	movement: EntityMovementComponent;
	"minecraft:movement": EntityMovementComponent;
	"movement.fly": EntityMovementFlyComponent;
	"minecraft:movement.fly": EntityMovementFlyComponent;
	"movement.generic": EntityMovementGenericComponent;
	"minecraft:movement.generic": EntityMovementGenericComponent;
	"movement.glide": EntityMovementGlideComponent;
	"minecraft:movement.glide": EntityMovementGlideComponent;
	"movement.hover": EntityMovementHoverComponent;
	"minecraft:movement.hover": EntityMovementHoverComponent;
	"movement.jump": EntityMovementJumpComponent;
	"minecraft:movement.jump": EntityMovementJumpComponent;
	"movement.skip": EntityMovementSkipComponent;
	"minecraft:movement.skip": EntityMovementSkipComponent;
	"movement.sway": EntityMovementSwayComponent;
	"minecraft:movement.sway": EntityMovementSwayComponent;
	"navigation.climb": EntityNavigationClimbComponent;
	"minecraft:navigation.climb": EntityNavigationClimbComponent;
	"navigation.float": EntityNavigationFloatComponent;
	"minecraft:navigation.float": EntityNavigationFloatComponent;
	"navigation.fly": EntityNavigationFlyComponent;
	"minecraft:navigation.fly": EntityNavigationFlyComponent;
	"navigation.generic": EntityNavigationGenericComponent;
	"minecraft:navigation.generic": EntityNavigationGenericComponent;
	"navigation.hover": EntityNavigationHoverComponent;
	"minecraft:navigation.hover": EntityNavigationHoverComponent;
	"navigation.walk": EntityNavigationWalkComponent;
	"minecraft:navigation.walk": EntityNavigationWalkComponent;
	push_through: EntityPushThroughComponent;
	"minecraft:push_through": EntityPushThroughComponent;
	rideable: EntityRideableComponent;
	"minecraft:rideable": EntityRideableComponent;
	scale: EntityScaleComponent;
	"minecraft:scale": EntityScaleComponent;
	skin_id: EntitySkinIdComponent;
	"minecraft:skin_id": EntitySkinIdComponent;
	strength: EntityStrengthComponent;
	"minecraft:strength": EntityStrengthComponent;
	tameable: EntityTameableComponent;
	"minecraft:tameable": EntityTameableComponent;
	underwater_movement: EntityUnderwaterMovementComponent;
	"minecraft:underwater_movement": EntityUnderwaterMovementComponent;
	variant: EntityVariantComponent;
	"minecraft:variant": EntityVariantComponent;
	wants_jockey: EntityWantsJockeyComponent;
	"minecraft:wants_jockey": EntityWantsJockeyComponent;
	item: EntityItemComponent;
	"minecraft:item": EntityItemComponent;
};

`,
		ending: ``,
	},
});
