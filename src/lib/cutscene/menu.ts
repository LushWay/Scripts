import { Player, system } from '@minecraft/server'
import { PersistentSet } from 'lib/database/persistent-set'
import { formArray } from 'lib/form/array-new'
import { ModalForm } from 'lib/form/modal'
import { form } from 'lib/form/new'
import { BUTTON } from 'lib/form/utils'
import { i18n, noI18n } from 'lib/i18n/text'
import { createLogger } from 'lib/utils/logger'
import { Vec } from 'lib/vector'
import { Cutscene } from './cutscene'
import { cutsceneEdit } from './edit'

export const cutscene = new Command('cutscene')
  .setDescription(i18n`Катсцена`)
  .setPermissions('helper')
  .executes(ctx => selectCutsceneMenu.command(ctx))

const cutscenes = new PersistentSet<string>('cutscenesIds')

cutscenes.onLoad(() => {
  for (const c of cutscenes) new Cutscene(c, c)
})

const selectCutsceneMenu = formArray((f, { player }) => {
  f.title(noI18n`Катсцены`)
  f.body(noI18n`Список доступных для редактирования катсцен:`)

  f.array([...Cutscene.all.values()])
    .addCustomButtonBeforeArray(f => {
      const cutscene = Cutscene.getCurrent(player)
      if (cutscene) {
        f.button(noI18n`Выйти из текущей сцены`, () => cutscene.exit(player))
      }

      f.button(noI18n`Добавить`, BUTTON['+'], () => {
        new ModalForm(noI18n`Добавить катсцену`).addTextField(noI18n`Название`, '').show(player, (ctx, id) => {
          if (cutscenes.has(id)) ctx.error(noI18n`Имя занято`)
          cutscenes.add(id)
          const cutscene = new Cutscene(id, id)
          manageCutsceneMenu({ cutscene }).show(player)
        })
      })
    })
    .button(
      cutscene =>
        [
          noI18n`${cutscene.id} ${cutscene.sections.length}/${cutscene.sections.reduce((acc, v) => acc + (v?.points.length ?? 0), 0)}\n${cutscene.displayName}`,
          manageCutsceneMenu({ cutscene }).show,
        ] as const,
    )
})

const manageCutsceneMenu = form.params<{ cutscene: Cutscene }>((f, { player, params: { cutscene } }) => {
  const dots = cutscene.sections.reduce((count, section) => (section ? count + section.points.length : count), 0)
  const created = cutscenes.has(cutscene.id)

  f.title(cutscene.id)
    .body(noI18n`Секций: ${cutscene.sections.length}\nТочек: ${dots}`)
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
      logger.info(data.id + ' success')
    } else if (id === 'lushway_cutscene:export') {
      const cutscene = Cutscene.all.get(message)

      if (!cutscene) {
        if (initiator instanceof Player) initiator.fail(message + ' not found')
        logger.error(message + ' not found')
        return
      }

      exportCutscene(cutscene)
    } else if (id === 'lushway_cutscene:export_all') {
      const allCutscenes = Array.from(Cutscene.all.values())
      if (allCutscenes.length === 0) {
        const msg = 'No cutscenes found to export'
        if (initiator instanceof Player) initiator.fail(msg)
        logger.error(msg)
        return
      }

      for (const cs of allCutscenes) {
        exportCutscene(cs)
      }

      if (initiator instanceof Player) {
        initiator.success(`Exported ${allCutscenes.length} cutscene(s). Check console logs.`)
      }
    } else if (id === 'lushway_cutscene:import_all') {
      let data
      try {
        data = JSON.parse(message) as Record<string, { sections: Cutscene['sections'] }>
      } catch (e) {
        const errMsg = 'Invalid JSON for import_all'
        if (initiator instanceof Player) initiator.fail(errMsg)
        logger.error(errMsg)
        return
      }

      let successCount = 0
      let failCount = 0

      for (const [csId, csData] of Object.entries(data)) {
        // Validate required fields
        if (!csId || !Array.isArray(csData.sections)) {
          logger.warn(`Skipping invalid entry for id "${csId}" – missing sections`)
          failCount++
          continue
        }

        const cutscene = Cutscene.all.get(csId)
        if (!cutscene) {
          logger.warn('No cutscene', csId)
          failCount++
        } else {
          cutscene.sections = csData.sections
          cutscene.save()
          successCount++
        }
      }

      const summary = `Import complete: ${successCount} succeeded, ${failCount} failed`
      if (initiator instanceof Player) {
        if (failCount === 0) initiator.success(summary)
        else initiator.fail(summary)
      }
      logger.info(summary)
    }
  },
  { namespaces: ['lushway_cutscene'] },
)

function exportCutscene(cutscene: Cutscene) {
  if (cutscene.sections[0]?.points.length)
    logger.info(
      `scriptevent lushway_cutscene:import ${JSON.stringify({ id: cutscene.id, sections: cutscene.sections.map(e => ({ points: e?.points.map(e => ({ ...e, ...Vec.divide(Vec.multiply(e, 1).floor(), 1) })) })) })}`,
    )
}
