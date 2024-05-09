import { restorePlayerCamera } from 'lib'

new Command('camera').setDescription('Возвращает камеру в исходное состояние').executes(ctx => {
  restorePlayerCamera(ctx.player, 1)
})
