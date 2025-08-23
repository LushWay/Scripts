import { Player } from '@minecraft/server'
import { ActionForm } from 'lib/form/action'
import { ArrayForm } from 'lib/form/array'
import { form } from 'lib/form/new'
import { i18n, noI18n } from 'lib/i18n/text'
import { is } from 'lib/roles'
import { Cutscene } from './cutscene'
import { editCatcutscene } from './edit'

new Cutscene('test', 'Test')

export const cutscene = new Command('cutscene')
  .setDescription(i18n`Катсцена`)
  .setPermissions('member')
  .executes(ctx => {
    if (is(ctx.player.id, 'curator')) selectCutsceneMenu(ctx.player)
    else Command.getHelpForCommand(cutscene, ctx)
  })

cutscene
  .overload('exit')
  .setDescription(i18n`Выход из катсцены`)
  .executes(ctx => {
    const cutscene = Cutscene.getCurrent(ctx.player)
    if (!cutscene) return ctx.error(i18n.error`Вы не находитесь в катсцене!`)

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
  new ArrayForm(noI18n`Катсцены`, [...Cutscene.all.values()])
    .description(noI18n`Список доступных для редактирования катсцен:`)
    .button(cutscene => [cutscene.id, manageCutsceneMenu({ cutscene }).show])
    .show(player)
}

const manageCutsceneMenu = form.params<{ cutscene: Cutscene }>((f, { player, params: { cutscene } }) => {
  const dots = cutscene.sections.reduce((count, section) => (section ? count + section.points.length : count), 0)

  f.title(cutscene.id)
    .body(noI18n`Секций: ${cutscene.sections.length}\nТочек: ${dots}`)
    .button(ActionForm.backText, () => selectCutsceneMenu(player))
    .button(noI18n`Редактировать`, () => editCatcutscene(player, cutscene))
    .button(noI18n`Воспроизвести`, () => cutscene.play(player))
})
