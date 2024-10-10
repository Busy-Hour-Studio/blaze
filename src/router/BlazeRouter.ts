/*
    This Blaze class are heavily inspired by @honojs/zod-openapi
    https://github.com/honojs/middleware/blob/main/packages/zod-openapi
    MIT License
    Copyright (c) 2023 Yusuke Wada

    The main difference is that we don't validate user request 
    immediately, since we will validate it in the BlazeContext instead
*/
import type {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  OpenApiGeneratorV31,
} from '@asteasolutions/zod-to-openapi';
import type { OpenAPIObjectConfig } from '@asteasolutions/zod-to-openapi/dist/v3.0/openapi-generator';
import type { Env, Schema } from 'hono';
import { Hono } from 'hono';
import type { MergePath, MergeSchemaPath } from 'hono/types';
import { BlazeConfig } from '../config';
import { Logger } from '../internal/logger';
import type { Random } from '../types/common';
import { DependencyModule } from '../types/config';
import type { BlazeOpenAPIOption } from '../types/openapi';
import type { CreateBlazeOption } from '../types/router';
import { ExternalModule } from '../utils/constant';
import {
  assignOpenAPIRegistry,
  createOpenApiRouter,
  fixOpenApiPath,
} from '../utils/helper/router';

export class BlazeRouter<
  E extends Env = Env,
  S extends Schema = NonNullable<unknown>,
  BasePath extends string = '/',
> extends Hono<E, S, BasePath> {
  public readonly openAPIRegistry: OpenAPIRegistry | null;
  private zodApi: DependencyModule[typeof ExternalModule.ZodApi];

  constructor(options: Pick<CreateBlazeOption, 'router'> = {}) {
    super({ strict: false, router: options.router });

    this.zodApi = BlazeConfig.modules[ExternalModule.ZodApi];

    if (!this.zodApi) {
      this.openAPIRegistry = null;
      return;
    }

    this.openAPIRegistry = new this.zodApi.OpenAPIRegistry();
  }

  public openapi(route: BlazeOpenAPIOption) {
    const middlewares = [...(route.middlewares ?? [])];

    const newRoute = createOpenApiRouter(route);

    this.on(route.method, route.path, ...middlewares, route.handler);

    if (!this.openAPIRegistry) return;

    this.openAPIRegistry.registerPath(newRoute);

    return this;
  }

  public getOpenAPIDocument(
    config: OpenAPIObjectConfig
  ): ReturnType<OpenApiGeneratorV3['generateDocument']> {
    if (!this.zodApi || !this.openAPIRegistry) {
      throw Logger.throw(`${ExternalModule.ZodApi} is not installed`);
    }

    const generator = new this.zodApi.OpenApiGeneratorV3(
      this.openAPIRegistry.definitions
    );
    const document = generator.generateDocument(config);

    return document;
  }

  public getOpenAPI31Document(
    config: OpenAPIObjectConfig
  ): ReturnType<OpenApiGeneratorV31['generateDocument']> {
    if (!this.zodApi || !this.openAPIRegistry) {
      throw Logger.throw(`${ExternalModule.ZodApi} is not installed`);
    }

    const generator = new this.zodApi.OpenApiGeneratorV31(
      this.openAPIRegistry.definitions
    );
    const document = generator.generateDocument(config);

    return document;
  }

  public doc(path: string, config: OpenAPIObjectConfig) {
    this.get(path, (ctx) => {
      try {
        const document = this.getOpenAPIDocument(config);

        return ctx.json(document);
      } catch (e) {
        return ctx.json(e as Error, 500);
      }
    });

    return this;
  }

  public doc31(path: string, config: OpenAPIObjectConfig) {
    this.get(path, (ctx) => {
      try {
        const document = this.getOpenAPI31Document(config);

        return ctx.json(document);
      } catch (e) {
        return ctx.json(e as Error, 500);
      }
    });

    return this;
  }

  public route<
    SubPath extends string,
    SubEnv extends Env,
    SubSchema extends Schema,
    SubBasePath extends string,
  >(
    path: SubPath,
    app?:
      | Hono<SubEnv, SubSchema, SubBasePath>
      | BlazeRouter<SubEnv, SubSchema, SubBasePath>
  ): BlazeRouter<
    E,
    MergeSchemaPath<SubSchema, MergePath<BasePath, SubPath>> & S,
    BasePath
  > {
    super.route(path, app as Random);

    if (!(app instanceof BlazeRouter) || !app.openAPIRegistry) {
      return this;
    }

    const docPath = fixOpenApiPath(path);

    app.openAPIRegistry.definitions.forEach((def) => {
      assignOpenAPIRegistry(this, docPath, def);
    });

    return this;
  }
}
