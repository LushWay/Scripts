import { ActionForm } from './action'

export class NpcForm extends ActionForm {
  constructor(title: string, body = '') {
    super(title, body, '§n§p§c§r')
  }
}
