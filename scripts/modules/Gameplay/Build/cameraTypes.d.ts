import { CameraDBModes } from './camera'

declare module '@minecraft/server' {
  interface PlayerDatabase {
    camera?: {
      pos: Vector3
      type: string
      ease: EasingType
      easeTime: number
      facing: string | Vector3
      mode: CameraDBModes
      spinRadius: number
      modeStep?: number
    }
  }
}
