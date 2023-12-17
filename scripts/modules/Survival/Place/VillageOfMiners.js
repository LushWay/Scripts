import { DefaultPlaceWithSafeArea } from 'modules/Survival/Place/Default.place.js'

class VillageOfMinersBuilder extends DefaultPlaceWithSafeArea {
  constructor() {
    super('VillageOfMiners')
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const VillageOfMiners = new VillageOfMinersBuilder()
