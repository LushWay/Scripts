import { Location, Player } from "@minecraft/server";
import {
  LiteralArgumentType,
  IArgumentType,
  LocationArgumentType,
  StringArgumentType,
  IntegerArgumentType,
  ArrayArgumentType,
  BooleanArgumentType,
} from "./ArgumentTypes.js";
import { CommandCallback } from "./Callback.js";
import { __COMMANDS__ } from "./index.js";
import type { AppendArgument, ICommandData, ArgReturn } from "./types";
export { ArgumentTypes } from "./ArgumentTypes";

export class CClass<
  Callback extends Function = (ctx: CommandCallback) => void
> {
  /**
   * The Arguments on this command
   */
  children: CClass<any>[];

  /**
   * Function to run when this command is called
   */
  callback: Callback;

  constructor(
    public data: ICommandData,
    public type?: IArgumentType,
    public depth: number = 0,
    public parent?: CClass<any>
  );

  /**
   * Adds a ranch to this command of your own type
   * @param type a special type to be added
   * @returns new branch to this command
   */
  argument<T extends IArgumentType>(type: T): ArgReturn<Callback, T["type"]>;

  /**
   * Adds a branch to this command of type string
   * @param name name this argument should have
   * @returns new branch to this command
   */
  string(name: string, optional?: boolean): ArgReturn<Callback, string>;

  /**
   * Adds a branch to this command of type string
   * @param name name this argument should have
   * @returns new branch to this command
   */
  int(name: string, optional?: boolean): ArgReturn<Callback, number>;

  /**
   * Adds a branch to this command of type string
   * @param name name this argument should have
   * @returns new branch to this command
   */
  array<T extends ReadonlyArray<string>>(
    name: string,
    types: T,
    optional?: boolean
  ): ArgReturn<Callback, T[number]>;

  /**
   * Adds a branch to this command of type string
   * @param name name this argument should have
   * @returns new branch to this command
   */
  boolean(name: string, optional?: boolean): ArgReturn<Callback, boolean>;

  /**
   * Adds a argument to this command to add 3 parameters with location types and to return a Location
   * @param name name this argument  should have
   * @returns new branch to this command
   */
  location(name: string, optional?: boolean): ArgReturn<Callback, Location>;

  /**
   * Adds a subCommand to this argument
   * @param name name this literal should have
   * @returns new branch to this command
   */
  literal(data: ICommandData, optional?: boolean): CClass<Callback>;

  /**
   * Registers this command and its apendending arguments
   * @param callback what to run when this command gets called
   */
  executes(callback: Callback): CClass<Callback>;
}
