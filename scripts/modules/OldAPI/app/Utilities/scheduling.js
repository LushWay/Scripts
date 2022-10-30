import { world } from "@minecraft/server";
//import { SA } from "../../index.js"
import { XA } from "xapi.js";

/**
 * Sleeps your code
 * @param {number} tick time in ticks you want the return to occur
 */
export const sleep = (tick) => {
  return new Promise((resolve) => setTickTimeout(resolve, tick));
};

/**
 * Register a tick timeout
 * @param {Function} callback Code you want to execute when the command is executed
 * @param {number} tick time in ticks you want the return to occur
 */
export function setTickTimeout(callback, tick) {
  new Timeout(callback, tick);
}

/**
 * Delay executing a function, REPEATEDLY
 * @param {() => void} callback
 * @param {number} [tick]
 * @param {string} [msg]
 */
export function setTickInterval(callback, tick, msg) {
  return new Timeout(callback, tick, true, Date.now(), msg);
}

/**
 * Clears a interval
 * @param {Timeout} callback
 */
export function clearTickInterval(callback) {
  callback.expire();
}

/**
 * A list of timeouts that are occuring
 * @type {Map<number, Timeout>}
 */
const TIMEOUTS = new Map();

let dev = false;

class Timeout {
  /**
   * Register a timeout
   * @param {Function} callback On timeout complete code to be executed
   * @param {number} tick tick of the timeout
   * @param {boolean} [loop]
   * @param {number} [id]
   * @param {string} [msg]
   */
  constructor(callback, tick, loop = false, id = Date.now(), msg) {
    this.callbackTick = null;
    this.tickDelay = tick;
    this.loop = loop;
    this.callback = callback;
    this.id = id;
    this.msg = msg;

    TIMEOUTS.set(id, this);

    this.TickCallBack = world.events.tick.subscribe(({ currentTick }) => {
      if (!this.callbackTick) this.callbackTick = currentTick + this.tickDelay;
      if (this.callbackTick > currentTick) return;

      const start = Date.now();
      this.callback();
      const time = Date.now() - start;
      if (time > 2 && dev) {
        this.loop = false;
        console.warn(
          this.msg + " " + this.callback.toString().length + " " + time
        );
      }

      if (!this.loop) return this.expire();
      this.callbackTick = currentTick + this.tickDelay;
    });
  }

  /**
   * Expires this tickTimeout
   */
  expire() {
    world.events.tick.unsubscribe(this.TickCallBack);
    TIMEOUTS.delete(this.id);
  }
}
