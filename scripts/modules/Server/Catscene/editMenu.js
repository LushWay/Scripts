import { ItemStack, Player, Vector, system, world } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { optionsGroup } from 'modules/Server/Admin/index.js'
import { Catscene } from 'modules/Server/Catscene/index.js'
import { ActionForm, EditableLocation, util } from 'xapi.js'

new Catscene('test')

new XCommand({
  name: 'scene',
  role: 'admin',
}).executes(ctx => {
  selectCatscene(ctx.sender)
})

/**
 * @param {Player} player
 */
function selectCatscene(player) {
  const form = new ActionForm('Катсцены')
  for (const scene of Object.values(Catscene.instances)) {
    form.addButton(scene.name, () => editCatscene(player, scene))
  }
  form.show(player)
}

const editCatsceneItem = new ItemStack('we:tool').setInfo(
  '§r§6> §fСоздать точку',
  'используй предмет чтобы создать точку катсцены',
)

const editCatsceneItemDone = new ItemStack(
  MinecraftItemTypes.HoneyBottle,
).setInfo(
  '§r§6> §fСохранить и выйти',
  'используй предмет чтобы выйти из меню катсцены',
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

  const handle = world.beforeEvents.itemUse.subscribe(event => {
    if (event.source.id !== player.id) return

    if (
      event.itemStack.typeId === editCatsceneItem.typeId &&
      event.itemStack.getLore().join() === editCatsceneItem.getLore().join()
    ) {
      event.cancel = true
      system.run(() =>
        util.catch(() => {
          scene.dots.push([
            Vector.subtract(Vector.floor(player.location), scene.location),
          ])
          player.tell('§a> §fТочка добавлена.')
          player.playSound('note.pling')
        }),
      )
    } else if (event.itemStack.isStackableWith(editCatsceneItemDone)) {
      event.cancel = true
      system.run(() =>
        util.catch(() => {
          backInv(player)
          scene.save()
          world.beforeEvents.itemUse.unsubscribe(handle)
          player.tell('§a> §fСохранено.')
          player.playSound('note.pling')
        }),
      )
    }
  })
}
