// @ts-expect-error
String.prototype.cc = () => this.replace(/§./g, "");
