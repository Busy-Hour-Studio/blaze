/*
    This Blaze class are heavily inspired by @honojs/zod-openapi
    https://github.com/honojs/middleware/blob/main/packages/zod-openapi
    MIT License
    Copyright (c) 2023 Yusuke Wada

    The main difference is that we don't validate user request 
    immediately, since we will validate it in the BlazeContext instead
*/
import type { BlazeOpenAPIOption, CreateBlazeOption } from '@/types/router';
import { assignOpenAPIRegistry } from '@/utils/helper/router';
import type { RouteConfig } from '@asteasolutions/zod-to-openapi';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  OpenApiGeneratorV31,
} from '@asteasolutions/zod-to-openapi';
import type { OpenAPIObjectConfig } from '@asteasolutions/zod-to-openapi/dist/v3.0/openapi-generator';
import type { Env, Schema } from 'hono';
import { Hono } from 'hono';
import type { MergePath, MergeSchemaPath } from 'hono/types';

export class Blaze<
  E extends Env = Env,
  S extends Schema = NonNullable<unknown>,
  BasePath extends string = '/',
> extends Hono<E, S, BasePath> {
  public readonly openAPIRegistry: OpenAPIRegistry;

  constructor(options: CreateBlazeOption) {
    super({ strict: false, router: options.router });
    this.openAPIRegistry = new OpenAPIRegistry();
  }

  public openapi(route: BlazeOpenAPIOption) {
    let method = route.method ? route.method : 'post';
    method = method === 'all' ? 'post' : method.toLowerCase();

    const newRoute = {
      ...route,
      method,
    } as RouteConfig;

    this.openAPIRegistry.registerPath(newRoute);
    this.on(route.method, route.path, route.handler);
  }

  public getOpenAPIDocument(
    config: OpenAPIObjectConfig
  ): ReturnType<OpenApiGeneratorV3['generateDocument']> {
    const generator = new OpenApiGeneratorV3(this.openAPIRegistry.definitions);
    const document = generator.generateDocument(config);

    return document;
  }

  public getOpenAPI31Document(
    config: OpenAPIObjectConfig
  ): ReturnType<OpenApiGeneratorV31['generateDocument']> {
    const generator = new OpenApiGeneratorV31(this.openAPIRegistry.definitions);
    const document = generator.generateDocument(config);

    return document;
  }

  public off(method: string, path: string) {
    const index = this.router.routes.findIndex(
      (route) => route[0] === method && route[1] === path
    );

    if (index === -1) return;

    this.router.routes.splice(index, 1);
  }

  public doc(path: string, config: OpenAPIObjectConfig) {
    this.get(path, (ctx) => {
      try {
        const document = this.getOpenAPIDocument(config);

        return ctx.json(document);
      } catch (e) {
        return ctx.json(e, 500);
      }
    });
  }

  public doc31(path: string, config: OpenAPIObjectConfig) {
    this.get(path, (ctx) => {
      try {
        const document = this.getOpenAPI31Document(config);

        return ctx.json(document);
      } catch (e) {
        return ctx.json(e, 500);
      }
    });
  }

  public route<
    SubPath extends string,
    SubEnv extends Env,
    SubSchema extends Schema,
    SubBasePath extends string,
  >(
    path: SubPath,
    app?: Blaze<SubEnv, SubSchema, SubBasePath> | undefined
  ): Blaze<
    E,
    MergeSchemaPath<SubSchema, MergePath<BasePath, SubPath>> & S,
    BasePath
  > {
    super.route(path, app);

    if (!(app instanceof Blaze)) {
      return this;
    }

    const docPath = path.replaceAll(/:([^/]+)/g, '{$1}');

    app.openAPIRegistry.definitions.forEach((def) => {
      assignOpenAPIRegistry(this, docPath, def);
    });

    return this;
  }
}
