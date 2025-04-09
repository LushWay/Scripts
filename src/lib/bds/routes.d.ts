export declare namespace ScriptServerRpc {
  // External routes accessible to script
  interface OutgoingRoutes {
    ping: { req: undefined; res: undefined }
    executeServerCommand: { req: { command: string }; res: undefined }
  }

  // Extrnal routes accessible to script which don't require response
  interface OutgoingPackets {
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

  // Events that can be called from the outside
  interface IncomingScriptEvents {
    giveAirdropKey: { level: 'basic' | 'powerfull' }

    updatePlayerMeta: { id: string; xuid: string; pfid: string; lang: string; name: string }[]
    updatePlayerLangs: { xuid: string; lang: string; pfid: string }
  }
}
