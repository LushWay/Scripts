import { ItemStack, Player } from '@minecraft/server'

/**
 * @param {string} name
 * @param {ItemStack} itemStack
 * @param {ItemStack['is']} [is]
 */
export function createPublicGiveItemCommand(name, itemStack, is = itemStack.is.bind(itemStack)) {
  const itemNameTag = itemStack.nameTag?.split('\n')[0]

  /**
   * Gives player an item
   * @param {Player} player
   * @param {object} [o]
   * @param {'tell' | 'ensure'} [o.mode]
   */
  function give(player, { mode = 'tell' } = {}) {
    const { container } = player
    if (!container) return
    const items = container.entries().filter(([_, item]) => item && is(item))

    if (mode === 'tell') {
      if (items.length) {
        for (const [i] of items) container.setItem(i, void 0)
        player.info('§c- ' + itemNameTag)
      } else {
        container.addItem(itemStack)
        player.info('§a+ ' + itemNameTag)
      }
    } else if (mode === 'ensure') {
      if (!items.length) {
        container.addItem(itemStack)
      }
    }
  }

  const command = new Command({
    name,
    description: `Выдает или убирает ${itemNameTag}§r§7§o из инвентаря`,
    type: 'public',
  }).executes(async ctx => {
    give(ctx.sender)
  })

  return {
    give,
    command,
    /**
     * Alias to {@link give}(player, { mode: 'ensure' })
     * @param {Player} player
     */
    ensure: player => give(player, { mode: 'ensure' }),
  }
}
