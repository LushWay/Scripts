export declare namespace ServerRpc {
  interface Routes {
    ping: { req: undefined; res: { status: number } }
    playerPlatform: {
      req: { playerName: string }
      res: { platform: 'win10' | 'android' | 'console' }
    }

    command: { req: { command: string }; res: undefined }
    say: { req: { message: string }; res: undefined }
  }

  interface StdoutPackets {
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
}
