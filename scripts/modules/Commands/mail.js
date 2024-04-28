// TODO(milkcool) Remaining implementation

import { Player } from '@minecraft/server'
import { ActionForm } from 'lib.js'
import { Join } from 'lib/PlayerJoin.js'

new Command({
  name: 'mail',
  description: 'TODO', // TODO
}).executes(ctx => {
  mailMenu(ctx.sender)
})

/**
 * @param {Player} player
 * @param {VoidFunction} [back]
 */
export function mailMenu(player, back) {
  const form = new ActionForm('', '')
  if (back) form.addButtonBack(back)

  // TODO!

  form.show(player)
}

/** @param {Player} player */
function mailLetterMenu(player) {}

/** @param {Player} player */
function mailLetterFilters(player) {}

Join.onMoveAfterJoin.subscribe(({ player }) => {
  // TODO Notify about unread emails
})
