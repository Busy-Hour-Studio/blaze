import type { EventListener, EventName } from '../types/event';

type Option = {
  maxListener?: number | null;
};

export class BlazeEventEmitter {
  private $maxListeners: number;
  private $emitter: Map<EventName, Set<EventListener>>;
  private $onceEmitter: Map<EventName, Map<EventListener, EventListener>>;

  constructor(options: Option) {
    this.$maxListeners = options?.maxListener ?? 100;
    this.$emitter = new Map();
    this.$onceEmitter = new Map();
  }

  public listenerCount(eventName: EventName) {
    return this.$emitter.get(eventName)?.size ?? 0;
  }

  public get maxListeners() {
    return this.$maxListeners;
  }

  public set maxListeners(value: number) {
    this.$maxListeners = value;
  }

  public emit(eventName: EventName, ...values: unknown[]) {
    if (!this.$emitter.has(eventName)) {
      return false;
    }

    this.$emitter.get(eventName)?.forEach?.((listener) => {
      listener(...values);
    });

    return true;
  }

  // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-shadow
  public async emitAsync<T, U = T extends Array<infer T> ? T : T>(
    eventName: EventName,
    ...values: unknown[]
  ): Promise<U[]> {
    if (!this.$emitter.has(eventName)) {
      return [];
    }

    return Promise.all(
      [...(this.$emitter.get(eventName) ?? [])].map<U>(
        (listener) => listener(...values) as U
      )
    );
  }

  public on(eventName: EventName, listener: EventListener) {
    const listenerCount = this.listenerCount(eventName);

    if (!this.$emitter.has(eventName)) {
      this.$emitter.set(eventName, new Set());
    }

    if (listenerCount >= this.$maxListeners) return;

    this.$emitter.get(eventName)?.add(listener);
  }

  private createOnceListener(eventName: EventName, listener: EventListener) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    return function onceListener(...values: unknown[]) {
      listener(...values);
      self.off(eventName, onceListener);
    };
  }

  public once(eventName: EventName, listener: EventListener) {
    const listenerCount = this.listenerCount(eventName);
    const onceListener = this.createOnceListener(eventName, listener);

    if (!this.$emitter.has(eventName)) {
      this.$emitter.set(eventName, new Set());
    }

    if (!this.$onceEmitter.has(eventName)) {
      this.$onceEmitter.set(eventName, new Map());
    }

    if (listenerCount >= this.$maxListeners) return;

    this.$emitter.get(eventName)?.add?.(onceListener);
    this.$onceEmitter.get(eventName)?.set?.(onceListener, listener);
  }

  public off(eventName: EventName, listener: EventListener) {
    if (!this.$emitter.has(eventName)) return;

    const onceListener = this.$onceEmitter.get(eventName)?.get(listener);

    if (!onceListener) {
      this.$emitter.get(eventName)?.delete(listener);
      return;
    }

    this.$emitter.get(eventName)?.delete(onceListener);
    this.$onceEmitter.get(eventName)?.delete(listener);
  }

  public offAll(): void;
  public offAll(eventName: EventName): void;
  public offAll(eventName?: EventName) {
    if (eventName) {
      this.$emitter.delete(eventName);
      return;
    }

    this.$emitter.clear();
  }

  public eventNames() {
    return [...this.$emitter.keys()];
  }

  public listeners(eventName: EventName) {
    return [...(this.$emitter.get(eventName) ?? [])];
  }

  public rawListeners(eventName: EventName) {
    const listenerSet = new Set<EventListener>();

    if (this.$emitter.has(eventName)) {
      this.$emitter.get(eventName)?.forEach((listener) => {
        listenerSet.add(listener);
      });
    }

    if (this.$onceEmitter.has(eventName)) {
      this.$onceEmitter.get(eventName)?.forEach((listener) => {
        listenerSet.add(listener);
      });
    }

    return listenerSet;
  }

  // Aliases
  public addListener = this.on;
  public removeListener = this.off;
  public removeAllListeners = this.offAll;
}

export const BlazeEvent = new BlazeEventEmitter({});
