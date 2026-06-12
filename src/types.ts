/**
 * @module @qqi/State/types
 * @file types.ts
 * @description _
 * @author MrMudBean <Mr.MudBean@outlook.com>
 * @license MIT
 * @copyright 2026 ©️ MrMudBean
 * @since 2026-01-26 19:56
 * @version 0.0.0
 * @lastModified 2026-01-27 11:41
 */

import { type StateManager } from './index';

/**
 * ## 消息处理机制
 */
export type Reducer<State extends object> = (
  state: State,
  action: ReducerAction<State>,
) => State;

/**
 * ## 动作执行
 */
export type ReducerAction<State extends object> = {
  type: keyof State;
  payload?: any;
};

/**
 * ## 状态配置
 */
export interface StateManagerOptions<State extends object = any> {
  /** 数据更新前钩子 */
  beforeDispatch?: (action: ReducerAction<State>, state: State) => void;

  /** 数据更后前钩子 */
  afterDispatch?: (action: ReducerAction<State>, state: State) => void;

  /** 中间件 */
  middleware?: Middleware[];

  /** 插件 */
  plugins?: Plugin<State>[];
}

/**
 * ## 中间件类型
 */
export type Middleware = <State extends object>(
  stateManager: StateManager<State>,
) => (
  next: (action: ReducerAction<State>) => void,
) => (action: ReducerAction<State>) => void;

/**
 * ## 插件类型
 */

export interface Plugin<State extends object> {
  init?(manager: StateManager<State>): void;
  destroy?(): void;
}
