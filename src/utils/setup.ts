import fs from 'node:fs';
import { BlazeError } from '../errors/BlazeError';
import { BlazeContext } from '../event/BlazeContext';
import type { LoadServiceOption } from '../types/service';
import { BlazeService } from './setup/service';

export function initializeServices(options: LoadServiceOption) {
  const { app, path: sourcePath } = options;

  if (!fs.existsSync(sourcePath)) {
    throw new BlazeError("Service path doesn't exist");
  }

  const blazeCtx = new BlazeContext({
    body: null,
    params: null,
    headers: null,
    honoCtx: null,
    validations: null,
  });

  const serviceFiles = fs.readdirSync(sourcePath);
  const pendingServices = serviceFiles.map((servicePath) => {
    const service = BlazeService.create({
      app,
      servicePath,
      blazeCtx,
      sourcePath,
    });

    return service;
  });

  pendingServices.forEach((service) => service.onStarted());
}
