import config from '../config';
import { RedisStreams } from 'ioredis-streams';
import { events } from './events';
import { startSchedulerStream } from './SchedulerStream';

const create = () => {
  const streams = new RedisStreams(config.nodeName, {
    deadLetters: {
      maxRetries: 20,
      maxSize: 1000000,
      stream: 'dead_letters_scheduler'
    }
  });
  const group = streams.group('scheduler');

  return {

    scheduler: group.stream('scheduler_events').with(events.scheduler),

    startAll: async () => {
      const all = await Promise.all([
        startSchedulerStream(),
      ])
      return {
        stop: async () => all.forEach((s) => s.stop())
      }
    }
  };
};

export const R = create();

export { events } from './events';
