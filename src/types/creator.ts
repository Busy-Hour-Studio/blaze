import type { ZodObject, ZodRawShape } from 'zod';
import type { Action, ActionOpenAPI, ActionValidator } from './action';
import type { Event } from './event';
import type { RecordString, RecordUnknown } from './helper';
import type { AfterHookHandler, BeforeHookHandler } from './hooks';
import type { Service } from './service';

export interface BlazeActionCreator {
  /**
   * Create a reuseable action for services.
   * @example
   * ```ts
   * const action = BlazeCreator.action({
   *   rest: 'POST /',
   *   async handler(ctx) {
   *      const body = await ctx.request.body()
   *   }
   * })
   * ```
   */
  <
    Meta extends RecordUnknown = RecordUnknown,
    Header extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>,
    Body extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>,
    Params extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>,
  >(
    action: Action<Meta, Header, Body, Params>
  ): Action<Meta, Header, Body, Params>;
  /**
   * Create a reuseable validator for actions body, params and headers.
   * @example
   * ```ts
   *  const validator = BlazeCreator.action.validator({
   *    header: z.object({
   *      token: z.string(),
   *    })
   *  })
   * ```
   */
  validator<
    Header extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>,
    Body extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>,
    Params extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>,
  >(
    validator: ActionValidator<Header, Body, Params>
  ): ActionValidator<Header, Body, Params>;
  /**
   * Create an openai spec for action.
   * @example
   * ```ts
   * const openapi = BlazeCreator.action.openapi({
   *   responses: {
   *     200: {
   *       description: 'Get user with email N',
   *     },
   *     400: {
   *       description: 'Bad Request',
   *     },
   *   },
   * })
   * ```
   */
  openapi(openapi: ActionOpenAPI): ActionOpenAPI;
  hook: {
    /**
     * Create a reuseable after hook for the service.
     * The hook will be called after the action handler called.
     * @example
     * ```ts
     *  const after = BlazeCreator.event.hook.after((ctx, res) => {
     *    const user = {
     *      name: res.name
     *      age: res.age
     *    }
     *
     *    return user
     *  })
     * ```
     */
    after<
      Meta extends RecordUnknown = RecordUnknown,
      Body extends RecordUnknown = RecordUnknown,
      Params extends RecordUnknown = RecordUnknown,
      Header extends RecordString = RecordString,
      Result = never,
    >(
      hook: AfterHookHandler<Meta, Body, Params, Header, Result>
    ): AfterHookHandler<Meta, Body, Params, Header, never>;
    /**
     * Create a reuseable before hook for the service.
     * The hook will be called before the action handler called.
     * @example
     * ```ts
     *  const before = BlazeCreator.event.hook.before((ctx) => {
     *    const user = await ctx.request.body()
     *
     *    // Validate no duplicated email
     *  })
     * ```
     */
    before<
      Meta extends RecordUnknown = RecordUnknown,
      Body extends RecordUnknown = RecordUnknown,
      Params extends RecordUnknown = RecordUnknown,
      Header extends RecordString = RecordString,
    >(
      hook: BeforeHookHandler<Meta, Body, Params, Header>
    ): BeforeHookHandler<Meta, Body, Params, Header>;
  };
}

export interface BlazeEventCreator {
  /**
   * Create a reusable event for services.
   * @example
   * ```ts
   *  const event = BlazeCreator.event({
   *    async handler(ctx) {
   *      const user = await ctx.request.body()
   *
   *      Logger.info('User Created:', user)
   *    }
   *  })
   * ```
   */
  <
    Meta extends RecordUnknown = RecordUnknown,
    Params extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>,
  >(
    event: Event<Meta, Params>
  ): Event<Meta, Params>;
  /**
   * Create a reuseable validator for events parameters.
   * @example
   * ```ts
   *  const validator = BlazeCreator.event.validator({
   *    name: z.string(),
   *    age: z.number(),
   *  })
   * ```
   */
  validator<Params extends ZodObject<ZodRawShape> = ZodObject<ZodRawShape>>(
    validator: Params
  ): Params;
}

export interface BlazeServiceCreator {
  /**
   * Create a new service with the given name, actions, events, and etc.
   * @example
   * ```ts
   *  const service = BlazeCreator.service({
   *    name: 'user',
   *    actions: {
   *      find,
   *      create,
   *    },
   *  })
   * ```
   */
  (service: Service): Service;
  action: BlazeActionCreator;
  event: BlazeEventCreator;
}
