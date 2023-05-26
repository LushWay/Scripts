export class StoredRequest {
	/**
	 * Generates unique DB key
	 * @param {string} prefix
	 * @param {string} ID
	 */
	static genDBkey(prefix, ID) {
		return `REQ_${prefix}:${ID}`;
	}
	/**
	 * DB to store requests across the sessions
	 * @type {AbstactDatabase}
	 * @private
	 */
	db;

	/**
	 * Unique key for db
	 * @type {string}
	 * @private
	 */
	key;

	/**
	 * This class is used to help manage requests for specified id in db
	 * @param {AbstactDatabase} db - DB to store request data
	 * @param {string} prefix - Prefix of request type.
	 * @param {string} ID - May be player.id or any string
	 */
	constructor(db, prefix, ID) {
		this.db = db;
		this.key = StoredRequest.genDBkey(prefix, ID);
	}
	/**
	 * Returns all active ids
	 * @returns {Set<string>}
	 */
	get list() {
		let data = this.db.get(this.key);

		if (!Array.isArray(data)) {
			// Data on this key already exists, and it isnt reqList
			if (data) this.db.set(this.key, data);

			data = [];
		}

		return new Set(data);
	}
	/**
	 * Adds ID to request list and saves it to db
	 * @param {string} ID
	 */
	createRequest(ID) {
		const requests = this.list;
		requests.add(ID);
		this.db.set(this.key, [...requests.values()]);
	}
	/**
	 * Deletes request from db
	 * @param {string} ID - ID of request
	 */
	deleteRequest(ID) {
		const requests = this.list;
		requests.delete(ID);
		this.db.set(this.key, [...requests.values()]);
	}
}
