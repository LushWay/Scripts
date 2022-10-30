import { Player, world } from "@minecraft/server";
type MSValueType =
  | "years"
  | "yrs"
  | "weeks"
  | "days"
  | "hours"
  | "hrs"
  | "minutes"
  | "mins"
  | "seconds"
  | "secs"
  | "milliseconds"
  | "msecs"
  | "ms";

/**
 * Fetch an online players data
 */
export function fetch(playerName: string): Player | null;

export interface IArgumentReturnData<T> {
  /**
   * If this argument matches the value
   */
  success: boolean;
  /**
   * The parsed value that should be passed in command callback
   * if there is no return type this will be null
   */
  value?: T;
}

export abstract class IArgumentType {
  /**
   * The return type
   */
  type: any;
  /**
   * The name that the help for this command will see
   * @example "string"
   * @example "Location"
   * @example "int"
   * @example "number"
   * @example "UnitType"
   */
  typeName: string;
  /**
   * The name this argument is
   */
  name: string = "name";
  /**
   * Argument optionality
   */
  optional: boolean = false;
  /**
   * Checks if a value matches this argument type, also
   * returns the corridsponding type
   */
  matches(value: string): IArgumentReturnData<any>;
  constructor(name: string = "any", optional: boolean);
}

export class LiteralArgumentType implements IArgumentType {
  type: null;
  typeName = "literal";
  matches(value: string): IArgumentReturnData<null>;
  constructor(public name: string = "literal", optional: boolean);
}

export class StringArgumentType implements IArgumentType {
  type: string;
  typeName = "string";
  matches(value: string): IArgumentReturnData<string>;

  constructor(public name: string = "string", optional: boolean);
}

export class IntegerArgumentType implements IArgumentType {
  type: number;
  typeName = "int";
  matches(value: string): IArgumentReturnData<number>;

  constructor(public name: string = "integer", optional: boolean);
}

export class FloatArgumentType implements IArgumentType {
  type: number;
  typeName = "float";
  matches(value: string): IArgumentReturnData<number>;

  constructor(public name: string = "float", optional: boolean);
}

export class LocationArgumentType implements IArgumentType {
  type: string;
  typeName = "location";
  matches(value: string): IArgumentReturnData<string>;

  constructor(public name: string = "location", optional: boolean);
}

export class BooleanArgumentType implements IArgumentType {
  type: boolean;
  typeName = "boolean";
  matches(value: string): IArgumentReturnData<boolean>;

  constructor(public name: string = "boolean", optional: boolean);
}

export class PlayerArgumentType implements IArgumentType {
  type: Player;
  typeName = "playerName";
  matches(value: string): IArgumentReturnData<Player>;

  constructor(public name: string = "player", optional: boolean);
}

export class TargetArgumentType implements IArgumentType {
  type: string;
  typeName = "Target";
  matches(value: string): IArgumentReturnData<string>;

  constructor(public name: string = "target", optional: boolean);
}

export class ArrayArgumentType<T extends ReadonlyArray<string>>
  implements IArgumentType
{
  type: T[number];
  typeName = "string";
  matches(value: string): IArgumentReturnData<string>;

  constructor(public name: string = "array", public types: T, optional: boolean);
}

export class UnitArgumentType implements IArgumentType {
  type: MSValueType;
  typeName = "UnitValueType";
  matches(value: string): IArgumentReturnData<MSValueType>;
  constructor(public name: string, optional: boolean);
}

export const ArgumentTypes = {
  string: StringArgumentType,
  int: IntegerArgumentType,
  float: FloatArgumentType,
  location: LocationArgumentType,
  boolean: BooleanArgumentType,
  player: PlayerArgumentType,
  target: TargetArgumentType,
  array: ArrayArgumentType,
  unit: UnitArgumentType,
};
