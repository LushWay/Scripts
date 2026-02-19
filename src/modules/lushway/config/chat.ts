import { Sounds } from 'lib/assets/custom-sounds'
import { sendPacketToStdout } from 'lib/bds/api'
import { Chat } from 'lib/chat/chat'
import { getFullname } from 'lib/get-fullname'

class LushWayChat extends Chat {
  protected onMessage(ctx: Chat.Context): void {
    const message = `${getFullname(ctx.sender, { nameColor: '§7', equippment: true })}§r: ${ctx.text}`
    const fullrole = getFullname(ctx.sender, { name: false })
    if (__SERVER__) {
      // This is handled/parsed by ServerCore
      // Dont really want to do request each time here
      sendPacketToStdout('chatMessage', {
        name: ctx.sender.name,
        role: fullrole,
        print: message,
        message: ctx.text,
      })
    }

    for (const near of ctx.nearPlayers) {
      near.tell(message)
      if (this.playerSettings(near).sound) near.playSound(Sounds.Click)
    }

    for (const outranged of ctx.farPlayers) {
      outranged.tell(`${getFullname(ctx.sender, { nameColor: '§8' })}§7: ${ctx.text}`)
    }

    ctx.sender.tell(message)
  }
}

Command.registerChatListener(new LushWayChat().chatListener)
