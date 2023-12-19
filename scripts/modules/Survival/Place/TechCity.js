import { DefaultPlaceWithSafeArea } from 'modules/Survival/utils/DefaultPlace.js'

class TechCityBuilder extends DefaultPlaceWithSafeArea {
  constructor() {
    super('Техноград')
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const TechCity = new TechCityBuilder()
