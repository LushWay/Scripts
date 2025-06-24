import { Block, system } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Vec } from 'lib'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { l } from 'lib/i18n/text'

new Command('chunkload')
  .setPermissions('curator')
  .setDescription('Loads chunks in providen area by teleporting player that executed this command')
  .location('from')
  .location('to')
  .int('tickDelay', true)
  .int('saveTickDelay', true)
  .executes(async (ctx, from, to, tickDelay = 5, saveTickDelay = 40) => {
    const player = ctx.player
    from.y = to.y = 62
    player.success(l`Loading chunks from ${Vec.fromVector3(from)} to ${Vec.fromVector3(to)}`)

    player.info('Calculating total chunk size, this might take a while...')
    const chunks: Vector3[] = []
    await new Promise<void>(r => {
      system.runJob(
        (function* uhh() {
          let i = 0
          for (const { x, y, z } of Vec.forEach(from, to)) {
            if (!(x % 16 === 0 && z % 16 === 0)) continue

            i++
            if (i % 500 === 0) {
              player.info(l`Chunks: ${chunks.length + 1}`)
              yield
            }
            chunks.push({ x, y, z })
          }
          r()
        })(),
      )
    })

    player.success(`Total chunks: ${chunks.length}`)

    const start = Date.now()
    for (const [i, { x, y, z }] of chunks.entries()) {
      if (!(x % 16 === 0 && z % 16 === 0)) continue

      if (!player.isValid) return console.warn('Player left from chunkloading')

      player.teleport({ x, y, z })
      let block: Block | undefined
      let tryI = 0
      while (!block) {
        try {
          if (tryI !== 0) await system.waitTicks(tickDelay)
          tryI++
          block = player.dimension.getBlock({ x, y: -62, z })
          // Update the chunk to force save it
          if (block) {
            if (block.typeId === MinecraftBlockTypes.Bedrock) block.setType(MinecraftBlockTypes.Air)
            else block.setType(MinecraftBlockTypes.Bedrock)
          }
        } catch (e) {}
      }

      const now = Date.now()
      const took = now - start
      const speed = took / (i + 1)
      const eta = speed * (chunks.length - i)

      await system.waitTicks(saveTickDelay)

      const speedText = speed < 1000 ? l`${~~speed}ms/chunk` : l.time(speed)

      player.onScreenDisplay.setActionBar(
        l`Loaded ${i}/${chunks.length} ${(i / chunks.length) * 100}% chunks ${new Vec(x, y, z)}\nSpeed: ${speedText}/chunk, remaining: ${l.timeHHMMSS(eta)} elapsed: ${l.timeHHMMSS(took)}`,
        ActionbarPriority.Highest,
      )
    }

    player.success(l`Loaded. Took ${l.time(Date.now() - start)}`)
  })
