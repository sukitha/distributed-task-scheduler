import { event, IEvent } from 'ioredis-streams';

export enum SchedulerEvents {
  createSchedulerTask = 'createSchedulerTask',
  schedulerTaskCreated = 'schedulerTaskCreated', //ack
}

export type Task = {
  type: 'publish_event' | 'api_call'; //TODO 
  stream: string; // stream name
  event: IEvent<any>;
}

export type ScheduleTaskData = {
  when: number;
  task: Task;
};

export type ScheduleTaskAckData = {
  id: string;
  exceutionTime: number;
  task: Task;
};

export const scheduler = {
  ...event(SchedulerEvents.createSchedulerTask).of<ScheduleTaskData>(),
  ...event(SchedulerEvents.schedulerTaskCreated).of<ScheduleTaskAckData>(),
}