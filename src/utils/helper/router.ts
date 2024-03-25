import type { OpenAPIDefinitions } from '@asteasolutions/zod-to-openapi/dist/openapi-registry';
import type { Env, Schema } from 'hono';
import { mergePath } from 'hono/utils/url';
import type { BlazeRouter } from '../../router';

export function assignOpenAPIRegistry<
  E extends Env = Env,
  S extends Schema = NonNullable<unknown>,
  BasePath extends string = '/',
>(
  router: BlazeRouter<E, S, BasePath>,
  docPath: string,
  def: OpenAPIDefinitions
) {
  switch (def.type) {
    case 'component':
      return router.openAPIRegistry.registerComponent(
        def.componentType,
        def.name,
        def.component
      );

    case 'route':
      return router.openAPIRegistry.registerPath({
        ...def.route,
        path: mergePath(docPath, def.route.path),
      });

    case 'webhook':
      return router.openAPIRegistry.registerWebhook({
        ...def.webhook,
        path: mergePath(docPath, def.webhook.path),
      });

    case 'schema':
      return router.openAPIRegistry.register(
        def.schema._def.openapi._internal.refId,
        def.schema
      );

    case 'parameter':
      return router.openAPIRegistry.registerParameter(
        def.schema._def.openapi._internal.refId,
        def.schema
      );

    default: {
      const errorIfNotExhaustive: never = def;
      throw new Error(`Unknown registry type: ${errorIfNotExhaustive}`);
    }
  }
}
