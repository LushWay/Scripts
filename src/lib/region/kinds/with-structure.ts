import { RegionStructure } from '../structure'
import { Region } from './region'

export abstract class RegionWithStructure extends Region {
  structure: RegionStructure

  constructor(...args: ConstructorParameters<typeof Region>) {
    super(...args)
    this.structure = new RegionStructure(this, this.id)
  }
}
