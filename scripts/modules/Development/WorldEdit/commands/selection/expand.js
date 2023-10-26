import { Vector } from '@minecraft/server'
import {
  WorldEditBuild,
  WorldEditBuilder,
} from '../../builders/WorldEditBuilder.js'

export class SelectionManager {
  /**
   * Expands the selection area
   * @param {number} amount ammount to expand selection in all directions
   * @param {WorldEditBuilder} builder
   * @returns {void}
   * @example expand(11);
   */
  static expand(builder, amount) {
    const dx = builder.pos2.x - builder.pos1.x
    const dz = builder.pos2.z - builder.pos1.z

    if (dx < 0 && dz < 0) {
      //means u need to sub,  sub to get to pos1
      builder.pos1 = Vector.add(
        builder.pos1,
        new Vector(amount, -amount, amount)
      )
      builder.pos2 = Vector.add(
        builder.pos2,
        new Vector(-amount, amount, -amount)
      )
    } else if (dx < 0 && dz >= 0) {
      //means u need to sub,  add to get to pos1
      builder.pos1 = Vector.add(
        builder.pos1,
        new Vector(amount, -amount, -amount)
      )
      builder.pos2 = Vector.add(
        builder.pos2,
        new Vector(-amount, amount, amount)
      )
    } else if (dx >= 0 && dz >= 0) {
      //means u need to add,  add to get to pos1
      builder.pos1 = Vector.add(
        builder.pos1,
        new Vector(-amount, -amount, -amount)
      )
      builder.pos2 = Vector.add(
        builder.pos2,
        new Vector(amount, amount, amount)
      )
    } else if (dx >= 0 && dz < 0) {
      //means u need to add, sub to get to pos1
      builder.pos1 = Vector.add(
        builder.pos1,
        new Vector(-amount, -amount, amount)
      )
      builder.pos2 = Vector.add(
        builder.pos2,
        new Vector(amount, amount, -amount)
      )
    }
  }
  /**
   * Expands the selection verticly
   * @param {number} amount ammount to expand selection in all directions
   * @param {WorldEditBuilder} builder
   * @returns {void}
   * @example expandVert(11);
   */
  static expandVert(builder, amount) {
    builder.pos2 = Vector.add(builder.pos2, new Vector(0, amount, 0))
  }
}

const expand = new XCommand({
  type: 'we',
  name: 'expand',
  description: 'Расширить выделенную зону во все стороны или вертикально',
  role: 'builder',
})

expand.int('size').executes((ctx, size) => {
  if (!WorldEditBuild.selectionCuboid) return ctx.reply('§cЗона не выделена!')
  SelectionManager.expand(WorldEditBuild, size)
  ctx.reply(
    `§b► §3Выделенная зона поднята на §f${size} §3блоков вверх, теперь она с\n§f${Vector.string(
      WorldEditBuild.pos1
    )}\n§3по \n§f${Vector.string(WorldEditBuild.pos2)}`
  )
})

expand
  .literal({
    name: 'vert',
    description: 'Поднять выделенную зону',
  })
  .int('size')
  .executes((ctx, size) => {
    if (!WorldEditBuild.selectionCuboid) return ctx.reply('§cЗона не выделена!')
    SelectionManager.expandVert(WorldEditBuild, size)
    ctx.reply(
      `§b► §3Выделенная зона поднята на §f${size} §3блоков вверх, теперь она с\n§f${Vector.string(
        WorldEditBuild.pos1
      )}\n§3по \n§f${Vector.string(WorldEditBuild.pos2)}`
    )
  })
