import { Player } from '@minecraft/server'
import { ActionForm } from 'lib/form/action'
import { ArrayForm } from 'lib/form/array'
import { is } from 'lib/roles'
import { t } from 'lib/text'
import { Cutscene } from './cutscene'
import { editCatcutscene } from './edit'

new Cutscene('test', 'Test')

export const cutscene = new Command('cutscene')
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
    const cutscene = Cutscene.all.get(name)
    if (!cutscene) return ctx.error(Object.keys(Cutscene.all).join('\n'))

    cutscene.play(ctx.player)
  })

function selectCutsceneMenu(player: Player) {
  new ArrayForm('Катсцены', [...Cutscene.all.values()])
    .description('Список доступных для редактирования катсцен:')
    .button(cutscene => [cutscene.id, () => manageCutsceneMenu(player, cutscene)])
    .show(player)
}

function manageCutsceneMenu(player: Player, cutscene: Cutscene) {
  const dots = cutscene.sections.reduce((count, section) => (section ? count + section.points.length : count), 0)

  new ActionForm(cutscene.id, t`Секций: ${cutscene.sections.length}\nТочек: ${dots}`)
    .addButton(ActionForm.backText, () => selectCutsceneMenu(player))
    .addButton('Редактировать', () => editCatcutscene(player, cutscene))
    .addButton('Воспроизвести', () => cutscene.play(player))
    .show(player)
}
