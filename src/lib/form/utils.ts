import { Player, system } from '@minecraft/server'
import {
  ActionFormData,
  ActionFormResponse,
  FormCancelationReason,
  FormRejectError,
  MessageFormData,
  MessageFormResponse,
  ModalFormData,
  ModalFormResponse,
} from '@minecraft/server-ui'
import { i18n } from 'lib/i18n/text'
import { WeakPlayerSet } from 'lib/weak-player-storage'
import { MessageForm } from './message'
import { NewFormCallback, ShowForm } from './new'

interface BaseForm {
  show(player: Player, ...args: unknown[]): void
}

export class FormCallback<Form extends ShowForm | BaseForm = BaseForm> {
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
    new MessageForm(i18n.error`Ошибка`.to(this.player.lang), message)
      .setButton1(i18n`Назад`.to(this.player.lang), this.back)
      .setButton2(i18n.error`Закрыть`.to(this.player.lang), () => {
        // Do nothing
      })
      .show(this.player)
  }
}

/**
 * It shows a form to a player and if the player is busy, it will try to show the form again until it succeeds or the
 * maximum number of attempts is reached.
 *
 * @param form - The form you want to show.
 * @param player - The player who will receive the form.
 * @returns The response from the form.
 */
export async function showForm(
  form: Pick<ActionFormData, 'show'> | Pick<ModalFormData, 'show'> | Pick<MessageFormData, 'show'>,
  player: Player,
) {
  try {
    const hold = 5
    for (let i = 1; i <= hold; i++) {
      const response: ActionFormResponse | ModalFormResponse | MessageFormResponse = await form.show(player)

      if (response.canceled) {
        if (response.cancelationReason === FormCancelationReason.UserClosed) return false
        if (response.cancelationReason === FormCancelationReason.UserBusy) {
          switch (i) {
            case 1:
              // First attempt failed, maybe chat closed...
              player.closeChat()
              continue

            case 2:
              // Second attempt, tell player to manually close chat...
              player.info(i18n`Закрой чат!`)
              await system.sleep(10)
              continue

            default:
              await system.sleep(10)
              break

            case hold:
              // Last attempt, we cant do anything
              player.fail(i18n`Не удалось открыть форму. Закрой чат или другое меню и попробуй снова`)
              return false
          }
        }
      } else return response
    }
  } catch (e) {
    if (e instanceof FormRejectError) {
      console.warn(e)
      return false
    } else throw e
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

type FormShow = (player: Player, ...args: any[]) => Promise<any>

export function debounceMenu<T extends NewFormCallback | FormShow>(menu: T): T {
  const sent = new WeakPlayerSet()

  return (async (player: Player, ...args: Parameters<T>) => {
    if (sent.has(player)) return

    sent.add(player)
    await menu(player, ...args)
    system.runTimeout(() => sent.delete(player), 'debounceMenu reset', 40)
  }) as T
}
