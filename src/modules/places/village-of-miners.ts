import { DefaultPlaceWithSafeArea } from 'modules/places/lib/DefaultWithSafeArea'

class VillageOfMinersBuilder extends DefaultPlaceWithSafeArea {
  constructor() {
    super('Деревня шахтеров')
  }
}

export const VillageOfMiners = new VillageOfMinersBuilder()
