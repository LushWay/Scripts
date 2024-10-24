export declare namespace ScriptServerRpc {
  interface Routes {
    ping: { req: undefined; res: { status: number } }

    command: { req: { command: string }; res: undefined }
  }

  interface Packets {
    chatMessage: {
      name: string
      message: string
      role: string
      print: string
    }
    joinOrLeave: {
      role: string
      name: string
      print: string
    } & ({ status: 'joined' | 'spawned' | 'left' } | { status: 'move'; where: 'air' | 'ground' })
    error: {
      name: string
      message: string
      stack: string
    }
    createBackup: { name: string }
    reload: { reason: string }
  }

  interface Events {
    giveAirdropKey: { level: 'basic' | 'powerfull' }

    updatePlayerMeta: { id: string; xuid: string; pfid: string; lang: string; name: string }[]
    updatePlayerLangs: { xuid: string; lang: string; pfid: string }
  }
}
