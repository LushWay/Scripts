declare global {
  namespace Scripts {
    interface Routes {
      ping: { req: unknown; res: { status: number } }
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
      command: { req: { command: string }; res: unknown }
      say: { req: { message: string }; res: unknown }
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
    }
  }
}

export {}
