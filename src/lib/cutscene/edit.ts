/* i18n-ignore */

import { GameMode, ItemStack, MolangVariableMap, Player, system, world } from '@minecraft/server'
import { Vec } from 'lib/vector'

import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Items } from 'lib/assets/custom-items'
import { Cooldown } from 'lib/cooldown'
import { table } from 'lib/database/abstract'
import { deepClone } from 'lib/database/defaults'
import { InventoryStore } from 'lib/database/inventory'
import { askNew, form } from 'lib/form/new'
import { i18n, noI18n } from 'lib/i18n/text'
import { actionGuard, ActionGuardOrder, CANCEL, NEXT } from 'lib/region'
import { Temporary } from 'lib/temporary'
import { util } from 'lib/util'
import { isLocationError, onLoad } from 'lib/utils/game'

// похуй
// eslint-disable-next-line tr/export-boundaries
import { updateBuilderStatus } from 'modules/world-edit/builder'

import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { BUTTON } from 'lib/form/utils'
import { Cutscene } from './cutscene'
import { cutscene as cusceneCommand } from './menu'

export const cutsceneEdit = {
  /**
   * Checks if the cutscene location is valid, then teleports the player to that location and backs up player inventory
   * and cutscene data.
   *
   * @param player - The player who is editing the cutscene.
   * @param cutscene - The cutscene cene to be edited
   */
  editCatcutscene: (player: Player, cutscene: Cutscene): void => {
    throw new Error('Not loaded!')
  },
}

onLoad(() => {
  /** List of items that controls the editing process */
  const controls = {
    play: [
      0,
      new ItemStack(MinecraftItemTypes.Jukebox).setInfo(
        '§r§6> §fВоспроизвести',
        'используйте предмет чтобы воспроизвести катсцену',
      ),
      (player, cutscene, editing) => {
        editing.playing = true

        system.runTimeout(
          () => {
            cutscene.play(player, editing.sections)?.finally(() => {
              editing.playing = false
            })
          },
          'cutscene playe',
          20,
        )
      },
    ],
    editPoint: [
      1,
      new ItemStack(MinecraftItemTypes.AcaciaButton).setInfo(
        '§r§6> §fРедактировать точку',
        'используй предмет, чтобы редактировать точку катсцены.',
      ),
      (player, cutscene, edit) => {
        const closestPoint = getClosestPoint(player, edit)

        if (closestPoint) {
          pointEditMenu({ point: closestPoint.point, edit, cutscene }).show(player)
        } else {
          player.fail('Нет точек')
        }
      },
      (player, cutscene, edit) => {
        const closestPoint = getClosestPoint(player, edit)

        if (closestPoint) {
          particle(player, edit, closestPoint.point, soulParticle)
        }
      },
    ],
    create: [
      3,
      new ItemStack(Items.WeTool).setInfo('§r§6> §fСоздать точку', 'используй предмет, чтобы создать точку катсцены.'),
      (player, cutscene, edit) => {
        if (!edit.sections[0]) cutscene.withNewSection(edit.sections, {})

        cutscene.withNewPoint(player, { sections: edit.sections, warn: true })
        player.info(`Точка добавлена. Точек в секции: §f${edit.sections.at(-1)?.points.length}`)
      },
    ],
    createSection: [
      4,
      new ItemStack(MinecraftItemTypes.ChainCommandBlock).setInfo(
        '§r§3> §fСоздать секцию',
        'используй предмет, чтобы создать секцию катсцены (множество точек).',
      ),
      (player, cutscene, edit) => {
        cutscene.withNewSection(edit.sections, {})
        player.info(`Секция добавлена. Создайте точку внутри секции. Секций всего: §f${edit.sections.length}`)
      },
    ],
    cancel: [
      7,
      new ItemStack(MinecraftItemTypes.Barrier).setInfo(
        '§r§c> §fОтмена',
        'используйте предмет, чтобы отменить редактироание катсцены и вернуть все в исходное состояние.',
      ),
      player => {
        exit(player)
        player.success('Успешно отменено!')
      },
    ],
    saveAndExit: [
      8,
      new ItemStack(MinecraftItemTypes.HoneyBottle).setInfo(
        '§r§6> §fСохранить и выйти',
        'используй предмет, чтобы выйти из меню катсцены.',
      ),
      (player, cutscene, edit) => {
        // Apply changes
        cutscene.sections = edit.sections
        cutscene.save()

        exit(player)
        player.success(i18n`Сохранено. Проверить: ${cusceneCommand}§f play ${cutscene.id}`)
      },
    ],
  } satisfies Record<
    string,
    [
      slot: number,
      item: ItemStack,
      onUse: (player: Player, cutscene: Cutscene, editing: EditingCutscenePlayer) => void,
      onInterval?: (player: Player, cutscene: Cutscene, editing: EditingCutscenePlayer) => void,
    ]
  >

  cutsceneEdit.editCatcutscene = (player, cutscene) => {
    player.setGameMode(GameMode.Creative)
    updateBuilderStatus(player)

    inventoryDb.set(player, InventoryStore.getFrom(player))
    InventoryStore.load({
      from: {
        equipment: {},
        slots: Object.map(controls, (_, [slot, item]) => [slot.toString(), item] as const),
        health: 20,
        xp: 0,
      },
      to: player,
    })

    editingCutscene.set(player.id, {
      cutsceneId: cutscene.id,
      playing: false,
      position: Vec.floor(player.location),
      sections: deepClone(cutscene.sections),
    })
  }

  const playbackList = new Set<string>()

  system.runInterval(
    () => {
      for (const [playerId, editing] of editingCutscene.entries()) {
        if (!editing) continue
        const cutscene = Cutscene.all.get(editing.cutsceneId)
        if (!cutscene) continue
        const player = Player.getById(playerId)
        if (!player) continue

        for (const section of editing.sections) {
          if (!section) continue

          for (const point of section.points) particle(player, editing, point, blueParticle)
        }

        const m = player.mainhand().getItem()
        if (m) {
          for (const [, control, , onInterval] of Object.values(controls)) {
            if (control.is(m)) {
              onInterval?.(player, cutscene, editing)
              break
            }
          }
        }

        const id = player.id + ' ' + cutscene.id
        if (!playbackList.has(id)) {
          playbackList.add(id)
          const controller = { cancel: false }
          new Temporary(({ world, cleanup }) => {
            world.afterEvents.playerLeave.subscribe(event => {
              if (event.playerId === player.id) cleanup()
            })

            util.catch(async function visualize() {
              while (!controller.cancel && player.isValid) {
                await system.sleep(10)

                const editing = editingCutscene.get(player.id)
                if (!editing?.sections) return

                const sections = editing.sections
                // const sections = cutscene.withNewPoint(player, { sections: editing.sections.slice(), warn: true })
                // if (!sections) return

                await cutscene.forEachPoint(
                  point => {
                    if (!Vec.isValid(point)) return
                    const activeItem = player.mainhand().getItem()
                    if (activeItem && controls.editPoint[1].is(activeItem)) return

                    particle(player, editing, point, whiteParticle)
                  },
                  { controller, sections, intervalTime: 1 },
                )
              }
            })
            return {
              cleanup() {
                controller.cancel = true
                playbackList.delete(cutscene.id)
              },
            }
          })
        }
      }
    },
    'cutscene section edges particles',
    30,
  )

  const cooldown = new Cooldown(1000, false, {})

  actionGuard((player, _, ctx) => {
    if (ctx.type !== 'interactWithBlock' && ctx.type !== 'interactWithEntity') return
    const item = ctx.event.itemStack
    if (!item) return

    return onUse(player, item)
  }, ActionGuardOrder.EditMode)

  world.beforeEvents.itemUse.subscribe(event => {
    const cancel = onUse(event.source, event.itemStack)
    if (cancel === CANCEL) event.cancel = true
  })

  function onUse(player: Player, item: ItemStack) {
    const edit = editingCutscene.get(player.id)
    if (!edit) return NEXT

    const cutscene = Cutscene.all.get(edit.cutsceneId)
    if (!cutscene) return NEXT

    for (const [, control, onUse] of Object.values(controls)) {
      if (control.is(item)) {
        if (!cooldown.isExpired(player)) return CANCEL
        return (system.delay(() => onUse(player, cutscene, edit)), CANCEL)
      }
    }
  }

  function particle(
    player: Player,
    edit: Immutable<EditingCutscenePlayer>,
    point: Vector3 | undefined,
    vars: MolangVariableMap,
  ) {
    if (!point || edit.playing) return
    try {
      if (Vec.isInsideRadius(point, player.getHeadLocation(), 1))
        return player.onScreenDisplay.setActionBar('Вы прямо в точке', ActionbarPriority.Highest)
      player.dimension.spawnParticle(
        vars === soulParticle ? 'minecraft:soul_particle' : 'minecraft:wax_particle',
        point,
        vars,
      )
    } catch (e) {
      if (isLocationError(e)) return
      if (e instanceof TypeError && e.message.includes('Native optional type conversion')) return

      console.error(e)
    }
  }

  function exit(player: Player) {
    const edit = editingCutscene.get(player.id)
    if (!edit) return

    const { position } = edit

    editingCutscene.delete(player.id)

    if (player.isValid) {
      player.teleport(position)
      InventoryStore.load({ from: inventoryDb.getOrThrow(player), to: player })
      inventoryDb.delete(player)
    }
  }

  const blueParticle = new MolangVariableMap()
  blueParticle.setColorRGBA('color', {
    red: 0.5,
    green: 0.5,
    blue: 1,
    alpha: 0,
  })

  const redParticle = new MolangVariableMap()
  redParticle.setColorRGBA('color', {
    red: 1,
    green: 0.5,
    blue: 0.5,
    alpha: 0,
  })

  const whiteParticle = new MolangVariableMap()
  whiteParticle.setColorRGBA('color', {
    red: 1,
    green: 1,
    blue: 1,
    alpha: 0,
  })

  const soulParticle = new MolangVariableMap()
  soulParticle.setFloat('particlecount', 5)
  soulParticle.setColorRGBA('color', { red: 1, blue: 0, green: 0, alpha: 0.2 })
  soulParticle.setVector3('direction', { x: 0.3, y: 1, z: 0 })
  soulParticle.setVector3('aabb', { x: 0.3, y: 1, z: 0 })
  soulParticle.setVector3('velocity', { x: 0.3, y: 0.1, z: 0 })
  soulParticle.setVector3('acceleration', { x: 0.3, y: 0.1, z: 0 })
  soulParticle.setFloat('emitter_particles_count', 5)

  //
  soulParticle.setFloat('color_brightness', 1)
  soulParticle.setFloat('max_lifetime', 2)

  // note
  soulParticle.setFloat('r', 1)
  soulParticle.setFloat('g', 0)
  soulParticle.setFloat('b', 0)
  soulParticle.setFloat('a', 0)

  soulParticle.setFloat('is_outside_water', 1)
  soulParticle.setFloat('cloud_radius', 2)
  soulParticle.setFloat('particle_multiplier', 0.5)
  soulParticle.setFloat('num_particles', 5)
  soulParticle.setFloat('variable.emitter_texture_size.u', 8)
  soulParticle.setFloat('variable.emitter_texture_size.v', 8)
  soulParticle.setFloat('variable.pos', 8)
  soulParticle.setFloat('variable.direction_x', 1)
  soulParticle.setFloat('variable.direction_y', 2)
  soulParticle.setFloat('variable.direction_z', 0)
  soulParticle.setSpeedAndDirection('actor', 10, { x: 0, y: 0, z: 0 })
})

interface EditingCutscenePlayer {
  cutsceneId: string
  playing: boolean
  position: Vector3
  sections: Cutscene.Sections
}

/** Map of player id to player editing cutscene */
const editingCutscene = table<EditingCutscenePlayer>('cutsceneEdit')

const inventoryDb = new InventoryStore('cutsceneEdit')

const pointEditMenu = form.params<{ cutscene: Cutscene; edit: EditingCutscenePlayer; point: Cutscene.Point }>(
  (f, { player, self, params: { edit, point, cutscene } }) => {
    const sectionIndex = edit.sections.findIndex(e => e?.points.includes(point))
    const section = edit.sections[sectionIndex]
    const index = section?.points.findIndex(e => e === point)
    if (!section || typeof index === 'undefined' || index === -1) return f.title('ОШибка точки нет')

    const playerPoint = Cutscene.getVector5(player)
    f.title('Точка')
      .body(
        noI18n`${pointToString(point)}\n${pointToString(playerPoint)}\nизменение:\n${pointToString({
          x: point.x - playerPoint.x,
          y: point.y - playerPoint.y,
          z: point.z - playerPoint.z,
          rx: point.rx - playerPoint.rx,
          ry: point.ry - playerPoint.ry,
        })}`,
      )
      .button('Переместиться', () => {
        teleportToPoint(player, point)
      })
      .button('Установить там где я', () => {
        section.points[index] = playerPoint
      })
      .button('Добавить точку', () => {
        section.points.splice(index, 0, playerPoint)
      })
      .button('Следующая', BUTTON['>'], () => {
        const next = section.points[index + 1]
        if (!next) return self()

        teleportToPoint(player, next)
        pointEditMenu({ point: next, edit, cutscene }).show(player)
      })
      .button('Предыдущая', BUTTON['<'], () => {
        const next = section.points[index - 1]
        if (!next) return self()

        teleportToPoint(player, next)
        pointEditMenu({ point: next, edit, cutscene }).show(player)
      })
      .button(noI18n.error`Удалить`, () => {
        section.points.splice(index, 1)
        if (section.points.length === 0) {
          askNew(player, 'Удалить пустую секцию вместе с точкой?', noI18n.error`Удалить`, () => {
            edit.sections.splice(sectionIndex, 1)
          })
        }
      })
  },
)
function teleportToPoint(player: Player, point: Vector5) {
  const headOffset = Vec.subtract(player.getHeadLocation(), player.location)
  player.teleport(Vec.subtract(point, headOffset), { rotation: { x: point.rx, y: point.ry } })
}

function getClosestPoint(player: Player, edit: EditingCutscenePlayer) {
  const loc = player.location
  const closestPoint = edit.sections
    .flatMap(e => e?.points ?? [])
    .map(e => ({ distance: Vec.distance(e, loc), point: e }))
    .sort((a, b) => a.distance - b.distance)[0]
  return closestPoint
}

function pointToString(point: Vector5): Text {
  return noI18n`${Vec.string(Vec.divide(Vec.multiply(point, 1000).floor(), 1000), true)} rx=${point.rx} ry=${point.ry}`
}
