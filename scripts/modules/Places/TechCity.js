import { DefaultPlaceWithSafeArea } from 'modules/Places/Default/WithSafeArea.js'

class TechCityBuilder extends DefaultPlaceWithSafeArea {
  constructor() {
    super('Техноград')
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const TechCity = new TechCityBuilder()
