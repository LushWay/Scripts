import { ActionForm } from './ActionForm.js'

export class NpcForm extends ActionForm {
  /**
   *
   * @param {string} title
   * @param {string} body
   */
  constructor(title, body = '') {
    super(title, body, '§n§p§c§r')
  }
}
