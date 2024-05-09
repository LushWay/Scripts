import { Player } from '@minecraft/server'

import { util } from 'lib'
import { table } from './database/abstract'
import { Rewards } from './rewards'

/** A global letter is a letter sent to multiple players */
type GlobalLetter = {
  title: string
  content: string
  rewards: import('./rewards').Reward[]
}

type LocalLetterMetadata = { read: boolean; rewardsClaimed: boolean }

/** "pointer" to a global letter */
type LetterLink = LocalLetterMetadata & { id: string }

/** A local letter is a letter sent to a specific player */
type LocalLetter = GlobalLetter & LocalLetterMetadata

export class Mail {
  static dbPlayers = table<(LocalLetter | LetterLink)[]>('mailPlayers', () => [])

  static dbGlobal = table<GlobalLetter>('mailGlobal')

  static globalNotFound: GlobalLetter = {
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
  static send(playerId: string, title: string, content: string, rewards: Rewards) {
    this.dbPlayers[playerId].push({
      read: false,
      title,
      content,
      rewards: rewards.serialize(),
      rewardsClaimed: false,
    })
  }

  /**
   * Sends a mail to multiple players
   *
   * @param {string[]} playerIds The recievers
   * @param {string} title The letter title
   * @param {string} content The letter content
   * @param {Rewards} rewards The attached rewards
   */
  static sendMultiple(playerIds: string[], title: string, content: string, rewards: Rewards) {
    let id = new Date().toISOString()

    if (id in this.dbGlobal) {
      let postfix = 0
      while (id + postfix.toString() in this.dbGlobal) postfix++
      id = id + postfix.toString()
    }

    this.dbGlobal[id] = {
      title,
      content,
      rewards: rewards.serialize(),
    }

    for (const playerId of playerIds) {
      this.dbPlayers[playerId].push({
        read: false,
        rewardsClaimed: false,
        id,
      })
    }
  }

  /**
   * This function returns the unread messages count for a player
   *
   * @param {string} playerId
   * @returns {number} Unread messages count
   */
  static getUnreadMessagesCount(playerId: string): number {
    return this.dbPlayers[playerId].filter(letter => !letter.read).length
  }

  /**
   * Helper function that returns count surrounded by §c() if it is above 0
   *
   * @param {string} playerId - Id of the player to get messages from
   */
  static unreadBadge(playerId: string) {
    return util.badge('', this.getUnreadMessagesCount(playerId), { color: '§c' })
  }

  /**
   * Converts letter pointer or local letter to the LocalLetter
   *
   * @param {LetterLink | LocalLetter} letter - Letter pointer or the local letter
   */
  static toLocalLetter(letter: LetterLink | LocalLetter) {
    if ('id' in letter) {
      const global = Mail.dbGlobal[letter.id]
      if (!global) return

      return {
        ...global,
        ...letter,
      }
    } else return letter
  }

  /**
   * Returns the letters array for a player (with indexes)
   *
   * @param {string} playerId The player ID
   */
  static getLetters(playerId: string) {
    const letters = []

    for (const [index, letter] of this.dbPlayers[playerId].entries()) {
      const localLetter = this.toLocalLetter(letter)
      if (localLetter) {
        letters.push({ letter: localLetter, index })
      }
    }

    return letters
  }

  /**
   * Claims the rewards attached to a letter
   *
   * @param {Player} player The player to give out the rewards to
   * @param {number} index The index of the message in the player's mailbox
   */
  static claimRewards(player: Player, index: number) {
    const letter = this.toLocalLetter(this.dbPlayers[player.id][index])
    if (!letter || letter.rewardsClaimed) return

    Rewards.restore(letter.rewards).give(player)
    letter.rewardsClaimed = true
  }

  /**
   * Marks the message as read
   *
   * @param {string} playerId The ID of the player in whose mailbox is the message that we want to mark as read
   * @param {number} index The index of the message in the player's mailbox
   */
  static readMessage(playerId: string, index: number) {
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
  static deleteMessage(player: Player, index: number) {
    this.dbPlayers[player.id].splice(index, 1)
  }
}
