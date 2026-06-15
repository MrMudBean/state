/**
 * @module @vvi/reducer/middle-ware-log
 * @file middle-ware-log.ts
 * @description 日志中间件
 * @author MrMudBean <Mr.MudBean@outlook.com>
 * @license MIT
 * @copyright 2026 ©️ MrMudBean
 * @since 2026-01-26 20:30
 * @version 0.0.0
 * @lastModified 2026-06-15 21:23
 */

import type { Middleware } from './types';

/**
 * ## 日志中间件
 * @param manager 仓库
 * @returns void
 */
export const loggerMiddleware: Middleware = manager => next => action => {
  console.groupCollapsed('触发： ', String(action.type));
  console.log('上一个状态：', manager.getState());
  console.log('执行使用数据：', action?.payload ?? '');
  next(action);
  console.log('下一个状态：', manager.getState());
  console.groupEnd();
};
