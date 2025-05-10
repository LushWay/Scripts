import { MolangVariableMap, Player, system, world } from '@minecraft/server'
import { ArrayForm, isKeyof, Vector } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { StructureDungeonsId } from 'lib/assets/structures'
import { ItemLoreSchema } from 'lib/database/item-stack'
import { SphereArea } from 'lib/region/areas/sphere'
import { t } from 'lib/text'
import { DungeonRegion } from 'modules/places/dungeons/dungeon'
import { CustomDungeonRegion } from './custom-dungeon'
import { Dungeon } from './loot'

const toolSchema = new ItemLoreSchema('dungeonCreationTool', Items.WeTool)
  .nameTag(() => '§fСоздает данж')
  .lore('§7Используй, чтобы создать данж')
  .property('type', String)
  .display('Тип данжа', t => (isKeyof(t, Dungeon.names) ? Dungeon.names[t] : t))
  .build()

const dungeons = [...Object.values(StructureDungeonsId), ...Object.keys(Dungeon.customNames)]

new Command('dungeon').setPermissions('techAdmin').executes(ctx => {
  const hand = ctx.player.mainhand()
  if (hand.hasItem() && !toolSchema.is(hand)) {
    return ctx.error('Предмет в руке будет перезаписан')
  }

  new ArrayForm('Выбери тип данжа', dungeons)
    .button(structureId => {
      return [
        Dungeon.customNames[structureId] ??
          (isKeyof(structureId, Dungeon.names) ? Dungeon.names[structureId] : structureId),
        () => {
          const hand = ctx.player.mainhand()
          if (toolSchema.is(hand)) {
            const schema = toolSchema.parse(hand)
            if (schema) schema.type = structureId
            else ctx.error('Создайте новый предмет, старый сломался')
          } else {
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

  const region = isKeyof(storage.type, Dungeon.names)
    ? new DungeonRegion(
        new SphereArea({ center: Vector.floor(player.location), radius: 0 }, player.dimension.type),
        { structureId: storage.type },
        '',
      )
    : new CustomDungeonRegion(
        new SphereArea({ center: Vector.floor(player.location), radius: 10 }, player.dimension.type),
        { name: storage.type },
        '',
      )

  if (!region.configureSize()) {
    player.onScreenDisplay.setActionBar(t.error`Неизвестный данж: ${storage.type}`)
    return
  }
  return region
}

world.afterEvents.itemUse.subscribe(event => {
  const player = event.source
  const dungeon = getDungeon(player)
  if (!dungeon) return

  if (dungeon instanceof CustomDungeonRegion) {
    CustomDungeonRegion.create(dungeon.area, { name: dungeon.ldb.name })
  } else {
    DungeonRegion.create(dungeon.area, { structureId: dungeon.structureId })
  }

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
