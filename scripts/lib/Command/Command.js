// @ts-nocheck
import {
	LiteralArgumentType,
	LocationArgumentType,
	StringArgumentType,
	IntegerArgumentType,
	ArrayArgumentType,
	BooleanArgumentType,
} from "./ArgumentTypes.js";
import { __COMMANDS__ } from "./index.js";

/** @type {import("./Command.js").XCommand} */
export class XCommand {
	constructor(data, type, depth = 0, parent) {
		if (!data.requires) data.requires = () => true;
		this.data = data;
		this.type = type ?? new LiteralArgumentType(this.data.name);
		this.children = [];
		this.depth = depth;
		this.parent = parent;
		this.callback = null;

		if (depth === 0) __COMMANDS__.push(this);
	}

	argument(type) {
		const cmd = new XCommand(this.data, type, this.depth + 1, this);
		this.children.push(cmd);
		return cmd;
	}

	string(name, optional) {
		return this.argument(new StringArgumentType(name, optional));
	}
	int(name, optional) {
		return this.argument(new IntegerArgumentType(name, optional));
	}

	array(name, types, optional) {
		return this.argument(new ArrayArgumentType(name, types, optional));
	}
	boolean(name, optional) {
		return this.argument(new BooleanArgumentType(name, optional));
	}
	location(name, optional) {
		const cmd = this.argument(new LocationArgumentType(name, optional));
		if (!name.endsWith("*")) {
			const newArg = cmd.location(name + "_y*").location(name + "_z*");
			return newArg;
		}
		return cmd;
	}
	literal(data, optional) {
		const cmd = new XCommand(data, new LiteralArgumentType(data.name, optional), this.depth + 1, this);
		this.children.push(cmd);
		return cmd;
	}

	executes(callback) {
		this.callback = callback;
		return this;
	}
}
