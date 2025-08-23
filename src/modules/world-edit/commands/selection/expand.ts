import {} from '@minecraft/server'
import { Vec } from 'lib'
import { WorldEdit } from '../../lib/world-edit'

export class SelectionManager {
  /**
   * Expands the selection area
   *
   * @example
   *   expand(11)
   *
   * @param {number} amount Ammount to expand selection in all directions
   * @param {WorldEdit} builder
   * @returns {void}
   */

  static expand(builder: WorldEdit, amount: number): void {
    const dx = builder.pos2.x - builder.pos1.x
    const dz = builder.pos2.z - builder.pos1.z

    if (dx < 0 && dz < 0) {
      //means u need to sub,  sub to get to pos1
      builder.pos1 = Vec.add(builder.pos1, new Vec(amount, -amount, amount))
      builder.pos2 = Vec.add(builder.pos2, new Vec(-amount, amount, -amount))
    } else if (dx < 0 && dz >= 0) {
      //means u need to sub,  add to get to pos1
      builder.pos1 = Vec.add(builder.pos1, new Vec(amount, -amount, -amount))
      builder.pos2 = Vec.add(builder.pos2, new Vec(-amount, amount, amount))
    } else if (dx >= 0 && dz >= 0) {
      //means u need to add,  add to get to pos1
      builder.pos1 = Vec.add(builder.pos1, new Vec(-amount, -amount, -amount))
      builder.pos2 = Vec.add(builder.pos2, new Vec(amount, amount, amount))
    } else if (dx >= 0 && dz < 0) {
      //means u need to add, sub to get to pos1
      builder.pos1 = Vec.add(builder.pos1, new Vec(-amount, -amount, amount))
      builder.pos2 = Vec.add(builder.pos2, new Vec(amount, amount, -amount))
    }
  }

  /**
   * Expands the selection verticly
   *
   * @example
   *   expandVert(11)
   *
   * @param {number} amount Ammount to expand selection in all directions
   * @param {WorldEdit} builder
   * @returns {void}
   */

  static expandVert(builder: WorldEdit, amount: number): void {
    builder.pos2 = Vec.add(builder.pos2, new Vec(0, amount, 0))
  }
}

const expand = new Command('expand')
  .setGroup('we')
  .setDescription('Расширить выделенную зону во все стороны или вертикально')
  .setPermissions('builder')

expand.int('size').executes((ctx, size) => {
  const we = WorldEdit.forPlayer(ctx.player)
  if (!we.selection) return ctx.reply('§cЗона не выделена!')
  SelectionManager.expand(we, size)
  ctx.reply(
    `§b► §3Выделенная зона поднята на §f${size} §3блоков вверх, теперь она с\n§f${Vec.string(
      we.pos1,
    )}\n§3по \n§f${Vec.string(we.pos2)}`,
  )
})

expand
  .overload('vert')
  .setDescription('Поднять выделенную зону')
  .int('size')
  .executes((ctx, size) => {
    const we = WorldEdit.forPlayer(ctx.player)
    if (!we.selection) return ctx.reply('§cЗона не выделена!')
    SelectionManager.expandVert(we, size)
    ctx.reply(
      `§b► §3Выделенная зона поднята на §f${size} §3блоков вверх, теперь она с\n§f${Vec.string(
        we.pos1,
      )}\n§3по \n§f${Vec.string(we.pos2)}`,
    )
  })
