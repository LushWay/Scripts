import { ActionForm } from './action'

export class FormNpc extends ActionForm {
  constructor(title: string, body = '') {
    super(title, body, '§n§p§c§r')
  }
}
