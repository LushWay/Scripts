import { ItemStack, MolangVariableMap, Vector, system, world } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { Airdrop, ChestForm, DB, GAME_UTILS, LootTable, NpcForm, util } from 'lib.js'
import { CommandContext } from 'lib/Command/Context.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { MessageForm } from 'lib/Form/MessageForm.js'
import { ModalForm } from 'lib/Form/ModalForm.js'
import { BASE_ITEM_STACK } from 'modules/Features/base.js'
import { APIRequest } from '../lib/Net.js'
import { Mineshaft } from '../modules/Places/Mineshaft.js'
import './enchant.js'
import './lib/Form/util.test.js'
import './simulatedPlayer.js'

/**
 * @type {Record<string, (ctx: CommandContext) => void | Promise<any>>}
 */
const tests = {
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
          20
        )
      },
      'test airdrop',
      20
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
      { DB },
      world.overworld.getEntities({ type: DB.ENTITY_IDENTIFIER }).map(e => {
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
      })
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
      ctx.reply(GAME_UTILS.localizationName(stack))
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
          variables
        )

        if (c >= 6) system.clearRun(id)
      },
      'test',
      10
    )
  },
  async api(ctx) {
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
          'bodyyy, this is usually very very long text that fully describes any npc dialogue or action or any other content. So yeah its very very longs'
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
}

const c = new Command({
  name: 'test',
  role: 'techAdmin',
})

c.string('number', true).executes(async (ctx, n) => {
  const keys = Object.keys(tests)
  const i = n && keys.includes(n) ? n : 0
  ctx.reply(i)
  util.catch(() => tests[i](ctx), 'Test')
})
