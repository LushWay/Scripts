import { restorePlayerCamera } from 'lib.js'

new Command({
  name: 'camera',
  description: 'Возвращает камеру в исходное состояние',
}).executes(ctx => {
  restorePlayerCamera(ctx.sender, 1)
})
