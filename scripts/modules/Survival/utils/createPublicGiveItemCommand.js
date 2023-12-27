import { ItemStack } from '@minecraft/server'

/**
 * @param {string} name
 * @param {ItemStack} stack
 */
export function createPublicGiveItemCommand(name, stack) {
  const tag = stack.nameTag?.split('\n')[0]
  new Command({
    name,
    description: `Выдает или убирает ${tag}§r§7§o из инвентаря`,
    type: 'public',
  }).executes(async ctx => {
    const { container } = ctx.sender
    if (!container) return
    const item = container.entries().find(e => e[1]?.is(stack))

    if (item) {
      container.setItem(item[0], undefined)
      ctx.reply('§c- ' + tag)
    } else {
      container.addItem(stack)
      ctx.reply('§a+ ' + tag)
    }
  })
}
