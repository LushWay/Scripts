import { ItemStack, MolangVariableMap, Vector, system, world } from '@minecraft/server'
import {
  MinecraftBlockTypes,
  MinecraftCameraPresetsTypes,
  MinecraftEntityTypes,
  MinecraftItemTypes,
} from '@minecraft/vanilla-data.js'
import {
  Airdrop,
  BUTTON,
  ChestForm,
  DatabaseUtils,
  LootTable,
  Mail,
  NpcForm,
  Settings,
  is,
  itemLocaleName,
  restorePlayerCamera,
  util,
} from 'lib.js'
import { CommandContext } from 'lib/Command/Context.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { MessageForm } from 'lib/Form/MessageForm.js'
import { ModalForm } from 'lib/Form/ModalForm.js'
import { Compass } from 'lib/Menu.js'
import { Rewards } from 'lib/Rewards.js'
import { BASE_ITEM_STACK } from 'modules/Features/base.js'
import { request } from '../lib/BDS/api.js'
import { Mineshaft } from '../modules/Places/Mineshaft.js'
import './enchant.js'
import './lib/Form/util.test.js'
import './simulatedPlayer.js'

// There you can create simple one time tests taht will be run using .test <name> command
//
// also note that each test function recieves command context as argument, so if your test
// interacts with a player, use ctx.sender
//
// please add new test on the top
//
// use public tests with caution, they're available to the all players!
// other tests are available only for tech admins and above

/** @type {Record<string, (ctx: CommandContext) => void | Promise<any>>} */
const tests = {
  scen(ctx) {
    const player = ctx.sender

    player.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
      location: Vector.add(player.getHeadLocation(), Vector.multiply(player.getViewDirection(), 20)),
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

    console.log(getSettings(ctx.sender))
  },
  f(ctx) {
    const form = new ActionForm('MENUS', 'Menu body', '§c§u§s§r§f')
    form.addButton('Test!', BUTTON['?'], () => {})
    form.addButton('Test!', BUTTON['?'], () => {})
    form.addButton('Test!', BUTTON['?'], () => {})
    form.addButton('Test!', BUTTON['?'], () => {})
    form.addButton('Test!', BUTTON['?'], () => {})
    form.show(ctx.sender)
  },
  cc(ctx) {
    // @ts-expect-error Testing
    console.debug(Compass.players.get(ctx.sender)?.value)
  },
  title(ctx) {
    ctx.sender.onScreenDisplay.setHudTitle('FFf', {
      subtitle: 'AAAA',
      fadeInDuration: 0,
      stayDuration: 20 * 4,
      fadeOutDuration: 20,
    })
  },
  compass(ctx) {
    const [entity] = ctx.sender.dimension.getEntities({ type: MinecraftEntityTypes.Cow, closest: 1 })
    if (!entity) return ctx.error('No entity!')
    ctx.sender.teleport(entity.location)

    system.runInterval(
      () => {
        Compass.setFor(ctx.sender, entity.location)
      },
      'compass',
      2,
    )
  },
  chest(ctx) {
    util.catch(() => {
      system.runInterval(
        () => {
          const minecarts = ctx.sender.dimension.getEntities({
            type: MinecraftEntityTypes.ChestMinecart,
            maxDistance: 20,
            location: ctx.sender.location,
          })
          for (const minecart of minecarts) {
            Airdrop.prototype.showParticleTrace(minecart.location, minecart)
          }
        },
        'minecart test',
        40,
      )
    })
  },
  airdrop(ctx) {
    if (ctx.args[1]) ctx.reply('Аирдроп для')
    const airdrop = new Airdrop({
      position: Vector.add(Vector.floor(ctx.sender.location), { x: 0, z: 0, y: 30 }),
      loot: Object.values(LootTable.instances)[0],
      for: ctx.args[1] ? ctx.sender.id : undefined,
    })

    system.runTimeout(
      () => {
        const a = system.runInterval(
          () => {
            if (!airdrop.chestMinecart || !airdrop.chestMinecart.isValid()) {
              //|| airdrop.status === 'being looted'
              return system.clearRun(a)
            }

            airdrop.showParticleTrace()
          },
          'test airdrop',
          20,
        )
      },
      'test airdrop',
      20,
    )
  },
  slot(ctx) {
    ctx.reply(ctx.sender.selectedSlot)
  },

  base(ctx) {
    ctx.sender.container?.addItem(BASE_ITEM_STACK)
  },
  logs() {
    console.log('This is log §6color§r test §lbold')
    console.info('This is info test')
    console.warn('This is warn test')
    util.error(new TypeError('This is error test'))
  },
  forms: ctx => {
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
  components: ctx => {
    ctx.reply(util.inspect(ctx.sender.getComponents()))
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
  localization(ctx) {
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
      ctx.reply(itemLocaleName(stack))
    }
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
          variables,
        )

        if (c >= 6) system.clearRun(id)
      },
      'test',
      10,
    )
  },
  async api(ctx) {
    const res = await request('playerPlatform', {
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

    const orePositions = Mineshaft.generateOre({ center: ctx.sender.location, minRadius: rad, maxRadius: rad2 })

    for (const position of orePositions) {
      ctx.sender.dimension.getBlock(position)?.setType(MinecraftBlockTypes.Stone)
    }
  },
  lore(ctx) {
    ctx.sender.mainhand().setLore(['\u00a0', '\u00a0', 'aaa', ' '])
  },

  form(ctx) {
    new ActionForm('Common action form', 'Common action form body')
      .addButton('NpcForm', () => {
        const form = new NpcForm(
          'title',
          'bodyyy, this is usually very very long text that fully describes any npc dialogue or action or any other content. So yeah its very very longs',
        )

        form.addButton('Кнопка 1', () => ctx.sender.success('Ура'))
        form.addButton('Кнопка 2', () => ctx.sender.success('Ура'))
        form.addButton('Кнопка 3', () => ctx.sender.success('Ура'))

        form.show(ctx.sender)
      })
      .addButton('ChestForm', () => {
        new ChestForm('9')
          .title('9 slots chest ui')
          .pattern([0, 0], ['xxxxxx'], {
            x: {
              icon: MinecraftBlockTypes.Diorite,
            },
          })
          .show(ctx.sender)
      })
      .show(ctx.sender)
  },

  mail(ctx) {
    Mail.send(ctx.sender.id, 'Zolkin', 'Привет, мир!', new Rewards())
  },
  mailr(ctx) {
    ctx.sender.id
    Mail.send(
      ctx.sender.id,
      'Bugrock',
      'это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст. это очень длинный текст',
      new Rewards().scores('money', 50).scores('leafs', 100).item(MinecraftItemTypes.Diamond, 'Алмаз', 12),
    )
  },
}

/** @type {Record<string, (ctx: CommandContext) => void | Promise<any>>} */
const publicTests = {
  death(ctx) {
    ctx.sender.kill()
  },
}

const c = new Command({
  name: 'test',
  description: 'Разные тесты',
})

c.string('id', true).executes(async (ctx, id) => {
  const source = is(ctx.sender.id, 'techAdmin') ? { ...publicTests, ...tests } : tests
  const keys = Object.keys(source)
  if (!keys.includes(id)) return ctx.error('Неизвестный тест ' + id + ', доступные:\n§f' + keys.join('\n'))
  ctx.reply('Tест ' + id)
  util.catch(() => source[id](ctx), 'Test')
})
