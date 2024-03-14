import { BlazeError } from '../errors/BlazeError';
import type { ActionCallResult as Result } from '../types/action';
import type { EventName } from '../types/event';
import { RESERVED_KEYWORD } from '../utils/constant';
import { BlazeEvent } from './BlazeEventEmitter';

export class BlazeBrokerRegistry {
  public hasListener(eventName: EventName) {
    return BlazeEvent.listenerCount(eventName) > 0;
  }

  private validateEventName(eventName: EventName) {
    if (this.hasListener(eventName)) return;

    throw new BlazeError({
      status: 500,
      errors: {
        message: `No listener for event ${eventName}`,
      },
      message: 'No listener for event',
    });
  }

  // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-shadow
  public async call<T, U = T extends Array<infer T> ? Result<T> : Result<T>>(
    eventName: EventName,
    ...values: unknown[]
  ) {
    this.validateEventName(eventName);

    return BlazeEvent.emitAsync<T, U>(eventName, ...values) as Promise<U[]>;
  }

  // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-shadow
  public async mcall<T, U = T extends Array<infer T> ? Result<T> : Result<T>>(
    ...args: [eventName: EventName, ...values: unknown[]][]
  ) {
    return Promise.all(args.map((values) => this.call<T, U>(...values)));
  }

  public emit(eventName: EventName, ...values: unknown[]) {
    return BlazeEvent.emit(eventName, ...values);
  }

  public event(eventName: EventName, ...values: unknown[]) {
    const evtName = [RESERVED_KEYWORD.PREFIX.EVENT, eventName].join('.');

    return this.emit(evtName, ...values);
  }
}

export const BlazeBroker = new BlazeBrokerRegistry();
