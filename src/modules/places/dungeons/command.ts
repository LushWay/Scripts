import { MolangVariableMap, Player, system, world } from '@minecraft/server'
import { ArrayForm, isKeyof, Vector } from 'lib'
import { CustomItems } from 'lib/assets/config'
import { StructureDungeonsId } from 'lib/assets/structures'
import { ItemLoreSchema } from 'lib/database/item-stack'
import { SphereArea } from 'lib/region/areas/sphere'
import { t } from 'lib/text'
import { DungeonRegion } from 'modules/places/dungeons/dungeon'
import { Dungeon } from './loot'

const toolSchema = new ItemLoreSchema('dungeonCreationTool', CustomItems.WeTool)
  .nameTag(() => '§fСоздает данж')
  .lore('§7Используй, чтобы создать данж')
  .property('type', String)
  .display('Тип данжа', t => (isKeyof(t, Dungeon.names) ? Dungeon.names[t] : t))
  .build()

const dungeons = Object.values(StructureDungeonsId)

new Command('dungeon').setPermissions('techAdmin').executes(ctx => {
  const hand = ctx.player.mainhand()
  if (hand.hasItem() && !toolSchema.is(hand)) {
    return ctx.error('Предмет в руке будет перезаписан')
  }

  new ArrayForm('Выбери тип данжа', dungeons)
    .button(structureId => {
      return [
        isKeyof(structureId, Dungeon.names) ? Dungeon.names[structureId] : structureId,
        () => {
          const hand = ctx.player.mainhand()
          if (toolSchema.is(hand)) {
            const schema = toolSchema.parse(hand)
            if (schema) schema.type = structureId
            else ctx.error('Создайте новый предмет, старый сломался')
          } else {
            console.log('Setting item...')
            hand.setItem(toolSchema.create({ type: structureId }).item)
          }
        },
      ]
    })
    .show(ctx.player)
})

function getDungeon(player: Player) {
  const mainhand = player.mainhand()
  const storage = toolSchema.parse(mainhand)
  if (!storage) return

  const region = new DungeonRegion(
    new SphereArea({ center: Vector.floor(player.location), radius: 0 }, player.dimension.type),
    { structureId: storage.type },
    '',
  )
  region.configureSize()
  return region
}

world.afterEvents.itemUse.subscribe(event => {
  const player = event.source
  const dungeon = getDungeon(player)
  if (!dungeon) return

  DungeonRegion.create(new SphereArea({ center: dungeon.area.center, radius: 0 }, dungeon.dimensionId), {
    structureId: dungeon.structureId,
  })
  player.success(t`Данж создан на ${Vector.string(dungeon.area.center, true)}`)
})

system.runPlayerInterval(
  player => {
    const dungeon = getDungeon(player)
    if (!dungeon) return
    const { position, size } = dungeon.getVisualStructure()

    const max = Vector.add(position, size)
    for (const l of Vector.foreach(position, max)) {
      if (!Vector.isedge(position, max, l)) continue

      player.spawnParticle('minecraft:balloon_gas_particle', l, particle)
    }
  },
  'dungeon place',
  30,
)

const particle = new MolangVariableMap()

particle.setVector3('direction', {
  x: 0,
  y: 0,
  z: 0,
})
