import { Quest } from 'modules/Quests/Quest.js'

export class StoneQuarryInvestigating {
  static quest = new Quest(
    {
      id: 'stone quarry investigating',
      name: 'Каменоломня: Исследование',
      desc: 'Исследование нового города - Каменоломни.',
    },
    (q, p) => {}
  )
}
