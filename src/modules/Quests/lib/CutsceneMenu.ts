import { Player } from '@minecraft/server'
import { ActionForm, is } from 'lib'
import { ArrayForm } from 'lib/form/array'
import { Cutscene } from './Cutscene'
import { editCatcutscene } from './CutsceneEdit'

new Cutscene('test', 'Test')

// @ts-expect-error TS(2304) FIXME: Cannot find name 'Command'.
const cutscene = new Command('cutscene')
  .setDescription('Катсцена')
  .setPermissions('member')
  .executes(ctx => {
    if (is(ctx.player.id, 'curator')) selectCutsceneMenu(ctx.player)
    // @ts-expect-error TS(2304) FIXME: Cannot find name 'Command'.
    else Command.getHelpForCommand(cutscene, ctx)
  })

cutscene
  .overload('exit')
  .setDescription('Выход из катсцены')
  .executes(ctx => {
    const cutscene = Cutscene.getCurrent(ctx.player)
    if (!cutscene) return ctx.error('Вы не находитесь в катсцене!')

    // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
    cutscene.exit(ctx.player)
  })

cutscene
  .overload('play')
  .setPermissions('techAdmin')
  .string('name', false)
  .executes((ctx, name) => {
    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
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
    // @ts-expect-error TS(2554) FIXME: Expected 3 arguments, but got 2.
    .addButton(ActionForm.backText, () => selectCutsceneMenu(player))
    // @ts-expect-error TS(2554) FIXME: Expected 3 arguments, but got 2.
    .addButton('Редактировать', () => editCatcutscene(player, cutscene))
    // @ts-expect-error TS(2554) FIXME: Expected 3 arguments, but got 2.
    .addButton('Воспроизвести', () => cutscene.play(player))
    .show(player)
}
