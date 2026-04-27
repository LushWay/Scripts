import { Player, system } from '@minecraft/server'
import { PersistentSet } from 'lib/database/persistent-set'
import { ActionForm } from 'lib/form/action'
import { ArrayForm } from 'lib/form/array'
import { ModalForm } from 'lib/form/modal'
import { form } from 'lib/form/new'
import { i18n, noI18n } from 'lib/i18n/text'
import { createLogger } from 'lib/utils/logger'
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
    f.ask(noI18n.error`Удалить`, noI18n.error`Вы уверены, что хотите удалить катсцену?`, () => {
      Cutscene.all.delete(cutscene.id)
      cutscenes.delete(cutscene.id)
      player.success()
    })
  }

  f.button('Export to console', () => {
    console.log(
      `scriptevent lushway_cutscene:import ${JSON.stringify({ id: cutscene.id, sections: cutscene.sections })}`,
    )
  })
})

const logger = createLogger('cutscene import')

system.afterEvents.scriptEventReceive.subscribe(
  ({ id, message, initiator }) => {
    if (id === 'lushway_cutscene:import') {
      const data = JSON.parse(message) as { id: string; sections: Cutscene['sections'] }

      const cutscene = Cutscene.all.get(data.id)

      if (!cutscene) {
        if (initiator instanceof Player) initiator.fail(data.id + ' not found')
        logger.error(data.id + ' not found')
        return
      }

      cutscene.sections = data.sections
      cutscene.save()
      if (initiator instanceof Player) initiator.success(data.id + ' success')
      logger.info(data.id + 'success')
    } else if (id === 'lushway_cutscene:export') {
      const cutscene = Cutscene.all.get(message)

      if (!cutscene) {
        if (initiator instanceof Player) initiator.fail(message + ' not found')
        logger.error(message + ' not found')
        return
      }

      exportCutscene(cutscene)
    }
  },
  { namespaces: ['lushway_cuctscene'] },
)

function exportCutscene(cutscene: Cutscene) {
  logger.info(`scriptevent lushway_cutscene:import ${JSON.stringify({ id: cutscene.id, sections: cutscene.sections })}`)
}
