export class Player {
  // @ts-expect-error AAAAAA
  static name() {
    return ''
  }
}
