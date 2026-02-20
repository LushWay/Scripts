import { Player } from '@minecraft/server'
import { PersistentSet } from 'lib/database/persistent-set'
import { ActionForm } from 'lib/form/action'
import { ArrayForm } from 'lib/form/array'
import { ModalForm } from 'lib/form/modal'
import { form } from 'lib/form/new'
import { i18n, noI18n } from 'lib/i18n/text'
import { Cutscene } from './cutscene'
import { cutsceneEdit } from './edit'

new Cutscene('test', 'Test')

export const cutscene = new Command('cutscene')
  .setDescription(i18n`Катсцена`)
  .setPermissions('helper')
  .executes(ctx => {
    selectCutsceneMenu(ctx.player)
  })

const cutscenes = new PersistentSet<string>('cutscenesIds')

cutscenes.onLoad(() => {
  for (const c of cutscenes) new Cutscene(c, c)
})

function selectCutsceneMenu(player: Player) {
  new ArrayForm(noI18n`Катсцены`, [...Cutscene.all.values()])
    .addCustomButtonBeforeArray(f => {
      const cutscene = Cutscene.getCurrent(player)
      if (cutscene) {
        f.button('Выйти из текущей сцены', () => cutscene.exit(player))
      }

      f.button('Добавить', () => {
        new ModalForm('Добавить катсцену').addTextField('Название', '').show(player, (ctx, id) => {
          if (cutscenes.has(id)) ctx.error('Имя занято')
          cutscenes.add(id)
          const cutscene = new Cutscene(id, id)
          manageCutsceneMenu({ cutscene }).show(player)
        })
      })
    })
    .description(noI18n`Список доступных для редактирования катсцен:`)
    .button(cutscene => [cutscene.id, manageCutsceneMenu({ cutscene }).show])
    .show(player)
}

const manageCutsceneMenu = form.params<{ cutscene: Cutscene }>((f, { player, params: { cutscene } }) => {
  const dots = cutscene.sections.reduce((count, section) => (section ? count + section.points.length : count), 0)
  const created = cutscenes.has(cutscene.id)

  f.title(cutscene.id)
    .body(noI18n`Секций: ${cutscene.sections.length}\nТочек: ${dots}`)
    .button(ActionForm.backText, () => selectCutsceneMenu(player))
    .button(noI18n`Редактировать`, () => cutsceneEdit.editCatcutscene(player, cutscene))
    .button(noI18n`Воспроизвести`, () => cutscene.play(player))

  if (created) {
    f.ask(noI18n.error`Удалить`, noI18n.error`Удалить`, () => {
      Cutscene.all.delete(cutscene.id)
      cutscenes.delete(cutscene.id)
      player.success()
    })
  }
})
