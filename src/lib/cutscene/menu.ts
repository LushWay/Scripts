import { Player } from '@minecraft/server'
import { ActionForm } from 'lib/form/action'
import { ArrayForm } from 'lib/form/array'
import { form } from 'lib/form/new'
import { l, t } from 'lib/i18n/text'
import { is } from 'lib/roles'
import { Cutscene } from './cutscene'
import { editCatcutscene } from './edit'

new Cutscene('test', 'Test')

export const cutscene = new Command('cutscene')
  .setDescription(t`Катсцена`)
  .setPermissions('member')
  .executes(ctx => {
    if (is(ctx.player.id, 'curator')) selectCutsceneMenu(ctx.player)
    else Command.getHelpForCommand(cutscene, ctx)
  })

cutscene
  .overload('exit')
  .setDescription(t`Выход из катсцены`)
  .executes(ctx => {
    const cutscene = Cutscene.getCurrent(ctx.player)
    if (!cutscene) return ctx.error(t.error`Вы не находитесь в катсцене!`)

    cutscene.exit(ctx.player)
  })

cutscene
  .overload('play')
  .setPermissions('techAdmin')
  .string('name', false)
  .executes((ctx, name) => {
    const cutscene = Cutscene.all.get(name)
    if (!cutscene) return ctx.error([...Cutscene.all.keys()].join('\n'))

    cutscene.play(ctx.player)
  })

function selectCutsceneMenu(player: Player) {
  new ArrayForm(l`Катсцены`, [...Cutscene.all.values()])
    .description(l`Список доступных для редактирования катсцен:`)
    .button(cutscene => [cutscene.id, manageCutsceneMenu({ cutscene }).show])
    .show(player)
}

const manageCutsceneMenu = form.withParams<{ cutscene: Cutscene }>((f, { player, params: { cutscene } }) => {
  const dots = cutscene.sections.reduce((count, section) => (section ? count + section.points.length : count), 0)

  f.title(cutscene.id)
    .body(l`Секций: ${cutscene.sections.length}\nТочек: ${dots}`)
    .button(ActionForm.backText, () => selectCutsceneMenu(player))
    .button(l`Редактировать`, () => editCatcutscene(player, cutscene))
    .button(l`Воспроизвести`, () => cutscene.play(player))
})
