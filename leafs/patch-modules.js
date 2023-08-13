// @ts-check
import { m, patchPackage } from "./utils.js";

patchPackage("@minecraft/server", {
	classes: {
		Dimension: m`
    /**
     * Dimension type shortcut (id without namespace, e.g. "minecraft:")
     */
    type: ShortcutDimensions;
    `,
		Vector: m`
    /**
     * Returns size between two vectors
     */
    static size(a: Vector3, b: Vector3): number;
    /**
     * Floors each vector axis using Math.floor
     */
    static floor(a: Vector3): Vector3;
    /**
	   * Generates a generator of Vector3 objects between two provided Vector3 objects
	   * @param a - starting Vector3 point
	   * @param b - ending Vector3 point
	   * @returns - generator of Vector3 objects
	   */
    static foreach(a: Vector3, b: Vector3): Generator<Vector3, void, unknown>;
    /**
     * Checks if vector c is between a and b
     */
    static between(a: Vector3, b: Vector3, c: Vector3): boolean;
    /**
     * Returns string representation of vector ('x y z')
     */
    static string(a: Vector3): string;
    `,
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
    overworld: Dimension;
    end: Dimension;
    nether: Dimension;
`,
		ItemStack: m`
		    /**
		     * Alias to {@link ItemStack.getComponent}('cooldown')
		     */
		    cooldown: ItemCooldownComponent;
		    /**
		     * Alias to {@link ItemStack.getComponent}('enchantments')
		     */
		    enchantments: ItemEnchantsComponent;
		    /**
		     * Alias to {@link ItemStack.getComponent}('durability')
		     */
		    durability: ItemDurabilityComponent;
		    /**
		     * Alias to {@link ItemStack.getComponent}('food')
		     */
		    food: ItemFoodComponent;
		`,
		Player: m`
		/**
		 * Gets player data from database
		 */
		db(): { save(): void, data: any };
    /**
     * See {@link Player.sendMessage}
     */
    tell(message: (RawMessage | string)[] | RawMessage | string): void;

    /**
     * Applies a knock-back to a player in the direction they are facing, like dashing forward
     * @author @wuw.sh
     */
    applyDash(target: Player | Entity, horizontalStrength: number, verticalStrength: number): void;

    /**
     * Determines player gamemode
     */
    isGamemode(mode: keyof typeof GameMode): boolean;

    /**
     * Turns player into survival, damages (if hp < 1 shows lowHealthMessage), and then returns to previous gamemode
     * @returns True if damaged, false if not and lowHealthMessage was shown
     */
    closeChat(lowHealthMessage?: string): boolean;
    `,
		System: m`
    /**
     * Runs a set of code on an interval for each player.
     * @param callback Functional code that will run when this interval occurs.
     * @param tickInterval An interval of every N ticks that the callback will be
     * called upon.
     * @returns An opaque handle that can be used with the clearRun method
     * to stop the run of this function on an interval.
     */
    runPlayerInterval(callback: (player: Player) => void, name: string, tickInterval?: number): number;
    /**
     * Returns a promise that resolves after given ticks time
     * @param time time in ticks
     * @returns Promise that resolves after given ticks time
     */
    sleep(time: number): Promise<void>`,
	},
	replaces: [
		{
			find: "runCommand(commandString: string): CommandResult",
			replace: m`runCommand(command: string, options?: CommandOptions): number`,
		},
		{
			find: "runInterval(callback: () => void, tickInterval?: number): number;",
			replace:
				"runInterval(callback: () => void, name: string, tickInterval?: number): number;",
		},
		{
			find: "runTimeout(callback: () => void, tickDelay?: number): number;",
			replace:
				"runTimeout(callback: () => void, name: string, tickDelay?: number): number;",
		},
		{
			find: "getComponent(componentName: string): BlockComponent | undefined;",
			replace: m`
getComponent<N extends keyof BlockComponents>(
	componentName: N
): BlockComponents[N];`,
		},
		{
			find: "getComponent(componentId: string): EntityComponent | undefined;",
			replace: m`
getComponent<N extends keyof EntityComponents>(
  componentName: N
): EntityComponents[N]`,
			all: true,
		},
		{
			find: "getComponent(componentId: string): ItemComponent | undefined;",
			replace: m`
      getComponent<N extends keyof ItemComponents>(
        componentName: N
      ): ItemComponents[N]`,
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

/**
 * Dimension names. Used in {@link Dimension.type}
 */
type ShortcutDimensions = "nether" | "overworld" | "end"

/**
 * Used in {@link Dimension.runCommand}
 */
interface CommandOptions {
	showOutput?: boolean;
	showError?: boolean;
}

/**
 * Used in {@link ItemStack.getComponent}
 */
type ItemComponents = {
  cooldown: ItemCooldownComponent;
  "minecraft:cooldown": ItemCooldownComponent;
  enchantments: ItemEnchantsComponent
  "minecraft:enchantments": ItemEnchantsComponent;
  durability: ItemDurabilityComponent
  "minecraft:durability": ItemDurabilityComponent;
  food: ItemFoodComponent;
  "minecraft:food": ItemFoodComponent;
}

/**
 * Used in {@link Block.getComponent}
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

/**
 * Used in {@link Entity.getComponent}
 */
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
	is_dyeable: EntityIsDyeableComponent;
	"minecraft:is_dyeable": EntityIsDyeableComponent;
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
		ending: m`
    
/**
 * This file was automatically edited by 
 * leafs/patch-modules.js
 * 
 * New methods assigments can be finded in 
 * scripts/lib/Setup/prototypes.js 
 */`,
	},
});
