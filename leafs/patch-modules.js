// @ts-check
import { Player } from "@minecraft/server";
import { m, patchPackage } from "./utils.js";

patchPackage("@minecraft/server", {
	classes: {
		World: m`
    /**
     * See {@link World.sendMessage}
     */
    say(message: (RawMessage | string)[] | RawMessage | string): void;
    /**
     * Logs given message once
     * @param type Type of log
     * @param messages Data to log using world.debug()
     */
    logOnce(type: string, ...messages: any): void;
    /**
     * Prints data using world.say() and parses any object to string using toStr method. 
     */
    debug(...data: any): void;
`,
		Player: m`
    /**
     * See {@link Player.sendMessage}
     */
    tell(message: (RawMessage | string)[] | RawMessage | string): void;
    /**
     * Applies a knock-back to a player in the direction they are facing, like dashing forward
     * @author @wuw.sh
     */
    applyDash(target: Player | Entity, horizontalStrength: number, verticalStrength: number): void;
    `,
	},
	replaces: [
		{
			find: /location: Vector3,\s*\n?\s*dimension: Dimension,\s*\n?\s*xRotation: number,\s*\n?\s*yRotation: number,\s*\n?\s*keepVelocity\?: boolean,/gm,
			replace: `location: Vector3,
        dimension?: Dimension,
        xRotation?: number,
        yRotation?: number,
        keepVelocity?: boolean,`,
		},
		{
			find: "getComponent(componentName: string): BlockComponent | undefined;",
			replace: m`
getComponent<N extends keyof BlockComponents>(
	componentName: N
): BlockComponents[N];`,
		},
		{
			find: "getComponent(componentId: string): EntityComponent;",
			replace: m`
getComponent<N extends keyof EntityComponents>(
  componentName: N
): EntityComponents[N]`,
			all: true,
		},
	],
	additions: {
		beginning: "",
		afterImports: m`
/**
 * This file was automatically edited by 
 * leafs/patch-modules.js
 * 
 * New methods assigments can be finded in 
 * scripts/lib/Setup/prototypes.js 
 */

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
  equipment_inventory: EntityEquipmentInventoryComponent;
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
