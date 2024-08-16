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
import { MessageForm } from './message'

interface BaseForm {
  show(player: Player, ...args: unknown[]): void
}

export class FormCallback<Form extends BaseForm = BaseForm> {
  /** Creates a new form callback instance that can be used by buttons, and args to run various functions */
  constructor(
    /** Form that was used in this call */
    form: Form,
    /** Player that this form used */
    private player: Player,
    /** The function that was called */
    private back = () => form.show(player),
  ) {}

  /**
   * Reshows the form and shows the user a error message
   *
   * @param message Error message to show
   */
  error(message: string): void {
    new MessageForm('§cОшибка', message)
      .setButton1('Назад', this.back)
      .setButton2('§cЗакрыть', () => {
        // Do nothing
      })
      .show(this.player)
  }
}

const { UserBusy, UserClosed } = FormCancelationReason

/**
 * It shows a form to a player and if the player is busy, it will try to show the form again until it succeeds or the
 * maximum number of attempts is reached.
 *
 * @param {Pick<ActionFormData, 'show'> | Pick<ModalFormData, 'show'> | Pick<MessageFormData, 'show'>} form - The form
 *   you want to show.
 * @param {Player} player - The player who will receive the form.
 * @returns The response from the form.
 */
export async function showForm(
  form: Pick<ActionFormData, 'show'> | Pick<ModalFormData, 'show'> | Pick<MessageFormData, 'show'>,
  player: Player,
) {
  const hold = 5
  for (let i = 1; i <= hold; i++) {
    /** @type {ActionFormResponse | ModalFormResponse | MessageFormResponse} */
    const response: ActionFormResponse | ModalFormResponse | MessageFormResponse = await form.show(player)

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
            await system.sleep(10)
            continue

          default:
            await system.sleep(10)
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
  '<': 'textures/ui/custom/arrow_left',
  '>': 'textures/ui/custom/arrow_right',
  '+': 'textures/ui/custom/plus',
  '-': 'textures/ui/custom/minus',
  '?': 'textures/ui/custom/help',
  'search': 'textures/ui/custom/search',
  'settings': 'textures/ui/custom/settings',
}
