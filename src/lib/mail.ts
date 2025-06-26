import { Player } from '@minecraft/server'

import { Rewards } from 'lib/utils/rewards'
import { defaultLang } from './assets/lang'
import { table } from './database/abstract'
import { Message } from './i18n/message'
import { i18n, noI18n } from './i18n/text'

/** A global letter is a letter sent to multiple players */
interface GlobalLetter {
  title: string
  content: string
  rewards: import('lib/utils/rewards').Rewards.DatabaseEntry[]
}

interface LocalLetterMetadata {
  read: boolean
  rewardsClaimed: boolean
}

/** "pointer" to a global letter */
type LetterLink = LocalLetterMetadata & { id: string }

/** A local letter is a letter sent to a specific player */
type LocalLetter = GlobalLetter & LocalLetterMetadata

export class Mail {
  static dbPlayers = table<(LocalLetter | LetterLink)[]>('mailPlayers', () => [])

  static dbGlobal = table<GlobalLetter>('mailGlobal')

  static globalNotFound: GlobalLetter = { title: noI18n`Not found`, content: noI18n`404 Error`, rewards: [] }

  /**
   * Sends the mail for the player
   *
   * @param playerId The reciever
   * @param title The letter title
   * @param content The letter content
   * @param rewards The attached rewards
   */
  static send(playerId: string, title: Message, content: Message, rewards = new Rewards()) {
    Mail.inform(playerId, title)
    this.dbPlayers
      .get(playerId)
      // TODO Use player offline lang once added

      .push({
        read: false,
        title: title.to(defaultLang),
        content: content.to(defaultLang),
        rewards: rewards.serialize(),
        rewardsClaimed: false,
      })
  }

  private static inform(playerId: string, title: Message) {
    const player = Player.getById(playerId)
    if (player) player.info(i18n`${i18n.header`Почта`}: ${title}, просмотреть: .mail`)
  }

  /**
   * Sends a mail to multiple players
   *
   * @param {string[]} playerIds The recievers
   * @param {string} title The letter title
   * @param {string} content The letter content
   * @param {Rewards} rewards The attached rewards
   */
  static sendMultiple(playerIds: string[], title: Message, content: Message, rewards: Rewards) {
    let id = new Date().toISOString()

    if (id in this.dbGlobal) {
      let postfix = 0
      while (id + postfix.toString() in this.dbGlobal) postfix++
      id = id + postfix.toString()
    }

    // TODO Use player offline lang once added
    this.dbGlobal.set(id, {
      title: title.to(defaultLang),
      content: content.to(defaultLang),
      rewards: rewards.serialize(),
    })

    for (const playerId of playerIds) {
      Mail.inform(playerId, title)
      this.dbPlayers.get(playerId).push({ read: false, rewardsClaimed: false, id })
    }
  }

  /**
   * This function returns the unread messages count for a player
   *
   * @param {string} playerId
   * @returns {number} Unread messages count
   */
  static getUnreadMessagesCount(playerId: string): number {
    return this.dbPlayers.get(playerId).filter(letter => !letter.read).length
  }

  /**
   * Converts letter pointer or local letter to the LocalLetter
   *
   * @param letter - Letter pointer or the local letter
   */
  static toLocalLetter(letter: LetterLink | LocalLetter | undefined) {
    if (!letter) return
    if ('id' in letter) {
      const global = Mail.dbGlobal.get(letter.id)
      if (typeof global === 'undefined') return

      // We cannot use spread syntax here because it will create new
      // object, so canges will not be saved to the database
      return Object.setPrototypeOf(global, letter) as LocalLetter
    } else return letter
  }

  /**
   * Returns the letters array for a player (with indexes)
   *
   * @param {string} playerId The player ID
   */
  static getLetters(playerId: string) {
    const letters = []

    for (const [index, anyLetter] of this.dbPlayers.get(playerId).entries()) {
      const letter = this.toLocalLetter(anyLetter)
      if (letter) letters.push({ letter, index })
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
    const letter = this.toLocalLetter(this.dbPlayers.get(player.id)[index])
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
    const letter = this.dbPlayers.get(playerId)[index]
    if (!letter || letter.read) return

    letter.read = true
  }

  /**
   * Deletes a message from a player's mailbox
   *
   * @param {Player} player The player in whose mailbox is the message that we want to delete
   * @param {number} index The index of the message in the player's mailbox
   */
  static deleteMessage(player: Player, index: number) {
    this.dbPlayers.get(player.id).splice(index, 1)
  }
}
