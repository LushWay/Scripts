import { ContainerSlot, MolangVariableMap, Player, system, world } from '@minecraft/server'
import { ActionForm, ModalForm, Vec, inspect } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { ListParticles } from 'lib/assets/particles'
import { ListSounds } from 'lib/assets/sounds'
import { WorldEditTool } from '../lib/world-edit-tool'

const actions: Record<string, string[]> = {
  Particle: ListParticles,
  Sound: ListSounds,
}

class Tool extends WorldEditTool {
  id = 'tool'
  typeId = Items.WeTool
  name = 'инструмент'
  storageSchema: any

  editToolForm(slot: ContainerSlot, player: Player) {
    const lore = slot.getLore()
    new ActionForm('§3Инструмент', 'Настройте, что будет происходить при использовании инструмента.')
      .button('Телепорт по взгляду', () => {
        slot.nameTag = `§r§a► Телепорт по взгляду`
        lore[0] = 'teleportToView'

        slot.setLore(lore)
        player.success(`Режим инструмента изменен на телепорт по взгляду`)
      })
      .button('Выполнение команды', () => {
        new ModalForm('§3Инструмент').addTextField('Команда', '/tp @s ^^^5').show(player, (_, command) => {
          if (command.startsWith('/')) command = command.substring(1)

          slot.nameTag = `§r§aR► §f${command}`
          lore[0] = 'runCommand'
          lore[1] = command

          slot.setLore(lore)
          player.success(`Команда: §7${command}`)
        })
      })
      .button('Проверка звуков', () => {
        selectFromArray(ListSounds, '§3Звук', (sound, index) => {
          slot.nameTag = `§r§3Звук`
          lore[0] = 'Sound'
          lore[1] = sound
          lore[2] = index.toString()

          slot.setLore(lore)
          player.success(`Звук: §7${index} ${sound}`)
        })
      })
      .button('Проверка партиклов', () => {
        selectFromArray(ListParticles, '§3Партикл', (particle, index) => {
          slot.nameTag = `§r§3Партикл`
          lore[0] = 'Particle'
          lore[1] = particle
          lore[2] = index.toString()

          slot.setLore(lore)
          player.success(`Партикл: §7${index} ${particle}`)
        })
      })
      .show(player)

    function selectFromArray(array: string[], name: string, callback: (element: string, index: number) => void) {
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
                  inspect({ text, num, parsedNum: number }),
              )

            callback(text, index)
          }
        })
    }
  }

  onUse(player: Player) {
    const item = player.mainhand()
    const lore = item.getLore()
    if (!lore[0]) return
    const action = lore[0]

    if (action in actions) {
      const list = actions[action]
      const num = Number(lore[2]) + (player.isSneaking ? -1 : 1)
      if (!list?.[num]) return player.fail('Список кончился')
      lore[1] = list[num]
      lore[2] = num.toString()
      player.success(`§7${lore[2]} §f${lore[1]}`)
      item.setLore(lore)
    }
    if (action === 'runCommand' && lore[1]) {
      player.runCommand(lore[1])
    }
    if (action === 'teleportToView') {
      const dot = player.getBlockFromViewDirection()
      if (dot?.block) player.teleport(dot.block)
    }
  }

  constructor() {
    super()
    const variables = new MolangVariableMap()

    system.runInterval(
      () => {
        for (const player of world.getAllPlayers()) {
          const item = player.mainhand()
          if (item.typeId !== Items.WeWand) return

          const lore = item.getLore()

          if (!lore[1]) return

          if (lore[0] === 'Particle') {
            const hit = player.getBlockFromViewDirection({
              includeLiquidBlocks: false,
              includePassableBlocks: false,
              maxDistance: 50,
            })

            if (!hit) return

            hit.block.dimension.spawnParticle(
              lore[1],
              Vec.add(hit.block.location, { x: 0.5, z: 0.5, y: 1.5 }),
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
  }
}

new Tool()
