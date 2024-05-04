// TODO(milkcool) Remaining implementation

import { Player } from '@minecraft/server'
import { util } from 'lib.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { Rewards } from './Rewards'

// A local letter is either a letter sent to a specific player or a "pointer" to a global letter
/**
 * @typedef {{
 *   read: boolean
 *   title?: string
 *   content?: string
 *   rewards?: import('./Rewards').Reward[]
 *   rewardsClaimed: boolean
 *   id?: string
 * }} LocalLetter
 */
/** @typedef {{ letter: LocalLetter; index: number }} LocalLetterIndex */
// A global letter is a letter sent to multiple players
/** @typedef {{ title: string; content: string; rewards: import('./Rewards').Reward[] }} GlobalLetter */
export class Mail {
  static dbPlayers = new DynamicPropertyDB('mailPlayers', {
    /** @type {Record<string, LocalLetter[]>} } */
    type: {},
    defaultValue: name => {
      return []
    },
  }).proxy()

  /** @type {Record<string, GlobalLetter | undefined>} } */
  static dbGlobal = new DynamicPropertyDB('mailGlobal').proxy()

  /** @type {GlobalLetter} */
  static globalNotFound = {
    title: 'Рассылка не найдена',
    content: 'Рассылка не найдена',
    rewards: [],
  }

  /**
   * Sends the mail for the player
   *
   * @param {string} playerId The reciever
   * @param {string} title The letter title
   * @param {string} content The letter content
   * @param {Rewards} rewards The attached rewards
   */
  static send(playerId, title, content, rewards) {
    /** @type {LocalLetter} */
    const letter = {
      read: false,
      title,
      content,
      rewards: rewards.serialize(),
      rewardsClaimed: false,
    }
    this.dbPlayers[playerId].push(letter)
  }

  /**
   * Sends a letter "pointing" at a global message to a player
   *
   * @private
   * @param {string} playerId The reciever
   * @param {string} id The message id to point to
   */
  static sendLink(playerId, id) {
    const letter = {
      read: false,
      id: id,
      rewardsClaimed: false,
    }
    this.dbPlayers[playerId].push(letter)
  }

  /**
   * Sends a mail to multiple players
   *
   * @param {string[]} playerIds The reciever
   * @param {string} title The letter title
   * @param {string} content The letter content
   * @param {Rewards} rewards The attached rewards
   */
  static sendMultiple(playerIds, title, content, rewards) {
    const letter = {
      title,
      content,
      rewards: rewards.serialize(),
    }
    const initialId = new Date().toISOString()
    let postfix = 0
    while (initialId + postfix.toString() in this.dbGlobal) postfix++
    const finalId = initialId + postfix.toString()
    this.dbGlobal[finalId] = letter
    for (const playerId of playerIds) this.sendLink(playerId, finalId)
  }

  /**
   * This function returns the unread messages count for a player
   *
   * @param {string} playerId
   * @returns {number} Unread messages count
   */
  static getUnreadMessagesCount(playerId) {
    return this.dbPlayers[playerId].filter(letter => !letter.read).length
  }

  /**
   * Helper function that returns count surrounded by §c() if it is above 0
   *
   * @param {string} playerId - Id of the player to get messages from
   */
  static unreadBadge(playerId) {
    return util.badge('', this.getUnreadMessagesCount(playerId), { color: '§c' })
  }

  /**
   * Get the GlobalLettet that the LocalLetter is pointing to
   *
   * @param {LocalLetter} letter
   * @returns {GlobalLetter}
   */
  static followLetter(letter) {
    if (!letter.id) return this.globalNotFound
    return this.dbGlobal[letter.id] ?? this.globalNotFound
  }

  /**
   * This function returns the letters array for a player (with indexes)
   *
   * @param {string} playerId The player ID
   * @returns {LocalLetterIndex[]}
   */
  static getLetters(playerId) {
    return this.dbPlayers[playerId].map((letter, index) => ({
      letter,
      index,
    }))
  }

  /**
   * Claim the rewards attached to a letter
   *
   * @param {Player} player The player to give out the rewards to
   * @param {number} index The index of the message in the player's mailbox
   */
  static claimRewards(player, index) {
    const letter = this.dbPlayers[player.id][index]
    if (letter.rewardsClaimed) return
    new Rewards().restore(letter.rewards ?? []).give(player)
    letter.rewardsClaimed = true
    this.dbPlayers[player.id][index] = letter
  }

  /**
   * Marks the message as read
   *
   * @param {string} playerId The ID of the player in whose mailbox is the message that we want to mark as read
   * @param {number} index The index of the message in the player's mailbox
   */
  static readMessage(playerId, index) {
    const letter = this.dbPlayers[playerId][index]
    if (letter.read) return
    letter.read = true
  }

  /**
   * Deletes a message from a player's mailbox
   *
   * @param {Player} player The player in whose mailbox is the message that we want to delete
   * @param {number} index The index of the message in the player's mailbox
   */
  static deleteMessage(player, index) {
    // We want to make sure that our players don't lose any rewards!
    this.claimRewards(player, index)
    this.dbPlayers[player.id].splice(index, 1)
  }
}

