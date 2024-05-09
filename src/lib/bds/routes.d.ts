declare global {
  namespace BDS {
    interface Routes {
      ping: { req: any; res: { status: number } }
      playerPlatform: {
        req: { playerName: string }
        res: { platform: 'win10' | 'android' | 'console' }
      }
      gitPull: {
        req: { restartType: 'process' | 'script' | 'server' }
        res: { statusMessage: string }
      }
      gitStatus: {
        req: { cwd: 'root' | 'sm-api' }
        res: { statusMessage: string }
      }
      backup: {
        req: { name: string }
        res: { statusMessage: string }
      }
      reload: {
        req: { status: number }
        res: { status: number }
      }
      command: { req: { command: string }; res: any }
      say: { req: { message: string }; res: any }
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
    }
  }
}

export {}
