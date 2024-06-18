import { PlaceWithSafeArea } from 'modules/places/lib/place-with-safearea'

class VillageOfMinersBuilder extends PlaceWithSafeArea {
  constructor() {
    super('VillageOfMiners', 'Деревня шахтеров')
  }
}

export const VillageOfMiners = new VillageOfMinersBuilder()
