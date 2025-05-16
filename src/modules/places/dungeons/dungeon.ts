import { Player, StructureRotation, StructureSaveMode, system, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import {
  ActionForm,
  adventureModeRegions,
  Cooldown,
  isKeyof,
  LootTable,
  ms,
  registerRegionType,
  registerSaveableRegion,
  Vector,
} from 'lib'
import { StructureFile, structureFiles } from 'lib/assets/structures'
import { Area } from 'lib/region/areas/area'
import { SphereArea } from 'lib/region/areas/sphere'
import { Region, RegionCreationOptions, RegionPermissions } from 'lib/region/kinds/region'
import { structureLikeRotate, structureLikeRotateRelative, toAbsolute, toRelative } from 'lib/utils/structure'
import { Dungeon } from './loot'

export interface DungeonRegionDatabase extends JsonObject {
  chests: Record<string, number | null>
  structureId: string
  rotation: StructureRotation
  terrainStructureId: string
  terrainStructurePosition: { x: number; z: number; y: number }
}

interface DungeonRegionOptions extends RegionCreationOptions {
  structureId: string
  rotation: StructureRotation
}

export interface DungeonChest {
  id: string
  restoreTime: number
  loot: LootTable
  location: Vector3
}

export class DungeonRegion extends Region {
  static dungeons: DungeonRegion[] = []

  static {
    system.runInterval(
      () => {
        for (const dungeon of this.dungeons) {
          for (const chest of dungeon.chests) {
            const placed = dungeon.ldb.chests[chest.id]
            if (!placed || Cooldown.isExpired(placed, chest.restoreTime)) {
              dungeon.updateChest(chest)
            }
          }

          for (const chest of Object.keys(dungeon.ldb.chests)) {
            const vector = Vector.parse(chest)
            if (!vector) continue

            if (dungeon.chests.find(e => Vector.equals(e.location, vector))) continue

            // Old chest
            console.log('Found old chest', Vector.string(vector, true))
            try {
              dungeon.dimension.setBlockType(vector, MinecraftBlockTypes.Air)
              Reflect.deleteProperty(dungeon.ldb.chests, chest)
              dungeon.save()
            } catch (e) {}
          }
        }
      },
      'dungeonRegionChestLoad',
      20,
    )
  }

  constructor(area: Area, options: DungeonRegionOptions, key: string) {
    super(area, options, key)
    this.ldb.structureId = options.structureId
    this.ldb.rotation = options.rotation
  }

  ldb: DungeonRegionDatabase = {
    chests: {},
    structureId: '',
    terrainStructureId: '',
    terrainStructurePosition: { x: 0, z: 0, y: 0 },
    rotation: StructureRotation.None,
  }

  protected structureFile: StructureFile | undefined

  get structureId() {
    return this.ldb.structureId
  }

  protected configureDungeon(): void {
    if (!this.structureFile) return
    const { chestPositions, enderChestPositions } = this.structureFile
    const toRotated = (f: Vector3[]) => this.rotate(f.map(e => this.fromRelativeToAbsolute(e)))

    const loot = Dungeon.loot[this.structureId] ?? Dungeon.defaultLoot
    for (const f of toRotated(chestPositions)) this.createChest(f, loot)

    const powerfullLoot = Dungeon.powerfullLoot[this.structureId] ?? Dungeon.defaultLoot
    for (const f of toRotated(enderChestPositions)) this.createChest(f, powerfullLoot)
  }

  private rotate(vectors: Vector3[]) {
    const { structureFile } = this
    if (!structureFile) return vectors
    return structureLikeRotate({
      rotation: this.ldb.rotation,
      position: this.getStructurePosition(),
      size: structureFile.size,
      vectors: vectors,
    })
  }

  protected override onCreate() {
    this.onRestore()
    this.placeStructure()
  }

  protected override onRestore() {
    DungeonRegion.dungeons.push(this)
    this.configureSize()
    this.configureDungeon()
  }

  configureSize() {
    // console.log('Configuring size of', this.structureId, this.linkedDatabase)
    if (isKeyof(this.structureId, structureFiles)) {
      this.structureFile = structureFiles[this.structureId]
      // console.log('Created dungeon with size', Vector.string(this.structureSize))
    } else return false

    if (this.area instanceof SphereArea) {
      this.area.radius = Vector.distance(this.getStructurePosition(), this.area.center)
      // console.log('Changed radius of dungeon to', this.area.radius)
    }

    return true
  }

  customFormButtons(form: ActionForm, player: Player): void {
    form.addButton('Установить структуру', () => {
      this.placeStructure()
    })
  }

  customFormDescription(player: Player): Record<string, unknown> {
    return {
      ...super.customFormDescription(player),
      Rotation: this.ldb.rotation,
      StructurePosition: this.getStructurePosition(),
      Chests: this.chests.map(e => Vector.string(e.location, true)),
    }
  }

  structureBounds() {
    if (!this.structureFile) return { from: this.area.center, to: this.area.center, fromAbsolute: this.area.center }
    const fromAbsolute = this.getStructurePosition(StructureRotation.None)
    const toAbsolute = Vector.add(fromAbsolute, this.structureFile.size)

    const [from, to] = this.rotate([fromAbsolute, toAbsolute])

    return { from: Vector.min(from, to), to: Vector.max(from, to), fromAbsolute }
  }

  protected getStructurePosition(rotation = this.ldb.rotation) {
    if (!this.structureFile) throw new TypeError('No structure file!')

    return new Vector(
      structureLikeRotateRelative(rotation, Vector.multiply(this.structureFile.size, 0.5), this.structureFile.size),
    )
      .multiply(-1)
      .floor()
      .add(this.area.center)
  }

  protected placeStructure() {
    if (!this.structureFile) return
    const position = this.getStructurePosition()

    if (!this.ldb.terrainStructureId) {
      const id = `dungeon:terrain_backup_${new Date().toISOString().replaceAll(':', '|')}`
      const bounds = this.structureBounds()
      const from = Vector.add(Vector.min(position, bounds.from), { x: -1, z: -1, y: -1 })
      const to = Vector.add(Vector.max(position, bounds.to), { x: 1, z: 1, y: 1 })
      world.structureManager.createFromWorld(id, this.dimension, from, to, {
        saveMode: StructureSaveMode.World,
        includeBlocks: true,
        includeEntities: false,
      })
      this.ldb.terrainStructureId = id
      this.ldb.terrainStructurePosition = from
      console.log('Saved backup for', this.structureId, 'with id', id)
    }

    console.log('Placing structure', position, this.structureId)
    world.structureManager.place(this.structureId, this.dimension, position, { rotation: this.ldb.rotation })
  }

  fromAbsoluteToRelative(vector: Vector3) {
    return toRelative(vector, this.getStructurePosition())
  }

  fromRelativeToAbsolute(vector: Vector3) {
    return toAbsolute(vector, this.getStructurePosition())
  }

  protected defaultPermissions: RegionPermissions = {
    pvp: true,
    switches: true,
    doors: true,
    trapdoors: false,
    gates: false,
    openContainers: true,
    owners: [],
    allowedEntities: 'all',
    allowedAllItem: true,
  }

  chests: DungeonChest[] = []

  protected createChest(location: Vector3, loot: LootTable, restoreTime = ms.from('min', 20)) {
    // console.log(
    //   'Created a chest at',
    //   Vector.string(location, true),
    //   Vector.string(this.fromRelativeToAbsolute(location)),
    //   true,
    // )

    this.chests.push({
      id: Vector.string(location),
      location,
      loot,
      restoreTime,
    })
  }

  private updateChest(chest: DungeonChest) {
    const block = this.dimension.getBlock(chest.location)
    if (!block?.isValid) return

    this.ldb.chests[chest.id] = Date.now()

    if (block.typeId !== MinecraftBlockTypes.Chest) block.setType(MinecraftBlockTypes.Chest)

    const container = block.getComponent('inventory')?.container
    if (!container) throw new ReferenceError('No container in chest!')

    chest.loot.fillContainer(container)
  }

  delete(): void {
    const { terrainStructureId: id, terrainStructurePosition: position } = this.ldb
    const { dimension } = this
    super.delete()

    system.delay(() => {
      try {
        if (id) {
          console.log('Placing structure', id, 'at', position)
          world.structureManager.place(id, dimension, position)
          world.structureManager.delete(id)
        }
      } catch (e) {
        console.warn('Unable to place structure with id', id, e)
      }
    })
  }

  get displayName(): string | undefined {
    return Dungeon.names[this.structureId] ?? 'Данж'
  }
}
registerSaveableRegion('dungeon', DungeonRegion)
registerRegionType('Данж', DungeonRegion)
adventureModeRegions.push(DungeonRegion)
