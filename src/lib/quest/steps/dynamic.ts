import { QS, QSBuilder } from '../step'

export class QSDynamic extends QS {
  protected activate() {
    // Nothing...
  }
}

export class QSDynamicBuilder extends QSBuilder<QSDynamic> {
  create(args: [text: Text]) {
    super.create(args)
  }
}
