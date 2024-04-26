// TODO(milkcool) Remaining implementation

import { util } from 'lib.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'

export class Mail {
  static db = new DynamicPropertyDB('mail', {
    /**
     * @type {Record<string, {}>} // TODO Define type
     */
    type: {},
  }).proxy()

  /**
   * Sends the mail for the player
   * @param {string} playerId
   * @param {string} title
   * @param {string} content
   * @param {[]} rewards // example [{type: 'leafs', count: 10}, {type: 'money', count: 1000}, {type: 'item', id: 'customItemIdStoreSomewhere'}]
   */
  static send(playerId, title, content, rewards) {}

  /**
   * @param {string} playerId
   */
  static getUnreadMessagesCount(playerId) {
    // TODO Implement
    return 1
  }
  /**
   * Helper function that returns count surrounded by §c() if it is above 0
   * @param {string} playerId - Id of the player to get messages from
   */
  static unreadBadge(playerId) {
    return util.badge('', this.getUnreadMessagesCount(playerId), { color: '§c' })
  }
}
