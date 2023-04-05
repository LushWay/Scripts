import { Vector } from "@minecraft/server";
import { addMethod } from "../patcher.js";

/**
 * Vector
 *
 *
 *
 */

addMethod(Vector, "string", (a) => `${a.x} ${a.y} ${a.z}`);

addMethod(Vector, "foreach", function* (a, b) {
	const [xmin, xmax] = a.x < b.x ? [a.x, b.x] : [b.x, a.x];
	const [ymin, ymax] = a.y < b.y ? [a.y, b.y] : [b.y, a.y];
	const [zmin, zmax] = a.z < b.z ? [a.z, b.z] : [b.z, a.z];
	for (let x = xmin; x <= xmax; x++) {
		for (let y = ymin; y <= ymax; y++) {
			for (let z = zmin; z <= zmax; z++) {
				yield { x, y, z };
			}
		}
	}
});

addMethod(Vector, "size", function (a, b) {
	// Each "max vector axis" - "min vector axis" + 1 * other axises
	return (
		((b.x > a.x ? b.x - a.x : a.x - b.x) + 1) *
		((b.y > a.y ? b.y - a.y : a.y - b.y) + 1) *
		((b.z > a.z ? b.z - a.z : a.z - b.z) + 1)
	);
});

addMethod(Vector, "floor", function (loc) {
	return { x: Math.floor(loc.x), y: Math.floor(loc.y), z: Math.floor(loc.z) };
});

addMethod(Vector, "between", function (a, b, c) {
	return (
		c.x >= (a.x < b.x ? a.x : b.x) &&
		c.x <= (a.x > b.x ? a.x : b.x) &&
		c.y >= (a.y < b.y ? a.y : b.y) &&
		c.y <= (a.y > b.y ? a.y : b.y) &&
		c.z >= (a.z < b.z ? a.z : b.z) &&
		c.z <= (a.z > b.z ? a.z : b.z)
	);
});
