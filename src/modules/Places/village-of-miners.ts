import { DefaultPlaceWithSafeArea } from 'modules/places/lib/DefaultWithSafeArea'

class VillageOfMinersBuilder extends DefaultPlaceWithSafeArea {
  constructor() {
    super('Деревня шахтеров')
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const VillageOfMiners = new VillageOfMinersBuilder()
