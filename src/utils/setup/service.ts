import path from 'node:path';
import { BlazeContext } from '../../event/BlazeContext';
import { BlazeEvent } from '../../event/BlazeEventEmitter';
import { Blaze } from '../../router';
import type { Action } from '../../types/action';
import type { EventActionHandler } from '../../types/event';
import type { Method } from '../../types/rest';
import type {
  CreateServiceOption,
  Service,
  ServiceConstructorOption,
} from '../../types/service';
import { getRestPath, getServiceName } from '../common';
import { loadService } from '../helper/service';
import { BlazeServiceAction } from './action';
import { BlazeServiceEvent } from './event';
import { BlazeServiceRest } from './rest';

export class BlazeService {
  public readonly servicePath: string;
  public readonly serviceName: string;
  public readonly restPath: string;
  public readonly mainRouter: Blaze;
  public readonly actions: BlazeServiceAction[];
  public readonly events: BlazeServiceEvent[];
  public readonly rests: BlazeServiceRest[];
  public readonly handlers: EventActionHandler[];
  public router: Blaze | null;

  private readonly blazeCtx: BlazeContext;
  private readonly service: Service;

  constructor(options: ServiceConstructorOption) {
    const { service, blazeCtx, servicePath, app } = options;

    this.service = service;
    this.servicePath = servicePath;
    this.blazeCtx = blazeCtx;
    this.serviceName = getServiceName(service);
    this.restPath = getRestPath(service);
    this.mainRouter = app;

    this.actions = [];
    this.events = [];
    this.rests = [];
    this.handlers = [];

    this.router = null;

    this.loadServiceActions();
    this.loadServiceEvents();
  }

  private loadRest(action: Action) {
    if (!this.router) {
      this.router = new Blaze({
        router: this.service.router,
      });
    }

    const restInstance = new BlazeServiceRest({
      action,
      router: this.router,
    });

    this.rests.push(restInstance);
  }

  private loadServiceActions() {
    if (!this.service.actions) return this.actions;

    // eslint-disable-next-line guard-for-in
    for (const alias in this.service.actions) {
      const action = this.service.actions[alias];

      if (action.rest) this.loadRest(action);

      const actionInstance = new BlazeServiceAction({
        action,
        actionAlias: alias,
        serviceName: this.serviceName,
      });

      this.handlers.push({
        name: actionInstance.actionName,
        handler: actionInstance.actionHandler,
      });

      this.actions.push(actionInstance);
    }

    return this.actions;
  }

  private loadServiceEvents() {
    if (!this.service.events) return this.events;

    // eslint-disable-next-line guard-for-in
    for (const alias in this.service.events) {
      const event = this.service.events[alias];

      const eventInstance = new BlazeServiceEvent({
        event,
        eventAlias: alias,
        serviceName: this.serviceName,
      });

      this.handlers.push({
        name: eventInstance.eventName,
        handler: eventInstance.eventHandler,
      });

      this.events.push(eventInstance);
    }

    return this.events;
  }

  private assignRestRoute() {
    if (!this.router) return;

    this.mainRouter.route(`/${this.restPath}`, this.router);
  }

  public onStopped() {
    // Trigger the on stopped listener
    this.service.onStopped?.(this.handlers);

    // Remove all the rest
    this.rests.forEach((rest) => {
      const method: Method = rest.method ?? 'ALL';

      // this.router?.off?.(method, rest.path);
      this.mainRouter?.off?.(method, rest.path);
    });

    // Remove all the action
    this.actions.forEach((action) => {
      BlazeEvent.off(action.actionName, action.actionHandler);
    });
  }

  public onRestarted() {
    // Trigger the on restarted listener
    // this.service.onRestarted?.(this.handlers);

    // Re-assign the rest
    this.rests.forEach((rest) => {
      const method: Method = rest.method ?? 'ALL';

      this.router?.on?.(method, rest.path, rest.restHandler);
    });

    // Re-assign the action
    this.actions.forEach((action) => {
      BlazeEvent.on(action.actionName, action.actionHandler);
    });
  }

  public onStarted() {
    this.assignRestRoute();
    this.service.onStarted?.(this.blazeCtx);
  }

  public static create(options: CreateServiceOption) {
    const servicePath = path.resolve(options.sourcePath, options.servicePath);
    const serviceFile = loadService(servicePath);

    const service = new BlazeService({
      app: options.app,
      blazeCtx: options.blazeCtx,
      servicePath,
      service: serviceFile,
    });

    return service;
  }
}
