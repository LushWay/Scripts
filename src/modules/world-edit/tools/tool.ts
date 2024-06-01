import { MolangVariableMap, system, world } from '@minecraft/server'
import { ActionForm, ModalForm, Vector, util } from 'lib'
import { CustomItems } from 'lib/assets/config'
import { ListParticles } from 'lib/assets/particles'
import { ListSounds } from 'lib/assets/sounds'
import { WorldEditTool } from '../lib/WorldEditTool'

const actions: Record<string, string[]> = {
  Particle: ListParticles,
  Sound: ListSounds,
}

new WorldEditTool({
  name: 'tool',
  itemStackId: CustomItems.WeTool,
  displayName: 'инструмент',

  editToolForm(item, player) {
    const lore = item.getLore()
    new ActionForm('§3Инструмент', 'Настройте, что будет происходить при использовании инструмента.')
      .addButton('Телепорт по взгляду', () => {
        item.nameTag = `§r§a► Телепорт по взгляду`
        lore[0] = 'teleportToView'

        item.setLore(lore)
        player.success(`Режим инструмента изменен на телепорт по взгляду`)
      })
      .addButton('Выполнение команды', () => {
        new ModalForm('§3Инструмент').addTextField('Команда', '/tp @s ^^^5').show(player, (_, command) => {
          if (command.startsWith('/')) command = command.substring(1)

          item.nameTag = `§r§aR► §f${command}`
          lore[0] = 'runCommand'
          lore[1] = command

          item.setLore(lore)
          player.success(`Команда: §7${command}`)
        })
      })
      .addButton('Проверка звуков', () => {
        SelectFromArray(ListSounds, '§3Звук', (sound, index) => {
          item.nameTag = `§r§3Звук`
          lore[0] = 'Sound'
          lore[1] = sound
          lore[2] = index.toString()

          item.setLore(lore)
          player.success(`Звук: §7${index} ${sound}`)
        })
      })
      .addButton('Проверка партиклов', () => {
        SelectFromArray(ListParticles, '§3Партикл', (particle, index) => {
          item.nameTag = `§r§3Партикл`
          lore[0] = 'Particle'
          lore[1] = particle
          lore[2] = index.toString()

          item.setLore(lore)
          player.success(`Партикл: §7${index} ${particle}`)
        })
      })
      .show(player)

    /**
     * @param {string[]} array
     * @param {string} name
     * @param {(element: string, index: number) => void} callback
     */

    function SelectFromArray(array: string[], name: string, callback: (element: string, index: number) => void) {
      new ModalForm(name)

        .addTextField('ID Текстом', 'Будет выбран номер')

        .addTextField('Номер', 'Будет выбран текст')
        .show(player, (ctx, text, num) => {
          const number = parseInt(num)
          if (!isNaN(number) && array[number]) {
            callback(array[number], number)
          } else {
            const index = array.indexOf(text)
            if (index === -1)
              return ctx.error(
                'Неизвестный ID или номер партикла! Убедитесь что ID начинается с minecraft: и партикл состоит только из цифр\n' +
                  util.inspect({ text, num, parsedNum: number }),
              )

            callback(text, index)
          }
        })
    }
  },

  onUse(player) {
    const item = player.mainhand()
    const lore = item.getLore()
    if (!lore || !lore[0]) return
    const action = lore[0]

    if (action in actions) {
      const list = actions[action]
      const num = Number(lore[2]) + (player.isSneaking ? -1 : 1)
      if (!list[num]) return player.fail('Список кончился')
      lore[1] = list[num]
      lore[2] = num.toString()
      player.success(`§7${lore[2]} §f${lore[1]}`)
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

system.runInterval(
  () => {
    for (const player of world.getAllPlayers()) {
      const item = player.mainhand()

      if (!item || item.typeId !== CustomItems.WeWand) return

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
          variables,
        )
      }

      if (lore[0] === 'Sound') {
        player.playSound(lore[1])
      }
    }
  },
  'we tool',
  20,
)
