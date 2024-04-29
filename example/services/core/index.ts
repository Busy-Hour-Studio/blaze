import { Service } from '../../../src';
import { Logger } from '../../utils/Logger';
import { onUserCreated } from './events/users.created';

// Create a core service
//  We used to act as a main service
//    will trigger other service if needed
const service = {
  name: 'core',
  events: {
    'users.created': onUserCreated,
  },
  onStarted() {
    Logger.info(`Core Service started`);
  },
} as const satisfies Service;

export default service;
