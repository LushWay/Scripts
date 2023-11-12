import {
  EquipmentSlot,
  MolangVariableMap,
  Vector,
  system,
} from '@minecraft/server'
import { ActionForm, ModalForm } from 'xapi.js'
import { ListParticles } from '../../../../lib/List/particles.js'
import { ListSounds } from '../../../../lib/List/sounds.js'
import { WorldEditTool } from '../class/Tool.js'

/** @type {Record<string, string[]>} */
const actions = {
  Particle: ListParticles,
  Sound: ListSounds,
}

new WorldEditTool({
  name: 'tool',
  itemStackId: 'we:tool',
  displayName: 'инструмент',
  editToolForm(item, player) {
    const lore = item.getLore()
    new ActionForm(
      '§3Инструмент',
      'Настройте что будет происходить при использовании инструмента.'
    )
      .addButton('Телепорт по взгляду', () => {
        item.nameTag = `§r§a► Телепорт по взгляду`
        lore[0] = 'teleportToView'

        item.setLore(lore)
        player.tell(`§a► §rРежим инструмента изменен на телепорт по взгляду`)
      })
      .addButton('Выполнение команды', () => {
        new ModalForm('§3Инструмент')
          .addTextField('Команда', '/tp @s ^^^5')
          .show(player, (_, command) => {
            if (command.startsWith('/')) command = command.substring(1)

            item.nameTag = `§r§aR► §f${command}`
            lore[0] = 'runCommand'
            lore[1] = command

            item.setLore()
            player.tell(`§aR► §fКоманда: §7${command}`)
          })
      })
      .addButton('Проверка звуков', () => {
        SelectFromArray(ListSounds, '§3Звук', (sound, index) => {
          item.nameTag = `§3Звук`
          lore[0] = 'Sound'
          lore[1] = sound
          lore[2] = index.toString()

          item.setLore()
          player.tell(`§aR► §fЗвук: §7${index} ${sound}`)
        })
      })
      .addButton('Проверка партиклов', () => {
        SelectFromArray(ListParticles, '§3Партикл', (particle, index) => {
          item.nameTag = `§3Партикл`
          lore[0] = 'Particle'
          lore[1] = particle
          lore[2] = index.toString()

          item.setLore()
          player.tell(`§aR► §fПартикл: §7${index} ${particle}`)
        })
      })
      .show(player)

    /**
     *
     * @param {string[]} array
     * @param {string} name
     * @param {(element: string, index: number) => void} callback
     */
    function SelectFromArray(array, name, callback) {
      const none = 'Никакой'
      new ModalForm(name)
        .addDropdown('Из списка', [none, ...array])
        .addTextField('ID Текстом', 'Будет выбран из списка выше')
        .show(player, (ctx, list, text) => {
          let element
          let index
          if (list === none) {
            if (!element) return ctx.error('Выберите из списка или ввeдите ID!')
            element = text
            index = array.indexOf(element)
            if (!index)
              return ctx.error(
                'Неизвестный ID! Убедитесь что он начинается с minecraft:'
              )
          } else {
            element = list
            index = array.indexOf(element)
          }

          callback(element, index)
        })
    }
  },
  onUse(player, item) {
    const lore = item.getLore()
    if (!lore || !lore[0]) return
    const action = lore[0]

    if (action in actions) {
      const list = actions[action]
      const num = Number(lore[2]) + (player.isSneaking ? 1 : -1)
      lore[1] = list[num] ?? lore[1]
      lore[2] = num.toString()
      item.setLore(lore)
    }
    if (action === 'runCommand') {
      player.runCommand(lore[1])
    }
    if (action === 'teleportToView') {
      const dot = player.getBlockFromViewDirection()
      if (dot && dot.block) player.teleport(dot.block)
    }
  },
})

const variables = new MolangVariableMap()

system.runPlayerInterval(
  player => {
    const item = player
      .getComponent('equippable')
      .getEquipmentSlot(EquipmentSlot.Mainhand)

    if (!item || item.typeId !== 'we:tool') return

    const lore = item.getLore()

    if (lore[0] === 'Particle') {
      const hit = player.getBlockFromViewDirection({
        includeLiquidBlocks: false,
        includePassableBlocks: false,
        maxDistance: 50,
      })

      if (!hit) return

      hit.block.dimension.spawnParticle(
        lore[1],
        Vector.add(hit.block.location, { x: 0.5, z: 0.5, y: 1.5 }),
        variables
      )
    }

    if (lore[0] === 'Sound') {
      player.playSound(lore[1])
    }
  },
  'we tool',
  20
)
