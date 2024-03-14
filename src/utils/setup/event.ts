import { BlazeEvent } from '../../event/BlazeEventEmitter';
import type { Event } from '../../types/event';
import type {
  ContextValidation,
  RecordString,
  RecordUnknown,
} from '../../types/helper';
import type { CreateEventOption } from '../../types/service';
import { createContext } from '../common';
import { RESERVED_KEYWORD } from '../constant';
import { eventHandler } from '../helper/handler';

export class BlazeServiceEvent {
  public readonly serviceName: string;
  public readonly eventName: string;
  public readonly event: Event;
  private readonly validator: ContextValidation;

  constructor(options: CreateEventOption) {
    this.serviceName = options.serviceName;
    this.eventName = [
      RESERVED_KEYWORD.PREFIX.EVENT,
      this.serviceName,
      options.eventAlias,
    ].join('.');
    this.event = options.event;
    this.validator = {
      body: this.event.validator,
    };

    BlazeEvent.on(this.eventName, this.eventHandler.bind(this));
  }

  public async eventHandler(
    body: RecordUnknown,
    params: RecordUnknown,
    headers: RecordString
  ) {
    const contextRes = await createContext({
      honoCtx: null,
      body,
      headers,
      params,
      validator: this.validator ?? null,
      throwOnValidationError: this.event.throwOnValidationError ?? false,
    });

    if (!contextRes.ok) return contextRes;

    const { result: blazeCtx } = contextRes;

    const options = {
      handler: this.event.handler,
    };

    return eventHandler(options, blazeCtx);
  }
}
