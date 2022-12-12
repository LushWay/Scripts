export class Return {
	/**
	 *
	 * @param {boolean} err
	 * @param {number} successCount
	 * @param {{statusMessage?: string; pos1?: Vector3; pos2?: Vector3; location?: Vector3; fillCount?: number}} data
	 */
	constructor(err = false, successCount = 1, data = {}) {
		this.error = err;
		this.successCount = successCount;
		this.data = data;
	}
}
