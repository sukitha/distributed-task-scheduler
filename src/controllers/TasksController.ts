import 'koa-body';
import { Context } from 'koa';
import loggerFactory from '../utils/logging';
import { TasksManager } from '../services/TasksManager';

const logger = loggerFactory.getLogger('TasksController');

export class TasksController {

  constructor(protected service: TasksManager) {
  }

  async add(ctx: Context) {
    const { body } = ctx.request;
    const result = await this.service.scheduleTask(body);
    ctx.body = result;
    ctx.status = 200;
    ctx.type = 'json';
  }
}

