import {
  EquipmentSlot,
  ItemStack,
  MolangVariableMap,
  Player,
  Vector,
  system,
  world,
} from '@minecraft/server'
import {
  MinecraftBlockTypes,
  MinecraftItemTypes,
} from '@minecraft/vanilla-data.js'
import 'lib/Class/Net.js'
import { CommandContext } from 'lib/Command/Context.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { MessageForm } from 'lib/Form/MessageForm.js'
import { ModalForm } from 'lib/Form/ModalForm.js'
import { BASE_ITEM_STACK } from 'modules/Gameplay/Survival/base.js'
import { DB, GAME_UTILS, util } from 'smapi.js'
import { APIRequest } from '../lib/Class/Net.js'
import { generateOre } from '../modules/Gameplay/Survival/ore.js'
import './enchant.js'
import './simulatedPlayer.js'

// const player = world.getAllPlayers()[0]
// const targetPosition = { x: 10, y: 10, z: 10 }

// /**
//  * @param {Vector3} a
//  * @param {Vector3} b
//  */
// const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z

// const xMax = 300
// const yMax = 50
// let i = 0
// system.runInterval(() => {
//   const head = player.getHeadLocation()
//   const playerViewDirection = player.getViewDirection()
//   const target = Vector.subtract(
//     Vector.add(targetPosition, { x: 0.5, y: 0.5, z: 0.5 }),
//     head
//   )

//   const distance = Vector.distance(Vector.zero, target)

//   const direction = target.normalized()
//   const relative = Vector.multiply(playerViewDirection, distance)
//   const local = Vector.subtract(relative, target)

//   i++
//   if (i % 20 === 0) {
//     player.dimension.spawnParticle(
//       'minecraft:balloon_gas_particle',
//       Vector.add(head, relative)
//     )
//   }

//   const focalLength = 2 // Assuming a specific distance for screen projection
//   const x = (focalLength * local.x) / (focalLength + local.z)
//   const y = (focalLength * local.y) / (focalLength + local.z)

//   player.onScreenDisplay.setActionBar(
//     util.inspect({
//       target: str(target),
//       distance,
//       direction: str(direction),
//       relative: str(relative),
//       playerViewDirection: str(playerViewDirection),
//       local: str(local),
//       // localX: str(localX),
//       // localY: str(localY),
//       x: x.toFixed(2),
//       // y: y.toFixed(2),
//     })
//   )

//   player.setProperty('sm:marker.x', Math.max(-yMax, Math.min(xMax, x)))
//   player.setProperty('sm:marker.y', Math.max(-yMax, Math.min(yMax, y)))
// }, 'v')
// /**
//  * @param {Vector3} v
//  */
// function str(v) {
//   return `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.z.toFixed(2)}`
// }

/**
 * @type {Record<string, (ctx: CommandContext) => void | Promise<any>>}
 */
const tests = {
  slot(ctx) {
    ctx.reply(ctx.sender.selectedSlot)
  },

  base(ctx) {
    ctx.sender.getComponent('inventory').container.addItem(BASE_ITEM_STACK)
  },
  0() {
    console.log('This is log §6color§r test §lbold')
    console.info('This is info test')
    console.warn('This is warn test')
    util.error(new TypeError('This is error test'))
  },
  1: ctx => {
    const menu = new ActionForm('Action', 'body').addButton('button', () => {
      new ModalForm('ModalForm')
        .addDropdown('drdown', ['op', 'op2'])
        .addSlider('slider', 0, 5, 1)
        .addTextField('textField', 'placeholder', 'defval')
        .addToggle('toggle', false)
        .show(ctx.sender, () => {
          new MessageForm('MessageForm', 'body')
            .setButton1('b1', () => void 0)
            .setButton2('b2', () => void 0)
            .show(ctx.sender)
        })
    })
    menu.show(ctx.sender)
  },
  13: ctx => {
    ctx.reply(util.inspect(ctx.sender.getComponents()))
  },

  41(ctx) {
    world.debug(
      'test41',
      { DB },
      world.overworld.getEntities({ type: DB.ENTITY_IDENTIFIER }).map(e => {
        const { nameTag, location } = e
        const type = e.getDynamicProperty('tableType')
        let data = ''
        const a = e.getComponent('inventory').container
        for (let i = 0; i < 2; i++) {
          if (a.getItem(i)) data += a.getItem(i)?.getLore().join('')
        }

        return {
          nameTag,
          location,
          table: e.getDynamicProperty('tableName'),
          type,
          index: e.getDynamicProperty('index'),
          data,
        }
      })
    )
  },
  45(ctx) {
    const i = MinecraftItemTypes

    const items = [
      i.AcaciaButton,
      i.AcaciaStairs,
      i.Apple,
      i.BannerPattern,
      i.NetheriteAxe,
      i.ZombieHorseSpawnEgg,
      i.Boat,
      i.ChestBoat,
      i.DarkOakBoat,
      i.BlueWool,
      i.CobblestoneWall,
    ]

    for (const item of items) {
      const stack = new ItemStack(item)
      ctx.reply(GAME_UTILS.localizationName(stack))
    }
  },
  marker(ctx) {
    const enabled = ctx.sender.getProperty('sm:marker.enabled')
    const x = ctx.sender.getProperty('sm:marker.x')
    const y = ctx.sender.getProperty('sm:marker.y')
    const scale = ctx.sender.getProperty('sm:marker.scale')
    const texture = ctx.sender.getProperty('sm:marker.texture')

    if (typeof enabled !== 'boolean') return ctx.error('enabled ' + enabled)
    if (
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      typeof scale !== 'number' ||
      typeof texture !== 'number'
    )
      return ctx.error(
        'Not a number:§r\n' + util.inspect({ x, y, scale, texture })
      )

    const player = ctx.sender
    new ModalForm('Marker settings')
      .addToggle('Enabled', enabled)
      .addSlider('x', -150, 150, 1, x)
      .addSlider('y', -150, 150, 1, y)
      .addSlider('scale (0.<value>)', 0, 15, 1, scale * 10)
      .addSlider('texture', 0, 1, 1, texture)
      .show(ctx.sender, (ctx, enabled, x, y, scale, texture) => {
        player.setProperty('sm:marker.enabled', enabled)
        player.setProperty('sm:marker.x', x)
        player.setProperty('sm:marker.y', y)
        player.setProperty('sm:marker.scale', scale / 10)
        player.setProperty('sm:marker.texture', texture)
      })
  },
  particle(ctx) {
    const block = ctx.sender.getBlockFromViewDirection({
      includeLiquidBlocks: false,
      includePassableBlocks: false,
      maxDistance: 50,
    })?.block

    if (!block) return

    // falling_dust explosion_particle explosion_manual glow_particle sparkler_emitter wax_particle

    const variables = new MolangVariableMap()
    variables.setColorRGBA('color', {
      red: 0,
      green: 1,
      blue: 0,
      alpha: 0,
    })

    let c = 0
    const id = system.runInterval(
      () => {
        c++
        block.dimension.spawnParticle(
          'minecraft:wax_particle',
          Vector.add(block.location, { x: 0.5, z: 0.5, y: 1.5 }),
          variables
        )

        if (c >= 6) system.clearRun(id)
      },
      'test',
      10
    )
  },
  async 51(ctx) {
    const res = await APIRequest('playerPlatform', {
      playerName: ctx.sender.name,
    })

    console.warn(util.inspect(res))
  },
  ore(ctx) {
    const rad = Number(ctx.args[1])
    const rad2 = Number(ctx.args[2])
    if (isNaN(rad)) return ctx.error(ctx.args[1] + ' should be number!')
    if (isNaN(rad2)) return ctx.error(ctx.args[2] + ' should be number!')
    // new Shape(SHAPES.sphere, ctx.sender.location, ["air"], rad);

    const orePositions = generateOre(ctx.sender.location, rad, rad2)

    for (const position of orePositions) {
      ctx.sender.dimension
        .getBlock(position)
        ?.setType(MinecraftBlockTypes.Stone)
    }
  },
}

world.afterEvents.entityHitEntity.subscribe(event => {
  if (event.damagingEntity instanceof Player) {
    const axe = event.damagingEntity
      .getComponent('equippable')
      .getEquipmentSlot(EquipmentSlot.Mainhand)
    if (axe && !axe.typeId?.includes('axe')) return

    event.damagingEntity.startItemCooldown('axe', 10)
  }
})

// const i = MinecraftItemTypes;
// new Store({ x: -180, y: 69, z: -144 }, "minecraft:overworld", {
// 	prompt: true,
// })
// 	.addItem(new ItemStack(i.chest, 5), new MoneyCost(30))
// 	.addItem(new ItemStack(i.boat), new MoneyCost(10))
// 	.addItem(new ItemStack(i.apple), new MoneyCost(1));

const c = new Command({
  name: 'test',
  role: 'admin',
})

c.string('number', true).executes(async (ctx, n) => {
  const keys = Object.keys(tests)
  const i = n && keys.includes(n) ? n : 0
  ctx.reply(i)
  util.catch(() => tests[i](ctx), 'Test')
})
