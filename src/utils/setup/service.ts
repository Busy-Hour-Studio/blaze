import path from 'node:path';
import { BlazeContext, BlazeEvent } from '../../event';
import { BlazeRouter } from '../../router/BlazeRouter';
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
  public readonly mainRouter: BlazeRouter;
  public readonly actions: BlazeServiceAction[];
  public readonly events: BlazeServiceEvent[];
  public readonly rests: BlazeServiceRest[];
  public readonly handlers: EventActionHandler[];
  public router: BlazeRouter | null;

  private readonly blazeCtx: BlazeContext;
  private readonly service: Service;
  private isStarted: boolean;

  constructor(options: ServiceConstructorOption) {
    const { service, blazeCtx, servicePath, app } = options;

    this.service = service;
    this.servicePath = servicePath;
    this.blazeCtx = blazeCtx;
    this.serviceName = getServiceName(service);
    this.restPath = getRestPath(service);
    this.mainRouter = app;
    this.isStarted = false;

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
      this.router = new BlazeRouter({
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
    for (const actionAlias in this.service.actions) {
      const action = this.service.actions[actionAlias];

      if (action.rest) this.loadRest(action);

      const instance = new BlazeServiceAction({
        action,
        actionAlias,
        serviceName: this.serviceName,
      });

      this.actions.push(instance);
    }

    return this.actions;
  }

  private loadServiceEvents() {
    if (!this.service.events) return this.events;

    // eslint-disable-next-line guard-for-in
    for (const eventAlias in this.service.events) {
      const event = this.service.events[eventAlias];

      const instance = new BlazeServiceEvent({
        event,
        eventAlias,
        serviceName: this.serviceName,
      });

      this.events.push(instance);
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
    if (this.isStarted) return;

    this.assignRestRoute();
    this.service.onStarted?.(this.blazeCtx);
    this.isStarted = true;
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
