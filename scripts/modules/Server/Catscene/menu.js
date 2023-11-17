import {
  ItemStack,
  LocationInUnloadedChunkError,
  Player,
  Vector,
  system,
  world,
} from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { Sounds } from 'lib/List/used-sounds.js'
import { optionsGroup } from 'modules/Server/Admin/index.js'
import { Catscene } from 'modules/Server/Catscene/index.js'
import { ActionForm, EditableLocation, is, util } from 'xapi.js'

new Catscene('test')

const scene = new XCommand({
  name: 'scene',
  description: 'Катсцена',
  role: 'member',
}).executes(ctx => {
  if (is(ctx.sender.id, 'admin')) selectCatscene(ctx.sender)
  else XCommand.getHelpForCommand(scene, ctx)
})

scene
  .literal({ name: 'exit', description: 'Выход из катсцены' })
  .executes(ctx => {
    const scene = Object.values(Catscene.instances).find(
      e => ctx.sender.id in e.playing
    )
    if (!scene) return ctx.error('Вы не находитесь в катсцене!')

    scene.exit(ctx.sender)
  })

scene
  .literal({ name: 'play', role: 'admin' })
  .string('name', false)
  .executes((ctx, name) => {
    if (!(name in Catscene.instances))
      return ctx.error(Object.keys(Catscene.instances).join('\n'))
    Catscene.instances[name].play(ctx.sender)
  })

/**
 * @param {Player} player
 */
function selectCatscene(player) {
  const form = new ActionForm('Катсцены')
  for (const scene of Object.values(Catscene.instances)) {
    form.addButton(scene.name, () => manageCatscene(player, scene))
  }
  form.show(player)
}

/**
 * @param {Player} player
 * @param {Catscene} scene
 *
 */
function manageCatscene(player, scene) {
  new ActionForm(
    scene.name,
    `Точка катсцены: ${
      scene.location.valid
        ? Vector.string(scene.location)
        : '§8<Не установлена>'
    }`
  )
    .addButton('Назад', () => selectCatscene(player))
    .addButton('Редактировать', () => editCatscene(player, scene))
    .addButton('Просмотреть', () => scene.play(player))
    .show(player)
}

const editCatsceneItem = new ItemStack('we:tool').setInfo(
  '§r§6> §fСоздать точку',
  'используй предмет чтобы создать точку катсцены'
)

const editCatsceneItemDone = new ItemStack(
  MinecraftItemTypes.HoneyBottle
).setInfo(
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
  const { container } = player.getComponent('inventory')
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
  const { container } = player.getComponent('inventory')
  const arr = editingSceneInvs[player.id]
  for (let i = 0; i < 9; i++) {
    container.setItem(i, undefined)
    container.setItem(i, arr[i])
  }
  delete editingSceneInvs[player.id]
}

/**
 * @param {Player} player
 * @param {Catscene} scene
 */
function editCatscene(player, scene) {
  if (!scene.location.valid) {
    return optionsGroup(player, EditableLocation.key, 'WORLD', {
      [scene.location.id]: '§6Установите базовую точку катсцены.',
    })
  }

  player.teleport(scene.location)
  scene.dots = []
  setInv(player)

  let stop = false

  function clear() {
    world.beforeEvents.itemUse.unsubscribe(itemUseCallback)
    world.afterEvents.playerLeave.unsubscribe(playerLeaveCallback)
    stop = true
  }

  const interval = system.runInterval(
    () => {
      for (const dot of scene.dots) {
        player.dimension.spawnParticle(
          'minecraft:balloon_gas_particle',
          Vector.add(scene.location, dot[0])
        )
      }
    },
    'scene particle',
    20
  )

  util.catch(async function visialize() {
    while (!stop) {
      await system.sleep(scene.intervalTime)

      const vectors = scene.dots.map(e => e[0]).concat(player.location)
      for (const location of scene.curve({ vectors })) {
        if (stop) return
        try {
          player.dimension.spawnParticle(
            'minecraft:endrod',
            Vector.add(scene.location, location)
          )

          await system.sleep(scene.intervalTime)
        } catch (e) {
          if (e instanceof LocationInUnloadedChunkError) continue
          util.error(e)
        }
      }
    }
  })

  const playerLeaveCallback = world.afterEvents.playerLeave.subscribe(data => {
    if (data.playerId === player.id) clear()
  })

  const itemUseCallback = world.beforeEvents.itemUse.subscribe(event => {
    if (event.source.id !== player.id) return

    if (
      event.itemStack.typeId === editCatsceneItem.typeId &&
      event.itemStack.getLore().join() === editCatsceneItem.getLore().join()
    ) {
      event.cancel = true
      system.delay(() => {
        scene.dots.push([
          Vector.subtract(Vector.floor(player.location), scene.location),
        ])
        player.tell('§a> §fТочка добавлена.')
        player.playSound(Sounds.click)
      })
    } else if (event.itemStack.isStackableWith(editCatsceneItemDone)) {
      event.cancel = true
      system.delay(() => {
        backInv(player)
        scene.save()
        world.beforeEvents.itemUse.unsubscribe(itemUseCallback)
        player.tell('§6> §fСохранено. Проверить: ')
        player.playSound(Sounds.click)
      })
    }
  })
}
