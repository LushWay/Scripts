import { DefaultPlaceWithSafeArea } from 'modules/Places/Default/WithSafeArea.js'

// TODO магазы
// TODO кузнец (перековка в тч!)
// TODO другие мастера
// TODO плата

class TechCityBuilder extends DefaultPlaceWithSafeArea {
  constructor() {
    super('Техноград')
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const TechCity = new TechCityBuilder()
