import type { OpenAPIDefinitions } from '@asteasolutions/zod-to-openapi/dist/openapi-registry';
import type { Env, Schema } from 'hono';
import { mergePath } from 'hono/utils/url';
import type { BlazeRouter } from '../../router/BlazeRouter';

export function assignOpenAPIRegistry<
  E extends Env = Env,
  S extends Schema = NonNullable<unknown>,
  BasePath extends string = '/',
>(
  blaze: BlazeRouter<E, S, BasePath>,
  docPath: string,
  def: OpenAPIDefinitions
) {
  switch (def.type) {
    case 'component':
      return blaze.openAPIRegistry.registerComponent(
        def.componentType,
        def.name,
        def.component
      );

    case 'route':
      return blaze.openAPIRegistry.registerPath({
        ...def.route,
        path: mergePath(docPath, def.route.path),
      });

    case 'webhook':
      return blaze.openAPIRegistry.registerWebhook({
        ...def.webhook,
        path: mergePath(docPath, def.webhook.path),
      });

    case 'schema':
      return blaze.openAPIRegistry.register(
        def.schema._def.openapi._internal.refId,
        def.schema
      );

    case 'parameter':
      return blaze.openAPIRegistry.registerParameter(
        def.schema._def.openapi._internal.refId,
        def.schema
      );

    default: {
      const errorIfNotExhaustive: never = def;
      throw new Error(`Unknown registry type: ${errorIfNotExhaustive}`);
    }
  }
}
