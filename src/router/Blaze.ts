import fs from 'node:fs';
import { AddressInfo } from 'node:net';
import { BlazeDependency } from '../config';
import { BlazeError } from '../errors/BlazeError';
import { BlazeContext } from '../event';
import type { BlazeFetch, CreateBlazeOption } from '../types/router';
import { LoadServicesOption } from '../types/service';
import { isNil } from '../utils/common';
import { BlazeService } from '../utils/setup/service';
import { BlazeRouter } from './BlazeRouter';

export class Blaze {
  public readonly services: BlazeService[];
  public readonly router: BlazeRouter;
  public readonly doc: BlazeRouter['doc'];
  public readonly doc31: BlazeRouter['doc31'];

  private readonly blazeCtx: BlazeContext;

  constructor(options: CreateBlazeOption) {
    this.services = [];
    this.router = new BlazeRouter(options);
    this.doc = this.router.doc.bind(this.router);
    this.doc31 = this.router.doc31.bind(this.router);
    this.blazeCtx = new BlazeContext({
      body: null,
      params: null,
      headers: null,
      honoCtx: null,
      validations: null,
    });

    if (options.path) {
      this.load({
        path: options.path,
        autoStart: options.autoStart,
      });
    }
  }

  /**
   * Start all the loaded services
   * @example
   * ```ts
   *  app.start()
   * ```
   * passing `autoStart: true` on app creation (`new Blaze({ autoStart: true })`) will also start all the services
   */
  public start() {
    this.services.forEach((service) => service.onStarted());
  }

  /**
   * `load` load all the services from the given path
   * @example
   * ```ts
   *  app.load({
   *    path: path.resolve(__dirname, 'services'),
   *    autoStart: true
   *  })
   * ```
   * `autoStart` options will start all the services when all the services are loaded
   */

  public load(options: LoadServicesOption) {
    // Load all the services
    if (!fs.existsSync(options.path)) {
      throw new BlazeError("Service path doesn't exist");
    }

    const serviceFiles = fs.readdirSync(options.path);

    const services = serviceFiles.map((servicePath) => {
      const service = BlazeService.create({
        app: this.router,
        servicePath,
        blazeCtx: this.blazeCtx,
        sourcePath: options.path,
      });

      return service;
    });

    this.services.push(...services);

    if (!options.autoStart) return;

    this.start();
  }

  private getServeConfig(
    port: number,
    listener?: (addressInfo: AddressInfo) => void
  ) {
    const config = {
      fetch: this.router.fetch as BlazeFetch,
      port,
    };

    return [config, listener] as const;
  }

  /**
   * Start the server at the given port
   * @param listener - [Only for Node] a listener that will be called when the server is started.
   * @example
   * ```ts
   * // Start server at port 3000
   * app.serve(3000)
   *
   * // Pass a listener after server started
   * app.serve(3000, (addressInfo) => {
   *   console.log(`Server started at ${addressInfo.address}:${addressInfo.port}`)
   * })
   * ```
   */
  public serve(): BlazeFetch;
  public serve(port: number): {
    fetch: BlazeFetch;
    port: number;
  };
  public serve<Listener extends (addressInfo: AddressInfo) => void>(
    port: number,
    listener: Listener
  ): [{ fetch: BlazeFetch; port: number }, Listener];
  public serve(port?: number, listener?: (addressInfo: AddressInfo) => void) {
    if (!isNil(port)) {
      const args = this.getServeConfig(port, listener);

      if (
        BlazeDependency.runTime === 'node' &&
        BlazeDependency.nodeAdapterExist
      ) {
        BlazeDependency.nodeAdapter.serve(...args);
      }

      if (isNil(listener)) {
        return args[0];
      }

      return args;
    }

    return this.router.fetch as BlazeFetch;
  }
}
