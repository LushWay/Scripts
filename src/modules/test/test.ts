/* i18n-ignore */
/* eslint-disable */

import { ItemStack, MolangVariableMap, Player, ScriptEventSource, system, world } from '@minecraft/server'
import {
  MinecraftBlockTypes,
  MinecraftCameraPresetsTypes,
  MinecraftEnchantmentTypes,
  MinecraftEntityTypes,
  MinecraftItemTypes,
  MinecraftPotionEffectTypes,
} from '@minecraft/vanilla-data'
import {
  Airdrop,
  BUTTON,
  ChestForm,
  DatabaseUtils,
  FormNpc,
  LootTable,
  Mail,
  Region,
  RoadRegion,
  SafeAreaRegion,
  Settings,
  Vec,
  getAuxOrTexture,
  getAuxTextureOrPotionAux,
  inspect,
  is,
  isKeyof,
  restorePlayerCamera,
  util,
} from 'lib'
import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { CommandContext } from 'lib/command/context'
import { parseArguments } from 'lib/command/utils'
import { Cutscene } from 'lib/cutscene'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { ActionForm } from 'lib/form/action'
import { MessageForm } from 'lib/form/message'
import { ModalForm } from 'lib/form/modal'
import { form } from 'lib/form/new'
import { i18n, noI18n } from 'lib/i18n/text'
import { MineareaRegion } from 'lib/region/kinds/minearea'
import { Compass } from 'lib/rpg/menu'
import { setMinimapNpcPosition } from 'lib/rpg/minimap'
import { toPoint } from 'lib/utils/point'
import { Rewards } from 'lib/utils/rewards'
import { requestAirdrop } from 'modules/places/anarchy/airdrop'
import { BaseRegion } from 'modules/places/base/region'
import { skipForBlending } from 'modules/world-edit/utils/blending'
import loot from '../quests/learning/airdrop'
import './enchant'
import './load-chunks'
import './minimap'
import './properties'
// import './simulatedPlayer'

// There you can create simple one time tests taht will be run using .test <name> command
//
// also note that each test function recieves command context as argument, so if your test
// interacts with a player, use ctx.sender
//
// please add new test on the top
//
// use public tests with caution, they're available to the all players!
// other tests are available only for tech admins and above

const tests: Record<
  string,
  (ctx: Pick<CommandContext, 'args' | 'player' | 'reply' | 'error'>) => void | Promise<void>
> = {
  loot(ctx) {
    const lootTableName = ctx.args[1] ?? ''
    const lootTable = LootTable.instances.get(lootTableName)
    if (typeof lootTable === 'undefined')
      return ctx.error(
        `${lootTableName} - unknown loot table. All tables:\n${[...LootTable.instances.keys()].join('\n')}`,
      )

    const b = ctx.player.dimension.getBlock(ctx.player.location)
    const block = b?.typeId === MinecraftBlockTypes.Chest ? b : b?.below()
    if (!block) return ctx.error('No block under feet')
    const inventory = block.getComponent('inventory')
    if (!inventory?.container) return ctx.error('No inventory in block')
    lootTable.fillContainer(inventory.container)
  },

  na(ctx) {
    ctx.player.mainhand().nameTag = '%enchantment.mending'
    ctx.player.mainhand().setLore(['%enchantment.mending'])
  },

  async breakMine(ctx) {
    const regions = MineareaRegion.getManyAt(ctx.player)
    for (const region of regions) {
      ctx.reply('R' + region.name)
      await region.area.forEachVector((vector, isIn, dimension) => {
        if (!isIn) return
        const block = dimension.getBlock(vector)
        if (!block) return

        region.onBlockBreak(ctx.player, {
          block,
          cancel: false,
          dimension: dimension,
          itemStack: undefined,
          player: ctx.player,
        })
        block.setType(MinecraftBlockTypes.Air)
      }, 1000)
    }
  },

  regionNear(ctx) {
    const distance = Number(ctx.args[1] ?? '5')
    const near = Region.chunkQuery.getNear(ctx.player, distance)

    console.log(near.length)
    ctx.player.success('' + near.length)
  },

  duplicates() {
    const keys = new Set<string>()
    for (const chunk of Region.chunkQuery.getStorage('overworld')) {
      // @ts-expect-error aaaaaaaaaaaaaaaaaaaaaaaaaaa
      const key = chunk.getKey()
      if (keys.has(key)) {
        console.log('Duplicate!', key)
        continue
      }
      keys.add(key)
    }
  },
  chunks() {
    console.log(Region.chunkQuery.storageSize())
  },
  chunksNear(ctx) {
    const distance = Number(ctx.args[1] ?? '5')
    const near = Region.chunkQuery
      .getChunksNear(toPoint(ctx.player), distance)
      .map(e => `xfrom: ${e.from.x} zfrom: ${e.from.z} x: ${e.indexX}, z: ${e.indexZ}`)
    console.log(near)
    ctx.player.success('' + near.length)
  },

  chunkQuery(ctx) {
    console.log(Region.chunkQuery.storageSize(ctx.player.dimension.type))
  },

  distanceQuery(ctx) {
    const a = { x: 10341, y: -4121, z: 14 }
    const b = { x: -1341, y: 121, z: 0 }
    const r = 424
    bench(
      ctx.player,
      'distance',
      1000000,
      [
        [() => Vec.distance(a, b) <= r, 'Vector.distance'],
        [
          () => {
            return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 <= r ** 2
          },
          'sqrt',
        ],
        [
          () => {
            return (a.x - b.x) ** 2 + (a.z - b.z) ** 2 <= r ** 2
          },
          'sqrt xz',
        ],
      ],
      e => e,
      10000,
    ).then(results => {
      console.log([...results])
    })
  },

  regionQuery(ctx) {
    bench<unknown[]>(
      ctx.player,
      'region',
      1000,
      [Region, RoadRegion, SafeAreaRegion, BaseRegion]
        // [Region]
        .map(type => {
          const label = noI18n`${type.name} ${type.getAll().length} - `
          return [
            [() => type.getManyAt(ctx.player, false), label + 'getManyAt old'],
            [() => type.getManyAt(ctx.player, true), label + 'getManyAt §lnew'],
            [() => type.getNear(ctx.player, 10, true), label + 'getNear old'],
            [() => type.getNear(ctx.player, 10, false), label + 'getNear §lnew'],
          ] as [VoidFunction, string][]
        })
        .flat(),
      e => e.length,
      50,
    )
  },
  potionAux(ctx) {
    for (const effect of Object.values(MinecraftPotionEffectTypes)) {
      const item = ItemStack.createPotion({ effect })
      getAuxTextureOrPotionAux(item)
    }
  },
  blending(ctx) {
    const lore = {
      blending: Number(ctx.args[1] ?? '7'),
      radius: 10,
      zone: -4,
      height: 0,
      factor: Number(ctx.args[2] ?? '20'),
    }
    const player = ctx.player
    const { radius, blending, height, zone: offset, factor } = lore

    const center = Vec.floor(player.location)
    const from = Vec.add(center, new Vec(-radius, offset - height, -radius))
    const to = Vec.add(center, new Vec(radius, offset, radius))

    player.onScreenDisplay.setActionBar(
      noI18n`Radius: ${lore.radius} Blending: ${lore.blending} Factor: ${lore.factor}`,
      ActionbarPriority.High,
    )

    for (const vector of Vec.forEach(from, to)) {
      const block = world.overworld.getBlock(vector)
      if (!block) continue

      block.setType(MinecraftBlockTypes.GrassBlock)
    }

    for (const vector of Vec.forEach(from, to)) {
      if (skipForBlending(lore, { vector, center })) continue

      const block = world.overworld.getBlock(vector)
      if (!block) continue

      block.setType(MinecraftBlockTypes.Stone)
    }
  },
  rotation(ctx) {
    ctx.reply(i18n`${ctx.player.getRotation()}`)
  },
  air(ctx) {
    const airdrop = new Airdrop({ loot })
    airdrop.spawn(Vec.add(ctx.player.location, { x: 0, y: 30, z: 0 }))
    system.runInterval(
      () => {
        if (!airdrop.chest?.isValid) return

        airdrop.showParticleTrace()
      },
      'testsa',
      20,
    )
  },
  scen(ctx) {
    const player = ctx.player

    player.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
      location: Vec.add(player.getHeadLocation(), Vec.multiply(player.getViewDirection(), 20)),
    })

    system.runTimeout(
      () => {
        restorePlayerCamera(player)
      },
      'test',
      20,
    )
  },
  settings(ctx) {
    const getSettings = Settings.player('test', 'Test', {
      dropdown: {
        name: 'Name',
        description: 'Description',
        value: [
          ['A', 'a'],
          ['B', 'b'],
          ['C', 'c'],
        ],
      },
      toggle: { name: 'Toggle', description: 'Desc', value: true },
      string: { name: 'String', description: 'Desc', value: '' },
    })

    console.log(getSettings(ctx.player))
  },
  f(ctx) {
    const form = new ActionForm('MENUS', 'Menu body', '§c§u§s§r§f')
    form.button('Test!', BUTTON['?'], () => false)
    form.button('Test!', BUTTON['?'], () => false)
    form.button('Test!', BUTTON['?'], () => false)
    form.button('Test!', BUTTON['?'], () => false)
    form.button('Test!', BUTTON['?'], () => false)
    form.show(ctx.player)
  },
  title(ctx) {
    ctx.player.onScreenDisplay.setHudTitle('FFf', {
      subtitle: 'AAAA',
      fadeInDuration: 0,
      stayDuration: 20 * 4,
      fadeOutDuration: 20,
    })
  },
  compass(ctx) {
    const [entity] = ctx.player.dimension.getEntities({ type: MinecraftEntityTypes.Cow, closest: 1 })
    if (!entity) return ctx.error('No entity!')
    ctx.player.teleport(entity.location)

    system.runInterval(
      () => {
        Compass.setFor(ctx.player, entity.location)
      },
      'compass',
      2,
    )
  },
  chest(ctx) {
    util.catch(() => {
      system.runInterval(
        () => {
          const minecarts = ctx.player.dimension.getEntities({
            type: CustomEntityTypes.Loot,
            maxDistance: 20,
            location: ctx.player.location,
          })
          for (const minecart of minecarts) {
            Airdrop.prototype.showParticleTrace(minecart)
          }
        },
        'minecart test',
        40,
      )
    })
  },
  slot(ctx) {
    ctx.reply(ctx.player.selectedSlotIndex)
  },

  logs() {
    console.log('This is log §6color§r test §lbold')
    console.info('This is info test')
    console.warn('This is warn test')
    console.error(new TypeError('This is error test'))
  },
  forms: ctx => {
    const menu = new ActionForm('Action', 'body').button('button', () => {
      new ModalForm('ModalForm')
        .addDropdown('drdown', ['op', 'op2'])
        .addSlider('slider', 0, 5, 1)
        .addTextField('textField', 'placeholder', 'defval')
        .addToggle('toggle', false)
        .show(ctx.player, () => {
          new MessageForm('MessageForm', 'body')
            .setButton1('b1', () => void 0)
            .setButton2('b2', () => void 0)
            .show(ctx.player)
        })
    })
    menu.show(ctx.player)
  },
  components: ctx => {
    ctx.reply(inspect(ctx.player.getComponents()))
  },

  lush(ctx) {
    let size = parseInt(ctx.args[1] ?? '')
    size = isNaN(size) ? 10 : size
    ctx.player.info(i18n`Trying to replace air under the cave vines with structure void in radius ${size}`)

    const vines = [
      MinecraftBlockTypes.Vine,
      MinecraftBlockTypes.CaveVines,
      MinecraftBlockTypes.CaveVinesBodyWithBerries,
      MinecraftBlockTypes.CaveVinesHeadWithBerries,
    ] as string[]

    system.runJob(
      (function* lush() {
        let i = 0
        for (const vector of Vec.forEach(...Vec.around(ctx.player.location, size))) {
          i++
          if (i % 100 === 0) yield

          const block = ctx.player.dimension.getBlock(vector)
          if (block && block.typeId !== MinecraftBlockTypes.Air) continue

          const above = ctx.player.dimension.getBlock(Vec.add(vector, Vec.up))
          if (!above) continue

          if (vines.includes(above.typeId)) {
            ctx.player.dimension.setBlockType(vector, MinecraftBlockTypes.StructureVoid)
            ctx.player.success(i18n`lush > ${Vec.floor(vector)}!`)
          }
        }
      })(),
    )
  },

  dbinspect(ctx) {
    world.debug(
      'test41',
      { DatabaseUtils },
      world.overworld.getEntities({ type: DatabaseUtils.entityTypeId }).map(e => {
        const { nameTag, location } = e
        const type = e.getDynamicProperty('tableType')
        let data = ''
        const a = e.container
        if (!a) return
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
      }),
    )
  },
  airdrop(ctx) {
    requestAirdrop(!!ctx.args[2])
  },
  e(ctx) {
    const m = ctx.player.mainhand()
    const item = m.getItem()
    if (!item) return
    console.log(Object.values(MinecraftEnchantmentTypes).map(e => item.enchantable?.getEnchantment(e)))
  },
  m(ctx) {
    setMinimapNpcPosition(ctx.player, Number(ctx.args[1]) as 1 | 2, Number(ctx.args[2]), Number(ctx.args[3]))
  },
  particle(ctx) {
    const block = ctx.player.getBlockFromViewDirection({
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
          Vec.add(block.location, { x: 0.5, z: 0.5, y: 1.5 }),
          variables,
        )

        if (c >= 6) system.clearRun(id)
      },
      'test',
      10,
    )
  },
  frm2(ctx) {
    const second = form(title => {
      title.title('Second').body('Something')
    })

    const main = form(title => {
      title.title('Main').button(second)
    })

    main.show(ctx.player)
  },
  frm(ctx) {
    new ActionForm('Test')
      .button('Test', getAuxOrTexture(MinecraftItemTypes.TripwireHook), () => {})
      .button('Test', BUTTON['<'], () => {})
      .button('Test', getAuxOrTexture(BUTTON['<']), () => {})
      .button('Test', () => {})
      .show(ctx.player)
  },
  lore(ctx) {
    ctx.player.mainhand().setLore(['\u00a0', '\u00a0', 'aaa', ' '])
  },

  form(ctx) {
    new ActionForm('Common action form', 'Common action form body')
      .button('NpcForm', () => {
        const form = new FormNpc(
          'title',
          'bodyyy, this is usually very very long text that fully describes any npc dialogue or action or any other content. So yeah its very very longs',
        )

        form.button('Кнопка 1', () => ctx.player.success('Ура'))

        form.button('Кнопка 2', () => ctx.player.success('Ура'))

        form.button('Кнопка 3', () => ctx.player.success('Ура'))

        form.show(ctx.player)
      })
      .button('ChestForm', () => {
        new ChestForm('9')
          .title('9 slots chest ui')
          .pattern([0, 0], ['xxxxxx'], {
            x: {
              icon: MinecraftBlockTypes.Diorite,
            },
          })
          .show(ctx.player)
      })
      .show(ctx.player)
  },

  mail(ctx) {
    Mail.send(ctx.player.id, i18n.join`Zolkin`, i18n.join`Привет, мир!`, new Rewards())
  },
  mailr(ctx) {
    ctx.player.id
    Mail.send(
      ctx.player.id,
      i18n.join`Bugrock`,
      i18n.join`это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст`,
      new Rewards().score('money', 50).score('leafs', 100).item(MinecraftItemTypes.Diamond, 12),
    )
  },
}

system.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.sourceType !== ScriptEventSource.Server) return
  if (!event.id.startsWith('t:')) return
  const id = event.id.split(':')[1]
  if (!id || !tests[id]) return console.log(Object.keys(tests))

  const args = parseArguments(event.message)
  try {
    tests[id]({
      args,
      error: console.error,
      reply: console.info,
      player: {
        location: { x: 0, y: 0, z: 0 },
        fail: console.error,
        info: console.info,
        success: console.info,
      } as Player,
    })
  } catch (e) {
    console.error(e)
  }
})

const publicTests: Record<string, (ctx: CommandContext) => void | Promise<void>> = {
  death(ctx) {
    ctx.player.kill()
  },
}

const c = new Command('test').setDescription('Разные тесты')

new Cutscene('animation1', 'Animation1')
new Cutscene('animation2', 'Animation2')
new Cutscene('animation3', 'Animation3')

c.string('id', true).executes(async (ctx, id) => {
  const source = is(ctx.player.id, 'techAdmin') ? { ...publicTests, ...tests } : tests
  const keys = Object.keys(source)
  if (!isKeyof(id as string, source)) return ctx.error('Неизвестный тест ' + id + ', доступные:\n§f' + keys.join('\n'))
  ctx.reply('Tест ' + id)

  util.catch(() => source[id as string]?.(ctx), 'Test')
})

function bench<T>(
  player: Player,
  ttype: string,
  runs: number,
  tests: [fn: VoidFunction, label: string][],
  saveResultsMapper?: (r: T) => unknown,
  yildEach = 30,
) {
  const subruns = yildEach
  const r = Math.round(runs / subruns)
  player.tell(i18n`Will run ${r} with ${subruns}`)
  const start = Date.now()
  const results = new Set<unknown>()
  return new Promise<Set<unknown>>(resolve => {
    system.runJob(
      (function* testRegionQuery() {
        for (const [fn, name] of tests) {
          for (let i = 0; i < r; i++) {
            const bench = util.benchmark(name, ttype)
            for (let iii = 0; iii < subruns; iii++) {
              const result = fn()
              if (saveResultsMapper) results.add(saveResultsMapper(result as T))
            }
            bench(undefined, subruns)
            yield
          }
          yield
          player.info('Done for ' + name)
        }
        player.info(`Done! Took ${(Date.now() - start) / 1000}s`)
        if (results.size) console.log([...results])
        resolve(results)
      })(),
    )
  })
}
