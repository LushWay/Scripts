export const RandomCost = {
	/**
	 * @param {RandomCostMapType} inputMap
	 */
	toArray(inputMap) {
		/** @type {Record<number, number>} */
		const newMap = {};

		for (const [range, rawValue] of Object.entries(inputMap)) {
			const value = parseInt(rawValue.slice(0, -1));

			if (range.includes(".")) {
				// Extract `number...number`
				const match = range.match(/^(\d{1,4})\.\.\.(\d{1,4})$/);

				if (!match) {
					throw new RangeError(`Range '${range}' doesn't matches the pattern.`);
				}
				const [, min, max] = match.map((n) => parseInt(n));

				if (min > max) throw new RangeError("Min cannot be greater than max");
				if (min === max) {
					throw new RangeError(
						"Min cannot be equal to max. Use one number as key instead."
					);
				}

				for (let i = min; i <= max; i++) {
					if (newMap[i]) {
						throw new RangeError(
							`Key '${i}' already exists and has value of ${newMap[i]}%. (Affected range: '${range}')`
						);
					}
					newMap[i] = value;
				}
			} else {
				const key = parseInt(range);
				if (isNaN(key)) throw new TypeError(`Not a number! (${range})`);
				newMap[key] = value;
			}
		}

		/** @type {number[]} */
		const finalMap = new Array(
			Object.values(newMap).reduce((p, c) => p + c, 0)
		);

		let i = 0;
		for (const [key, value] of Object.entries(newMap)) {
			finalMap.fill(Number(key), i, i + value);
			i += value;
		}

		return finalMap;
	},
};
