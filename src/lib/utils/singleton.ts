/**
 * Used for configurable classes like Join or Chat that are being configured in modules, but need to be accessble from
 * lib
 *
 * A hierarchical singleton pattern where:
 *
 * - **Within a single inheritance hierarchy** (i.e., a chain of classes starting from `Singleton` or any subclass), only
 *   **one instance** can ever be created.
 * - That single instance is **shared by all classes in that hierarchy** – calling `getInstance()` on any class (parent or
 *   child) returns the same object.
 * - The first instantiation of _any_ class in the hierarchy defines the singleton.
 * - Attempting to instantiate _any other class_ in the same hierarchy (or the same class again) throws an error.
 * - Different inheritance trees (e.g., `class Logger extends Singleton` and `class Cache extends Singleton`) are
 *   completely independent and each has its own single instance.
 *
 * @example
 *   // Define a hierarchy
 *   class Logger extends Singleton {}
 *   class FileLogger extends Logger {}
 *
 *   // First instantiation: creates the single instance for the whole Logger → FileLogger chain
 *   const fileLogger = new FileLogger();
 *
 *   // Both return the same instance (the FileLogger instance)
 *   Logger.getInstance();     // returns fileLogger
 *   FileLogger.getInstance(); // returns fileLogger
 *
 *   // Attempting to create another instance anywhere in this hierarchy fails:
 *   // new Logger();     // throws: "Logger is already initialized!"
 *   // new FileLogger(); // throws: "FileLogger is already initialized!"
 *
 * @example
 *   // Different hierarchies are independent
 *   class Cache extends Singleton {}
 *   class RedisCache extends Cache {}
 *
 *   class Metrics extends Singleton {}
 *
 *   new RedisCache();   // creates singleton for Cache/RedisCache tree
 *   new Metrics();      // works fine – separate tree
 *
 *   Cache.getInstance();   // returns RedisCache instance
 *   Metrics.getInstance(); // returns Metrics instance
 */
export class Singleton {
  private static instance?: Singleton
  private static where?: string

  /**
   * Retrieves the singleton instance for the class on which it is called.
   *
   * @example
   *   class AppConfig extends Singleton {}
   *   new AppConfig();
   *
   *   // Later in the code:
   *   const config = AppConfig.getInstance();
   *
   * @typeParam T - The expected return type (typically the calling class)
   * @param this - The constructor function (inferred automatically)
   * @returns The singleton instance associated with this class
   * @throws {Error} If the class hasn't been instantiated yet (directly or via a subclass)
   */
  static getInstance<T>(this: abstract new (...args: any) => T) {
    const self = this as unknown as typeof Singleton
    if (!self.instance) {
      throw new Error(`getInstance: ${self.name} is not initialized!`)
    }
    return self.instance as T
  }

  /**
   * Creates a new singleton instance.
   *
   * The first successful constructor call (on any class in the hierarchy) will store the instance on the calling class
   * and all its parent classes (up to, but excluding, the `Singleton` base class). Any subsequent instantiation – on
   * the same class or any other class in the same inheritance tree – will throw because the singleton already exists.
   *
   * @example
   *   // Works first time
   *   class Database extends Singleton {}
   *   new Database();
   *
   *   // Throws because Database already has an instance
   *   // new Database();
   *
   *   // Throws because Logger shares the same hierarchy? Actually no, separate tree
   *   class Logger extends Singleton {}
   *   new Logger(); // Works fine – different tree
   *
   * @throws {Error} If this class (or any ancestor) already has an instance
   */
  constructor() {
    const ctor = this.constructor as typeof Singleton
    if (ctor.instance) {
      throw new Error(`${ctor.name} is already initialized! ${ctor.where}`)
    }

    const stack = new Error().stack
    let current: typeof Singleton | null = ctor
    while (current && current !== Singleton) {
      current.instance ??= this
      current.where = stack
      current = Object.getPrototypeOf(current) as typeof Singleton | null
    }
  }
}
