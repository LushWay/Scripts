/**
 * @param {RandomCost} inputMap
 */
export function getRandomiserForCost(inputMap) {
	/** @type {Array<number>} */
	const newMap = [];

	for (const [range, rawValue] of Object.entries(inputMap)) {
		const value = parseInt(rawValue.substring(0, rawValue.length - 1));

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

	const finalMap = new Array(newMap.reduce((p, c) => p + c, 0));

	let i = 0;
	for (const [key, value] of newMap.entries()) {
		finalMap.fill(key, i, i + value);
		i += value;
	}
	/**
	 * @returns {number}
	 */
	return function getElement() {
		return finalMap[Math.randomInt(0, finalMap.length)];
	};
}
// TEST
// console.log("START");
// let time = Date.now();
// Math.randomInt = (min, max) => ~~(min + Math.random() * (max - min));

// const map = new RandomCostMap({
// 	"0...2": "60%",
// 	"3...4": "39%",
// 	5: "1%",
// });

// /** @type {Record<number, number>} */
// const results = {};

// for (let i = 0; i < 1000; i++) {
// 	const e = map.getElement();
// 	results[e] ??= 0;
// 	results[e]++;
// }

// console.log("END IN ", Date.now() - time);
// console.log(JSON.stringify(results, null, 2));
