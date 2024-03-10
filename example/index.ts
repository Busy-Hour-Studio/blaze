import { Blaze } from '../src';
import { SERVICE_PATH } from './utils/constants';

const app = new Blaze();

app.load({
  path: SERVICE_PATH,
  // Start the services when all the services are loaded
  autoStart: true,
});

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Blaze OpenAPI Example',
  },
});

const config = {
  fetch: app.fetch as never,
  port: 3000,
};

export default config;
