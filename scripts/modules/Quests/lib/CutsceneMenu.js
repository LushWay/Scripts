import { Player } from '@minecraft/server'
import { ActionForm, is } from 'lib.js'
import { ArrayForm } from 'lib/Form/ArrayForm.js'
import { Cutscene } from './Cutscene.js'
import { editCatcutscene } from './CutsceneEdit.js'

new Cutscene('test', 'Test')

const cutscene = new Command('cutscene')
  .setDescription('Катсцена')
  .setPermissions('member')
  .executes(ctx => {
    if (is(ctx.player.id, 'curator')) selectCutsceneMenu(ctx.player)
    else Command.getHelpForCommand(cutscene, ctx)
  })

cutscene
  .overload('exit')
  .setDescription('Выход из катсцены')
  .executes(ctx => {
    const cutscene = Cutscene.getCurrent(ctx.player)
    if (!cutscene) return ctx.error('Вы не находитесь в катсцене!')

    cutscene.exit(ctx.player)
  })

cutscene
  .overload('play')
  .setPermissions('techAdmin')
  .string('name', false)
  .executes((ctx, name) => {
    const cutscene = Cutscene.list[name]
    if (!cutscene) return ctx.error(Object.keys(Cutscene.list).join('\n'))

    cutscene.play(ctx.player)
  })

/** @param {Player} player */
function selectCutsceneMenu(player) {
  new ArrayForm('Катсцены', 'Список доступных для редактирования катсцен:', Object.values(Cutscene.list), {
    filters: {},
    button(cutscene) {
      return [cutscene.id, null, () => manageCutsceneMenu(player, cutscene)]
    },
  }).show(player)
}

/**
 * @param {Player} player
 * @param {Cutscene} cutscene
 */
function manageCutsceneMenu(player, cutscene) {
  new ActionForm(
    cutscene.id,
    `Секций: ${cutscene.sections.length}\nТочек: ${cutscene.sections.reduce(
      (count, section) => (section ? count + section?.points.length : count),
      0,
    )}`,
  )
    .addButton(ActionForm.backText, () => selectCutsceneMenu(player))
    .addButton('Редактировать', () => editCatcutscene(player, cutscene))
    .addButton('Воспроизвести', () => cutscene.play(player))
    .show(player)
}
