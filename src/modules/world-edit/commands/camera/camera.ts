import { EasingType, Player, system, world } from '@minecraft/server'

import { MinecraftCameraPresetsTypes } from '@minecraft/vanilla-data'
import { ActionForm, ModalForm, Vector, inspect } from 'lib'
import { parseArguments, parseLocationArguments } from 'lib/command/utils'

export type CameraDBModes = 'spinAroundPos'

const CAMERA = {
  TYPES: ['minecraft:free'],
  EASE: [EasingType.Linear] as EasingType[],
  MODES: {
    spinAroundPos: 'Крутится вокруг позиции',
  } as Record<CameraDBModes, string>,
}

function setupCameraForm(player: Player, target: Player) {
  const data = target.database

  new ModalForm('§3Настройки камеры §f' + target.name)
    .addDropdownFromObject('Тип', Object.fromEntries(CAMERA.TYPES.map(e => [e, e])))
    .addDropdownFromObject('Переход', EasingType, {
      defaultValue: EasingType.Linear,
    })
    .addSlider('Длительность движения в секундах', 0, 100, 1, 1)

    .addTextField('Координаты центральной позиция (~ разрешены)', '0 ~1 0')

    .addTextField('Позиция куда камера будет повернута (либо игрок в меню ниже)', '0 ~1 0')
    .addDropdownFromObject(
      'Игрок к которому камера будет повернута (либо позиция в меню выше)',

      Object.fromEntries(world.getAllPlayers().map(e => [e.name, e.name])),
      { none: true },
    )
    .addDropdownFromObject('Режим камеры', CAMERA.MODES)
    .addSlider('Радиус при прокрутке вокруг позиции', 0, 100)
    .show(target, (ctx, type, ease, easeTime, rawPos, facingPosRaw, facingPlayer, mode, spinRadius) => {
      const rawPosArray = parseArguments(rawPos)
      const pos = parseLocationArguments([rawPosArray[0], rawPosArray[1], rawPosArray[2]], player)

      if (!pos) return ctx.error('Неправильныe координаты центральной позиции камеры: ' + inspect(rawPosArray))

      let facing
      if (facingPosRaw) {
        const rawPosArray = parseArguments(facingPosRaw)
        facing = parseLocationArguments([rawPosArray[0], rawPosArray[1], rawPosArray[2]], player)
      } else if (facingPlayer && facingPlayer !== ModalForm.arrayDefaultNone) {
        facing = facingPlayer
      }

      if (!facing) return ctx.error('Не указана ни одна позиция для наблюдения камерой')

      data.camera = {
        type,
        ease: EasingType[ease],
        easeTime,
        pos,
        facing,
        mode,
        spinRadius,
      }

      createCameraInteval(target)
      player.success('Сохранено!')
    })
}

// TODO Replace with map
/** @type {Record<string, number>} */
const intervales: Record<string, number> = {}

/** @param {Player} player */
function createCameraInteval(player: Player) {
  if (!player.database.camera) return

  if (intervales[player.id]) system.clearRun(intervales[player.id])

  intervales[player.id] = system.runInterval(
    () => {
      const data = player.database

      if (data.camera) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (data.camera.mode === 'spinAroundPos') {
          data.camera.modeStep ??= 1

          const radius = data.camera.spinRadius
          let step = data.camera.modeStep + 1

          console.debug({ radius, step, data })
          if (step === 360) step = 1

          // Convert degree to radians
          const radians = (step * Math.PI) / 180

          // Calculate x and z coordinates using trigonometry
          const posTo = Vector.add(data.camera.pos, {
            y: 0,
            x: radius * Math.cos(radians),
            z: radius * Math.sin(radians),
          })

          data.camera.modeStep = step

          const command = `camera @s set ${data.camera.type} ease ${data.camera.easeTime} ${
            data.camera.ease
          } pos ${Vector.string(posTo)} facing ${
            typeof data.camera.facing === 'string' ? data.camera.facing : Vector.string(data.camera.facing)
          }`
          console.log(command)
          player.runCommand(command)
          player.camera.setCamera(data.camera.type, {
            easeOptions: {
              easeTime: data.camera.easeTime,
              easeType: data.camera.ease,
            },
          })
        }
      }
    },
    'camera',
    player.database.camera.easeTime * 20,
  )
}

for (const player of world.getAllPlayers()) createCameraInteval(player)
world.afterEvents.playerSpawn.subscribe(({ player }) => createCameraInteval(player))
world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  if (playerId in intervales) {
    system.clearRun(intervales[playerId])
    Reflect.deleteProperty(intervales, playerId)
  }
})

const cmd = new Command('camera').setPermissions('techAdmin')
cmd.executes(ctx => selectPlayerForm(ctx.player))
cmd.overload('reset').executes(ctx => {
  ctx.player.camera.setCamera(MinecraftCameraPresetsTypes.FirstPerson)
  delete ctx.player.database.camera
})

function selectPlayerForm(player: Player) {
  const form = new ActionForm('§3Выбери игрока')

  form.addButton('§3' + player.name, () => setupCameraForm(player, player))

  for (const target of world.getAllPlayers().filter(e => e.id !== player.id)) {
    form.addButton(target.name, () => setupCameraForm(player, target))
  }
  form.show(player)
}
