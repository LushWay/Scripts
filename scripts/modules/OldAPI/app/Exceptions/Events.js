class EventsBuilder {
  constructor() {
    this.events = [];
  }
  /**
   * 
   * @param {String} name 
   * @param {Function} callbak 
   */
  onEvent(name, callbak) {
    this.events.push({ name: name, callback: callbak });
  }
  /**
   * 
   * @param {String} name 
   * @param {Object} extras 
   * @param {Boolean} debug 
   */
  triggerEvent(name, extras = null, debug = false) {
    const event = this.events.find((e) => (e.name === name));
    if (debug) console.warn(name);
    if (event && event.callback) event.callback(extras, name);
  }
}
export const e = new EventsBuilder();