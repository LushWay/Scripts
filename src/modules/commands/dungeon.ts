import { MolangVariableMap, Player, system, world } from '@minecraft/server'
import { ArrayForm, RadiusRegion, Vector } from 'lib'
import { CustomItems } from 'lib/assets/config'
import { ItemLoreSchema } from 'lib/database/item-stack'
import { t } from 'lib/text'
import { GasStationGarageRegion, GasStationRegion } from 'modules/places/dangeons/gas-station'

const toolSchema = new ItemLoreSchema('dungeonCreationTool', CustomItems.WeTool)
  .nameTag(() => '§fСоздает данж')
  .lore('§7Используй, чтобы создать данж')
  .property('type', String)
  .display('Тип данжа')
  .build()

const dungeons = [GasStationGarageRegion, GasStationRegion]

new Command('dungeon').setPermissions('techAdmin').executes(ctx => {
  const hand = ctx.player.mainhand()
  if (hand.hasItem() && !toolSchema.is(hand)) {
    return ctx.error('Предмет в руке будет перезаписан')
  }

  new ArrayForm('Выбери тип данжа', dungeons)
    .button(item => {
      return [
        item.name.replace('Region', ''),
        () => {
          const hand = ctx.player.mainhand()
          if (toolSchema.is(hand)) {
            const schema = toolSchema.parse(hand)
            if (schema) schema.type = item.kind
            else ctx.error('Создайте новый предмет, старый сломался')
          } else {
            console.log('Setting item...')
            hand.setItem(toolSchema.create({ type: item.kind }).item)
          }
        },
      ]
    })
    .show(ctx.player)
})

system.runPlayerInterval(
  player => {
    const dungeon = getDungeon(player)
    if (!dungeon) return
    const { dungeon: instance } = dungeon
    const { position, size } = instance.getVisualStructure()

    const max = Vector.add(position, size)
    for (const l of Vector.foreach(position, max)) {
      if (!Vector.isedge(position, max, l)) continue

      player.spawnParticle('minecraft:balloon_gas_particle', l, particle)
    }
  },
  'dungeon place',
  30,
)

function getDungeon(player: Player) {
  const mainhand = player.mainhand()
  const storage = toolSchema.parse(mainhand)
  if (!storage) return

  const Region = dungeons.find(e => e.kind === storage.type)
  if (!Region) {
    player.onScreenDisplay.setActionBar(t.error`Данжа ${storage.type}\nбольше не существует`)
    return
  }

  return {
    dungeon: new Region(
      {
        center: Vector.floor(player.location),
        dimensionId: player.dimension.type,
        radius: 0,
      },
      '',
    ),
    Region,
  }
}

world.afterEvents.itemUse.subscribe(event => {
  const player = event.source
  const dungeon = getDungeon(player)
  if (!dungeon) return
  const { dungeon: i } = dungeon

  ;(dungeon.Region as unknown as typeof RadiusRegion).create({
    dimensionId: i.dimensionId,
    center: i.center,
    radius: 0,
  })
  player.success(t`Данж создан на ${Vector.string(i.center, true)}`)
})

const particle = new MolangVariableMap()

particle.setVector3('direction', {
  x: 0,
  y: 0,
  z: 0,
})
