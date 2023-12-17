import { DefaultPlaceWithSafeArea } from 'modules/Survival/Place/Default.place.js'

class TechCityBuilder extends DefaultPlaceWithSafeArea {
  constructor() {
    super('TechCity')
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const TechCity = new TechCityBuilder()
