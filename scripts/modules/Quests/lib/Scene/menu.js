import { Player, Vector } from '@minecraft/server'
import { ActionForm, is } from 'lib.js'
import { Scene } from 'modules/Quests/lib/Scene/Scene.js'
import { editCatscene } from './edit'

new Scene('test')

const scene = new Command({
  name: 'scene',
  description: 'Катсцена',
  role: 'member',
}).executes(ctx => {
  if (is(ctx.sender.id, 'curator')) selectCatscene(ctx.sender)
  else Command.getHelpForCommand(scene, ctx)
})
scene.literal({ name: 'exit', description: 'Выход из катсцены' }).executes(ctx => {
  const scene = Object.values(Scene.instances).find(e => ctx.sender.id in e.playing)
  if (!scene) return ctx.error('Вы не находитесь в катсцене!')

  scene.exit(ctx.sender)
})
scene
  .literal({ name: 'play', role: 'techAdmin' })
  .string('name', false)
  .executes((ctx, name) => {
    if (!(name in Scene.instances)) return ctx.error(Object.keys(Scene.instances).join('\n'))
    Scene.instances[name].play(ctx.sender)
  })

/**
 * @param {Player} player
 */
export function selectCatscene(player) {
  const form = new ActionForm('Катсцены')
  for (const scene of Object.values(Scene.instances)) {
    form.addButton(scene.name, () => manageCatscene(player, scene))
  }
  form.show(player)
}

/**
 * @param {Player} player
 * @param {Scene} scene
 *
 */
function manageCatscene(player, scene) {
  new ActionForm(
    scene.name,
    `Точка катсцены: ${scene.location.valid ? Vector.string(scene.location) : '§8<Не установлена>'}`
  )
    .addButton(ActionForm.backText, () => selectCatscene(player))
    .addButton('Редактировать', () => editCatscene(player, scene))
    .addButton('Просмотреть', () => scene.play(player))
    .show(player)
}
