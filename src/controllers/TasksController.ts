import 'koa-body';
import { Context } from 'koa';
import loggerFactory from '../utils/logging';
import { taskManager } from '../services/TasksManager';

const logger = loggerFactory.getLogger('TasksController');

export class TasksController {

  constructor(protected service: typeof taskManager) {
  }

  async add(ctx: Context) {
    const { body } = ctx.request;
    const { when, task } = body;
    const result = await this.service.saveTask(when, task);
    ctx.body = result;
    ctx.status = 200;
    ctx.type = 'json';
  }
}

