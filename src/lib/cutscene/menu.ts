import { Entity, Player, system } from '@minecraft/server'
import { PersistentSet } from 'lib/database/persistent-set'
import { formArray } from 'lib/form/array-new'
import { ModalForm } from 'lib/form/modal'
import { form } from 'lib/form/new'
import { BUTTON } from 'lib/form/utils'
import { i18n, noI18n } from 'lib/i18n/text'
import { createLogger } from 'lib/utils/logger'
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

// ========================
//  Unified feedback helper
// ========================
function sendFeedback(
  initiator: Entity | undefined,
  message: string,
  type: 'success' | 'fail' | 'info' | 'error' = 'info',
) {
  // Always log to console
  switch (type) {
    case 'success':
      logger.info(`[SUCCESS] ${message}`)
      break
    case 'fail':
      logger.error(`[FAIL] ${message}`)
      break
    case 'error':
      logger.error(`[ERROR] ${message}`)
      break
    default:
      logger.info(message)
  }
  // If initiator is a player, send an in‑game message
  if (initiator instanceof Player) {
    switch (type) {
      case 'success':
        initiator.success(message)
        break
      case 'fail':
        initiator.fail(message)
        break
      default:
        initiator.sendMessage(message)
    }
  }
}

//  Chunk buffer storage
const importBuffers = new Map<string, string[]>() // key = session ID

//  Event listener
system.afterEvents.scriptEventReceive.subscribe(
  ({ id, message, initiator }) => {
    if (id === 'lushway_cutscene:import') {
      let data
      try {
        data = JSON.parse(message) as { id: string; sections: Cutscene['sections'] }
      } catch (e) {
        sendFeedback(initiator, 'Invalid JSON for import', 'fail')
        return
      }

      const cutscene = Cutscene.all.get(data.id)
      if (!cutscene) {
        sendFeedback(initiator, `Cutscene "${data.id}" not found – import skipped`, 'fail')
        return
      }

      cutscene.sections = data.sections
      cutscene.save()
      sendFeedback(initiator, `Cutscene "${data.id}" imported successfully`, 'success')
    } else if (id === 'lushway_cutscene:export') {
      const cutscene = Cutscene.all.get(message)
      if (!cutscene) {
        sendFeedback(initiator, `Cutscene "${message}" not found`, 'fail')
        return
      }
      exportSingleCutscene(cutscene)
      sendFeedback(initiator, `Export command for "${message}" written to console`, 'success')
    } else if (id === 'lushway_cutscene:export_all') {
      const allCutscenes = Array.from(Cutscene.all.values())
      if (allCutscenes.length === 0) {
        sendFeedback(initiator, 'No cutscenes to export', 'fail')
        return
      }

      const exportData: Record<string, { sections: Cutscene['sections'] }> = {}
      for (const cs of allCutscenes) {
        exportData[cs.id] = { sections: cs.sections }
      }

      const fullJson = JSON.stringify(exportData)
      const sessionId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

      const chunkSize = 1900
      let offset = 0
      let chunkIndex = 0
      while (offset < fullJson.length) {
        const chunk = fullJson.slice(offset, offset + chunkSize)
        // Build the chunk command
        const chunkPayload = JSON.stringify({ session: sessionId, chunk: chunk, index: chunkIndex })
        const command = `scriptevent lushway_cutscene:import_all_chunk ${chunkPayload}`
        logger.info(command) // prints the exact command to run
        offset += chunkSize
        chunkIndex++
      }

      // Finalize command
      const finalizePayload = JSON.stringify({ session: sessionId, totalChunks: chunkIndex })
      const finalizeCommand = `scriptevent lushway_cutscene:import_all_finalize ${finalizePayload}`
      logger.info(finalizeCommand)

      sendFeedback(initiator, `Export complete (${chunkIndex} chunks). Check console for commands.`, 'success')
    } else if (id === 'lushway_cutscene:import_all_chunk') {
      let data
      try {
        data = JSON.parse(message) as { session: string; chunk: string; index?: number }
      } catch (e) {
        sendFeedback(initiator, 'Invalid JSON for import_all_chunk', 'fail')
        return
      }

      const session = data.session || (initiator instanceof Player ? initiator.id : 'console')
      importBuffers.getOrInsert(session, []).push(data.chunk)

      if (typeof data.index === 'number') {
        logger.info(`Chunk ${data.index} received for session ${session}`)
      }
    } else if (id === 'lushway_cutscene:import_all_finalize') {
      let data
      try {
        data = JSON.parse(message) as { session: string; totalChunks?: number }
      } catch (e) {
        sendFeedback(initiator, 'Invalid JSON for import_all_finalize', 'fail')
        return
      }

      const session = data.session || (initiator instanceof Player ? initiator.id : 'console')
      const chunks = importBuffers.get(session)
      if (!chunks || chunks.length === 0) {
        sendFeedback(initiator, `No buffered chunks for session "${session}"`, 'fail')
        return
      }

      const fullJson = chunks.join('')
      importBuffers.delete(session)

      let importData
      try {
        importData = JSON.parse(fullJson) as Record<string, { sections: Cutscene['sections'] }>
      } catch (e) {
        sendFeedback(initiator, 'Failed to parse combined JSON – import aborted', 'fail')
        return
      }

      let successCount = 0
      let skipCount = 0
      for (const [csId, csData] of Object.entries(importData)) {
        const cutscene = Cutscene.all.get(csId)
        if (!cutscene) {
          sendFeedback(initiator, `Cutscene "${csId}" does not exist – skipped`, 'info')
          skipCount++
          continue
        }
        cutscene.sections = csData.sections
        cutscene.save()
        successCount++
      }

      const summary = `Import finished: ${successCount} updated, ${skipCount} skipped (non‑existent or invalid)`
      if (skipCount === 0) sendFeedback(initiator, summary, 'success')
      else sendFeedback(initiator, summary, 'fail')
    }
  },
  { namespaces: ['lushway_cutscene'] },
)

// Helper for single export (unchanged)
function exportSingleCutscene(cutscene: Cutscene) {
  const command = `scriptevent lushway_cutscene:import ${JSON.stringify({ id: cutscene.id, sections: cutscene.sections })}`
  logger.info(command)
}
