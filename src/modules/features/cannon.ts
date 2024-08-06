/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EasingType, system, world } from '@minecraft/server'
import { registerAsync } from '@minecraft/server-gametest'
import {
  MinecraftItemTypes as i,
  MinecraftBlockTypes,
  MinecraftCameraPresetsTypes,
  MinecraftEntityTypes,
} from '@minecraft/vanilla-data'
import { Vector } from 'lib'
import { CustomItemWithBlueprint } from 'lib/rpg/custom-item'
import { TestStructures } from 'test/constants'

export const CannonItem = new CustomItemWithBlueprint('cannon')
  .typeId('lw:cannon_spawn_egg')
  .nameTag('Поставить пушку')
  .lore('Используй этот предмет, чтобы установить пушку')

export const CannonBulletItem = new CustomItemWithBlueprint('cannon bullet')
  .typeId(i.PolishedTuffSlab)
  .nameTag('Снаряд для пушки')
  .lore('Используй этот предмет на пушке, чтобы она выстрелила. Сидя на пушке стрелять нельзя.')

world.beforeEvents.playerInteractWithEntity.subscribe(event => {
  if (event.target.typeId === 'lw:cannon') {
    const mainhand = event.player.mainhand()
    if (CannonBulletItem.isItem(mainhand.getItem())) {
      event.cancel = true
      system.delay(() => {
        if (mainhand.isValid()) {
          if (mainhand.amount === 1) mainhand.setItem(undefined)
          else mainhand.amount--
        }

        if (event.target.isValid()) {
          const view = event.target.getViewDirection()
          const location = Vector.add(Vector.add(event.target.location, Vector.multiply(view, 2.5)), {
            x: 0,
            y: 1.5,
            z: 0,
          })
          const tnt = event.target.dimension.spawnEntity(
            MinecraftEntityTypes.Tnt,
            Vector.add(location, { x: 0, y: -0.5, z: 0 }),
          )
          tnt.applyImpulse(Vector.multiply(view, 3))
          event.target.dimension.playSound('random.explode', location, { volume: 4, pitch: 0.9 })
          event.target.dimension.spawnParticle('minecraft:dragon_dying_explosion', location)
        }
      })
    }
  }
})
world.beforeEvents.playerInteractWithBlock.subscribe(event => {
  if (CannonBulletItem.isItem(event.itemStack)) {
    event.cancel = true
  }
})

registerAsync('ro', 'ro', async test => {
  const xiller = world.getAllPlayers().find(e => !e.isSimulated())!
  const dom = { x: -944.32, y: 64.0, z: 13840.3 }
  await xiller.runCommandAsync('tp @a -944.75 65.00 13864.04 facing -944.32 64.00 13835.30')
  await xiller.runCommandAsync('kill @e[type=lw:cannon]')

  const camera = { x: -946.67, y: 65, z: 13865.94 }
  xiller.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
    facingEntity: xiller,
    location: camera,
  })
  await test.idle(1)
  xiller.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
    facingLocation: dom,
    location: Vector.add(camera, { x: 0, y: 0, z: -15 }),
    easeOptions: {
      easeTime: 8,
      easeType: EasingType.OutCubic,
    },
  })

  await test.idle(20 * 3)

  await test.idle(20 * 4)

  xiller.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
    facingLocation: xiller.location,
    location: Vector.add(xiller.location, { x: 0, y: 2, z: -1 }),
    easeOptions: {
      easeTime: 0,
      easeType: EasingType.Linear,
    },
  })

  await test.idle(20 * 2)

  xiller.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
    facingLocation: dom,
    location: Vector.add(xiller.location, { x: 5, y: 2, z: 5 }),
    easeOptions: {
      easeTime: 1,
      easeType: EasingType.Linear,
    },
  })

  await test.idle(20 * 10)
})
  .structureName(TestStructures.empty)
  .maxTicks(99999999)

new Command('pla').executes(() => {
  world.overworld.setBlockType({ x: -895.47, y: 68.0, z: 13861.5 }, MinecraftBlockTypes.Air)
  world.overworld.setBlockType({ x: -895.47, y: 68.0, z: 13861.5 }, MinecraftBlockTypes.RedstoneBlock)
})
