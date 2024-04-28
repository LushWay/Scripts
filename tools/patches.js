import fs from 'fs'
import { m, notice, patchPackage, relative, resolve } from './patch-package.js'

patchPackage('@minecraft/server', {
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
     * @param color Whenether to color vector args or not
     */
    static string(a: Vector3, color?: boolean): string;
    /**
     * Returns dot product of two vectors
     */
    static dot(a: Vector3, b: Vector3): number;
    /**
     * Returns whenether vector is valid or not
     * Valid vector don't uses NaN values
     */
    static valid(a: Vector3): boolean;
    /**
     * Alias to
     * \`\`\`js
     * [
     *   Vector.add(a, { x: x, y: y, z: z }),
     *   Vector.add(a, { x: -x, y: -y, z: -z })
     * ]
     * \`\`\`
     * @param x Number to increase vector on x axis.
     * @param y Number to increase vector on y axis. Defaults to x
     * @param z Number to increase vector on z axis. Defaults to x
     */
    static around(a: Vector3, x: number, y?: number, z?: number): [Vector3, Vector3];
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

    /**
     * Checks if one item stack properties are fully equal to another (nameTag and lore)
    */
    is(another: ItemStack): boolean;

    /**
     * Sets nameTag and lore
     */
    setInfo(nameTag: string, description: string): ItemStack;
  `,
    Player: m`
    /**
     * Searches online player by ID
     * @param id - Player ID
     */
    static byId(id: string): Player | undefined;
    /**
     * Searches online player by name
     * @param name - Player name
     */
    static byName(name: string): Player | undefined;

    /**
     * Gets player name from the database by id
     */
    static name(id: string): string | undefined;

    /**
     * Gets ContainerSlot from the player mainhand
     */
    mainhand(): ContainerSlot;

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
	   * Same as {@link System.run} except for auto handling errors
	   */
    delay(callback: () => void): void
    /**
     * Returns a promise that resolves after given ticks time
     * @param time time in ticks
     * @returns Promise that resolves after given ticks time
     */
    sleep(time: number): Promise<void>`,
  },
  replaces: [
    {
      find: 'runCommand(commandString: string): CommandResult',
      replace: m`runCommand(command: string, options?: CommandOptions): number`,
    },
    {
      find: 'runInterval(callback: () => void, tickInterval?: number): number;',
      replace: 'runInterval(callback: () => void, name: string, tickInterval?: number): number;',
    },
    {
      find: 'runTimeout(callback: () => void, tickDelay?: number): number;',
      replace: 'runTimeout(callback: () => void, name: string, tickDelay?: number): number;',
    },
  ],
  additions: {
    beginning: '',
    afterImports: m`
${notice}

/**
 * Dimension names. Used in {@link Dimension.type}
 */
type ShortcutDimensions = 'nether' | 'overworld' | 'end'

/**
 * Used in {@link Dimension.runCommand}
 */
interface CommandOptions {
  showOutput?: boolean
  showError?: boolean
}
`,
    ending: notice,
  },
})

fs.copyFileSync(resolve('@minecraft/vanilla-data'), relative('../scripts/@minecraft/vanilla-data.js'))
