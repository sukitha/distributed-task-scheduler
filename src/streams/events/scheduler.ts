import { event, IEvent } from 'ioredis-streams';
import { TaskStatus } from '../../models/ITask';

export enum SchedulerEvents {
  scheduleTask = 'scheduleTask',
  loadTasks = 'loadTasks',
  cancelTask = 'cancelTask',
  completeTask = 'completeTask',
  failTask = 'failTask'
}


export type IScheduledEvent<T = any> = IEvent<T> & { from?: { source: string; taskId?: string; } };

export type Task<T = any> = {
  type: 'publish_event' | 'api_call'; //TODO 
  stream: string;
  event: IEvent<T>;
}

export type ScheduleTaskData = {
  id: string;
  when: number;
  task: Task;
};

export type LoadTasksData = {
  from: number;
  to: number;
}

type UpdateTaskStatusData<T> = {
  id: string;
  status: T;
}

export const scheduler = {
  ...event(SchedulerEvents.scheduleTask).of<ScheduleTaskData>(),
  ...event(SchedulerEvents.loadTasks).of<LoadTasksData>(),
  ...event(SchedulerEvents.cancelTask).of<UpdateTaskStatusData<TaskStatus.canceled>>(),
  ...event(SchedulerEvents.completeTask).of<UpdateTaskStatusData<TaskStatus.completed>>(),
  ...event(SchedulerEvents.failTask).of<UpdateTaskStatusData<TaskStatus.failed>>(),

}
