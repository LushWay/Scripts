import { ItemStack } from '@minecraft/server'

/**
 * @param {string} name
 * @param {ItemStack} stack
 */
export function createPublicGiveItemCommand(name, stack) {
  const tag = stack.nameTag?.split('\n')[0]
  new Command({
    name,
    description: `Выдает или убирает ${tag} из инвентаря`,
    type: 'public',
  }).executes(async ctx => {
    const { container } = ctx.sender.getComponent('inventory')
    const item = container.entries().find(e => e[1]?.is(stack))

    if (item) {
      container.setItem(item[0], undefined)
      ctx.reply('§c- ' + tag)
    } else {
      ctx.sender.getComponent('inventory').container.addItem(stack)
      ctx.reply('§a+ ' + tag)
    }
  })
}
