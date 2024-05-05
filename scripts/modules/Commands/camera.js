import { restorePlayerCamera } from 'lib.js'

new Command('camera').setDescription('Возвращает камеру в исходное состояние').executes(ctx => {
  restorePlayerCamera(ctx.player, 1)
})
