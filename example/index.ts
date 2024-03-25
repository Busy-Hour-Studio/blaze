import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blaze } from '../src';

const app = new Blaze({});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const servicePath = path.resolve(__dirname, 'services');

app.load({
  path: servicePath,
  autoStart: true,
});

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Blaze OpenAPI Example',
  },
});

const config = app.serve(3000);

export default config;
