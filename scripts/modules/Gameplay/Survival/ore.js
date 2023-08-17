import { Vector } from "@minecraft/server";

/**
 *
 * @param {Vector3} centerPos
 * @param {number} radius
 * @returns
 */
export function generateOre(centerPos, radius) {
	const orePositions = [];

	// Generate a random number of ores within the specified radius of the center position
	const numOres = Math.randomInt(0, radius);
	console.debug({ numOres, radius });

	for (let i = 0; i < numOres; i++) {
		// Generate a random point within a unit sphere
		let randomPoint = new Vector(
			Math.randomInt(-10, 10), // x-coordinate [-1, 1]
			Math.randomInt(-10, 10), // y-coordinate [-1, 1]
			Math.randomInt(-10, 10) // z-coordinate [-1, 1]
		);

		// Scale the normalized random point by the specified radius
		randomPoint = Vector.multiply(randomPoint, Math.randomInt(1, radius));
		console.debug({ randomPoint });

		// Calculate the position of the ore relative to the center
		const orePosition = Vector.add(randomPoint, centerPos);

		// Add the ore position to the array
		orePositions.push(orePosition);
	}

	return orePositions;
}
