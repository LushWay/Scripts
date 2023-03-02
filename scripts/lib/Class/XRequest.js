export class XRequest {
	/**
	 *
	 * @param {string} prefix
	 * @param {string} ID
	 * @returns
	 */
	static genDBkey(prefix, ID) {
		return "REQ_" + prefix + ":" + ID;
	}
	/**
	 * @type {IAbstactDatabase}
	 * @private
	 */
	db;
	/**
	 * @type {string}
	 * @private
	 */
	key;
	/**
	 *
	 * @param {IAbstactDatabase} db DB to store request data
	 * @param {string} prefix
	 * @param {string} ID
	 */
	constructor(db, prefix, ID) {
		this.db = db;
		this.key = XRequest.genDBkey(prefix, ID);
	}
	/**
	 * @returns {Set<string>}
	 */
	get activeRequests() {
		let data = this.db.get(this.key);
		const isEmpty = !(Array.isArray(data) && data[0]);
		if (isEmpty) {
			if (data) this.db.delete(this.key);
			data = [];
		}
		return new Set(data);
	}
	/**
	 *
	 * @param {string} ID
	 */
	createRequest(ID) {
		const requests = this.activeRequests;
		requests.add(ID);
		this.db.set(this.key, [...requests.values()]);
	}
	/**
	 *
	 * @param {string} ID
	 */
	deleteRequest(ID) {
		const requests = this.activeRequests;
		requests.delete(ID);
		this.db.set(this.key, [...requests.values()]);
	}
}
