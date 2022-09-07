import { IAuditable } from 'mongo-unit-of-work';
import { Task } from '../streams/events/scheduler';

export interface ITask extends IAuditable {
  data: Task;
  when: Date;
  status: TaskStatus;
}



export enum TaskStatus {
  scheduled = 'scheduled',
  completed = 'completed',
  canceled = 'canceled',
  failed = 'failed'
}