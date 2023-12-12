import { GameMode, system, Vector, world } from '@minecraft/server'
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as GameTest from '@minecraft/server-gametest'
import {
  MinecraftBlockTypes,
  MinecraftEntityTypes,
} from '@minecraft/vanilla-data.js'
import { GAME_UTILS, util } from 'smapi.js'
const time = 9999999

let name = 'Бот'
/** @type {GameTest.SimulatedPlayer} */
let player
const testLoc = { x: 1000, y: -60, z: 1000 }

GameTest.registerAsync('s', 's', async test => {
  const spawnLoc = { x: 0, y: 3, z: 0 }
  player = test.spawnSimulatedPlayer(spawnLoc, name)
  const id = player.id

  const event = world.afterEvents.entityDie.subscribe(data => {
    if (data.deadEntity.id !== id) return
    test.succeed()
  })

  await test.idle(time - 30)
  world.afterEvents.entityDie.unsubscribe(event)
  test.succeed()
})
  .maxTicks(time)
  .structureName('test:grass')
  .tag('sim')

GameTest.registerAsync('s', 'test', async test => {
  const spawnLoc = { x: 0, y: 3, z: 0 }

  test.setBlockType(MinecraftBlockTypes.Grass, { x: -1, z: 0, y: 1 })
  test.setBlockType(MinecraftBlockTypes.Grass, { x: -2, z: 0, y: 1 })

  player = test.spawnSimulatedPlayer(spawnLoc, name)

  const id = player.id
  const event = world.afterEvents.entityDie.subscribe(data => {
    if (GAME_UTILS.safeGet(data.deadEntity, 'typeId') !== id) return
    test.succeed()
  })

  test.idle(time - 30).then(e => {
    world.afterEvents.entityDie.unsubscribe(event)
    test.succeed()
  })

  // player
  // .getComponent("equippable")
  // .getEquipmentSlot(EquipmentSlot.Mainhand)
  // .setItem(new ItemStack(MinecraftItemTypes.stoneAxe));

  // First move
  player.moveToBlock({ x: -5, z: 0, y: 1 })
  await test.idle(30)

  // Look to door
  player.stopMoving()
  player.lookAtBlock({ x: -5, z: 3, y: 3 })
  await test.idle(40)

  // Use item
  player.attack()
  player.interactWithBlock({ x: -5, z: 2, y: 2 })
  await test.idle(20)

  // Next stage, button
  player.moveToBlock({ x: -7, z: 0, y: 1 })
  await test.idle(20)

  // Look at button
  player.stopMoving()
  player.lookAtBlock({ x: -7, z: 2, y: 3 })
  await test.idle(10)

  // Press button
  player.attack()
  player.interactWithBlock({ x: -7, z: 1, y: 3 })
  await test.idle(40)
  player.stopInteracting()

  // Try to break block
  player.breakBlock({ x: -7, z: 2, y: 3 })
  await test.idle(80)
  player.stopBreakingBlock()

  // Next stage, chest
  player.moveToBlock({ x: -9, z: 0, y: 1 })
  await test.idle(10)

  player.stopMoving()
  player.lookAtBlock({ x: -9, z: 2, y: 2 })
  await test.idle(20)

  player.attack()
  player.interactWithBlock({ x: -9, z: 2, y: 2 })
  await test.idle(40)
  player.stopInteracting()

  // Break chest
  await test.idle(40)
  player.breakBlock({ x: -9, z: 2, y: 2 })
  await test.idle(90)
  player.stopBreakingBlock()
})
  .maxTicks(time)
  .structureName('grass')
  .tag('sim')

new Command({
  name: 'player',
  description: 'Спавнит фэйкового игрока',
  role: 'admin',
  type: 'test',
})
  .string('new name', true)
  .executes(async (ctx, newname) => {
    if (newname) name = newname

    world.overworld.runCommand(
      `execute positioned ${testLoc.x} ${testLoc.y} ${testLoc.z} run gametest create "s:s"`
    )

    world.overworld
      .getBlock(Vector.add(testLoc, { x: 1, y: 0, z: 1 }))
      ?.setType(MinecraftBlockTypes.RedstoneBlock)

    await system.sleep(10)

    player.teleport(ctx.sender.location)
  })

// Many players
GameTest.registerAsync('s', 'm', async test => {
  let succeed = false
  for (let e = 0; e < 5; e++) {
    const player = test.spawnSimulatedPlayer(
      { x: -1, y: 3, z: -1 },
      'Tester (' + e + ')',
      GameMode.adventure
    )
    player.applyImpulse({ x: rd(1, 0), y: rd(1), z: rd(1, 0) })
    await test.idle(Math.random() * 50)
    util.catch(async () => {
      while (!succeed) {
        await test.idle(Math.random() * 40)
        if (!player) break
        const net = player.dimension.getEntities({
          location: player.location,
          type: 'minecraft:player',
          closest: 1,
        })[0]
        if (!net) continue
        player.lookAtEntity(net)
        await test.idle(20)
        // player.stopMoving();
        // world.say(toStr(net.location));
        // player.moveToLocation({ x: net.location.x, net.location.y, y: net.location.z), z: 1 };
        // await test.idle(rd(30, 10));
        // player.attackEntity(net);
      }
    })
  }
  await test.idle(1000)
  succeed = true
  test.succeed()
})
  .maxTicks(1500)
  .structureName('Component:grass5x5')
  .tag('sim')

/**
 *
 * @param {number} max
 * @param {number} min
 * @param {boolean} msg
 * @returns
 */
function rd(max, min = 0, msg = false) {
  if (max == min || max < min) return max

  const rd = Math.round(min + Math.random() * (max - min))
  if (msg) world.say(msg + '\nmax: ' + max + ' min: ' + min + ' rd: ' + rd)
  return rd
}
