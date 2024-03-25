import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blaze } from '../../src';

const app = new Blaze({});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const servicePath = path.resolve(__dirname, 'services');

app.load({
  path: servicePath,
  autoStart: true,
});

console.log('Blaze server listening on port 3000');

const serve = app.serve(3000);

export default serve;
