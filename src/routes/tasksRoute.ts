import KoaRoute from 'koa-tree-router';
import Koa from 'koa';
import { TasksController } from '../controllers/TasksController';
import { taskManager } from '../services/TasksManager';

export default () => {

  const tasksRoute = new KoaRoute();

  tasksRoute
    .post('/', (ctx: Koa.Context) => {
      const controller = getTasksController(ctx);
      return controller.add(ctx);
    })
  return tasksRoute;
};

const getTasksController = (ctx: Koa.Context) => {
  const controller = new TasksController(taskManager);
  return controller;
};