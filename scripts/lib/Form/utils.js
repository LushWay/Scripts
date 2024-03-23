import { Player, system } from '@minecraft/server'
import {
  ActionFormData,
  ActionFormResponse,
  FormCancelationReason,
  MessageFormData,
  MessageFormResponse,
  ModalFormData,
  ModalFormResponse,
} from '@minecraft/server-ui'
import { MessageForm } from './MessageForm.js'

/**
 * @template {import("./ActionForm.js").ActionForm | import("./MessageForm.js").MessageForm | import("./ModalForm.js").ModalForm<any> | import("./ChestForm.js").ChestForm} [Form=any]
 *
 */
export class FormCallback {
  /**
   * form that was used in this call
   * @type {Form}
   * @private
   */
  form
  /**
   * player that this form used
   * @type {Player}
   * @private
   */
  player
  /**
   * the function that was called
   * @type {Function | undefined}
   * @private
   */
  callback
  /**
   * Creates a new form callback instance that can be used by
   * buttons, and args to run various functions
   * @param {Form} form form that is used in this call
   * @param {Player} player
   * @param {Form extends import("./ModalForm.js").ModalForm<any> ? Parameters<Form["show"]>[1] : never} [callback]
   */
  constructor(form, player, callback) {
    this.form = form
    this.player = player
    this.callback = callback
  }
  /**
   * Reshows the form and shows the user a error message
   * @param {string} message  error message to show
   * @returns {void}
   */
  error(message) {
    new MessageForm('§cОшибка', message)
      .setButton1('Назад', () => {
        this.form.show(this.player, this.callback)
      })
      .setButton2('§cЗакрыть', () => {})
      .show(this.player)
  }
}
const { UserBusy, UserClosed } = FormCancelationReason

/**
 * It shows a form to a player and if the player is busy, it will try to show the form again until it
 * succeeds or the maximum number of attempts is reached.
 * @param {Pick<ActionFormData, "show"> | Pick<ModalFormData, "show"> | Pick<MessageFormData, "show">} form - The form you want to show.
 * @param {Player} player - The player who will receive the form.
 * @returns  The response from the form.
 */
export async function showForm(form, player) {
  const hold = 5
  for (let i = 1; i <= hold; i++) {
    /** @type {ActionFormResponse | ModalFormResponse | MessageFormResponse} */
    const response = await form.show(player)

    if (response.canceled) {
      if (response.cancelationReason === UserClosed) return false
      if (response.cancelationReason === UserBusy) {
        switch (i) {
          case 1:
            // First attempt failed, maybe chat closed...
            player.closeChat()
            continue

          case 2:
            // Second attempt, tell player to manually close chat...
            player.info('Закрой чат!')
            await system.sleep(20)
            continue

          default:
            await nextTick
            break

          case hold:
            // Last attempt, we cant do anything
            player.fail(`Не удалось открыть форму. Закрой чат или другое меню и попробуй снова`)
            return false
        }
      }
    } else return response
  }
}

export const BUTTON = {
  '<': 'textures/ui/arrow_l_default',
  '>': 'textures/ui/arrow_r_default',
  '+': 'textures/ui/plus',
  '-': 'textures/ui/minus',
  '?': 'textures/ui/how_to_play_button_default_light',
}
