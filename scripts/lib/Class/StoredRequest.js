export class StoredRequest {
  /**
   * Generates unique DB key
   * @param {string} prefix
   * @param {string} id
   */
  static genDBkey(prefix, id) {
    return `REQ_${prefix}:${id}`
  }
  /**
   * DB to store requests across the sessions
   * @type {Record<string, string[]>}
   * @private
   */
  db

  /**
   * Unique key for db
   * @type {string}
   * @private
   */
  key

  /**
   * This class is used to help manage requests for specified id in db
   * @param {Record<string, any>} db - DB to store request data
   * @param {string} prefix - Prefix of request type.
   * @param {string} id - May be player.id or any string
   */
  constructor(db, prefix, id) {
    this.db = db
    this.key = StoredRequest.genDBkey(prefix, id)
  }
  /**
   * Returns all active ids
   * @returns {Set<string>}
   */
  get list() {
    let data = this.db[this.key]

    if (!Array.isArray(data)) {
      // Data on this key already exists, and it isn't reqList
      data = []
    }

    return new Set(data)
  }
  /**
   * Adds ID to request list and saves it to db
   * @param {string} id
   */
  createRequest(id) {
    const requests = this.list
    requests.add(id)
    this.db[this.key] = [...requests.values()]
  }
  /**
   * Deletes request from db
   * @param {string} id - ID of request
   */
  deleteRequest(id) {
    const requests = this.list
    requests.delete(id)
    this.db[this.key] = [...requests.values()]
  }
}
