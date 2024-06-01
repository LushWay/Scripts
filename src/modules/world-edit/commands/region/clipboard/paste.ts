import { StructureMirrorAxis, StructureRotation } from '@minecraft/server'
import { WorldEdit } from '../../../lib/WorldEdit'

const MirrorAxis = {
  none: StructureMirrorAxis.None,
  x: StructureMirrorAxis.X,
  xz: StructureMirrorAxis.XZ,
  z: StructureMirrorAxis.Z,
}

const Rotations = {
  0: StructureRotation.None,
  90: StructureRotation.Rotate90,
  180: StructureRotation.Rotate180,
  270: StructureRotation.Rotate270,
}

new Command('paste')
  .setDescription('Вставляет заранее скопированную зону')
  .setPermissions('builder')
  .setGroup('we')
  .array('rotation', Object.keys(Rotations) as unknown as `${keyof typeof Rotations}`[], true)
  .array('mirror', Object.keys(MirrorAxis), true)
  .boolean('includeEntites', true)
  .boolean('includeBlocks', true)
  .int('integrity', true)
  .string('seed', true)
  .executes((ctx, rotation, mirror, includeEntites, includeBlocks, integrity, seed) => {
    if (!includeEntites && !includeBlocks) {
      return ctx.error('Невозможно вставить структуру без блоков и сущностей!')
    }

    const we = WorldEdit.forPlayer(ctx.player)
    we.paste(
      ctx.player,
      Rotations[rotation ?? 0],
      MirrorAxis[mirror as 'none'],
      includeEntites,
      includeBlocks,
      integrity,
      seed,
    )
  })
