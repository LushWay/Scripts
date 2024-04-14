import { ItemStack, LocationInUnloadedChunkError, MolangVariableMap, Player, Vector } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { ActionForm, EditableLocation, is, util } from 'lib.js'
import { Scene } from 'lib/Scene/scene.js'
import { Temporary } from 'lib/Temporary.js'
import { settingsGroupMenu } from 'modules/Commands/settings.js'

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
function selectCatscene(player) {
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

const editCatsceneItem = new ItemStack('we:tool').setInfo(
  '§r§6> §fСоздать точку',
  'используй предмет чтобы создать точку катсцены'
)

const editCatsceneItemDone = new ItemStack(MinecraftItemTypes.HoneyBottle).setInfo(
  '§r§6> §fСохранить и выйти',
  'используй предмет чтобы выйти из меню катсцены'
)

/**
 * @type {Record<string, (ItemStack | undefined)[]>}
 */
const editingSceneInvs = {}

/**
 * @param {Player} player
 */
function setInv(player) {
  const { container } = player
  if (!container) return
  const arr = []
  for (let i = 0; i < 9; i++) {
    arr[i] = container.getItem(i)
    container.setItem(i, undefined)
  }
  editingSceneInvs[player.id] = arr

  container.setItem(4, editCatsceneItem)
  container.setItem(8, editCatsceneItemDone)
}
/**
 * @param {Player} player
 */
function backInv(player) {
  const { container } = player
  if (!container) return
  const arr = editingSceneInvs[player.id]
  for (let i = 0; i < 9; i++) {
    container.setItem(i, undefined)
    container.setItem(i, arr[i])
  }
  delete editingSceneInvs[player.id]
}

/**
 * @param {Player} player
 * @param {Scene} scene
 */
function editCatscene(player, scene) {
  if (!scene.location.valid) {
    return settingsGroupMenu(player, EditableLocation.key, false, {
      [scene.location.id]: '§6Установите базовую точку катсцены.',
    })
  }

  player.teleport(scene.location)
  scene.dots = []
  setInv(player)

  new Temporary(({ world, system, temp }) => {
    const blueParticle = new MolangVariableMap()
    blueParticle.setColorRGBA('color', {
      red: 0.5,
      green: 0.5,
      blue: 1,
      alpha: 0,
    })

    const whiteParticle = new MolangVariableMap()
    whiteParticle.setColorRGBA('color', {
      red: 1,
      green: 1,
      blue: 1,
      alpha: 0,
    })

    system.runInterval(
      () => {
        if (!scene.location.valid) return
        for (const dot of scene.dots) {
          try {
            player.dimension.spawnParticle('minecraft:wax_particle', Vector.add(scene.location, dot[0]), blueParticle)
          } catch (e) {
            if (e instanceof LocationInUnloadedChunkError) continue
          }
        }
      },
      'scene particle',
      20
    )

    util.catch(async function visialize() {
      if (!scene.location.valid) return
      while (!temp.cleaned) {
        await nextTick
        const vectors = scene.dots.map(e => e[0]).concat(Vector.subtract(Vector.floor(player.location), scene.location))
        for (const location of scene.curve({ vectors, step: 0.5 / 4 })) {
          if (temp.cleaned) return
          try {
            player.dimension.spawnParticle(
              'minecraft:wax_particle',
              Vector.add(scene.location, location),
              whiteParticle
            )

            await system.sleep(~~(scene.intervalTime / 4))
          } catch (e) {
            if (e instanceof LocationInUnloadedChunkError) continue
            util.error(e)
          }
        }
      }
    })

    world.beforeEvents.playerLeave.subscribe(data => {
      if (data.player.id === player.id) temp.cleanup()
    })

    world.beforeEvents.itemUse.subscribe(event => {
      if (event.source.id !== player.id) return

      if (
        event.itemStack.typeId === editCatsceneItem.typeId &&
        event.itemStack.getLore().join() === editCatsceneItem.getLore().join()
      ) {
        event.cancel = true
        system.delay(() => {
          if (!scene.location.valid) return

          scene.dots.push([Vector.subtract(Vector.floor(player.location), scene.location)])
          player.info('Точка добавлена.')
        })
      } else if (event.itemStack.isStackableWith(editCatsceneItemDone)) {
        event.cancel = true
        system.delay(() => {
          backInv(player)
          scene.save()
          temp.cleanup()
          player.success(`Сохранено. Проверить: §7-scene play ${scene.name}`)
        })
      }
    })
  })
}
