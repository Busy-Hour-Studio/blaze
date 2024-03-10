import fs from 'node:fs';
import { BlazeError } from '../errors/BlazeError';
import { BlazeContext } from '../event/BlazeContext';
import type { LoadServiceOption } from '../types/service';
import { BlazeService } from './setup/service';

export async function loadServices(options: LoadServiceOption) {
  const { app, path: sourcePath } = options;

  const blazeCtx = new BlazeContext({
    body: null,
    params: null,
    headers: null,
    honoCtx: null,
    validations: null,
  });

  const serviceFiles = fs.readdirSync(sourcePath);
  const pendingServices = await Promise.all(
    serviceFiles.map(async (servicePath) => {
      const service = await BlazeService.create({
        app,
        servicePath,
        blazeCtx,
        sourcePath,
      });

      return service;
    })
  );

  return pendingServices;
}

/**
 * @deprecated use `app.load` instead from the `Blaze` instance
 * will be removed in v3.0.0
 * @param options LoadServiceOption
 */
export async function initializeServices(options: LoadServiceOption) {
  if (!fs.existsSync(options.path)) {
    throw new BlazeError("Service path doesn't exist");
  }

  const pendingServices = await loadServices(options);

  pendingServices.forEach((service) => service.onStarted());
}
