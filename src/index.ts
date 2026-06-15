/**
 * @module @vvi/reducer/index
 * @file index.ts
 * @author MrMudBean <Mr.MudBean@outlook.com>
 * @license MIT
 * @copyright 2026 ©️ MrMudBean
 * @since 2026-01-26 19:56
 * @version 0.0.0
 * @lastModified 2026-06-15 21:23
 */
import { TimeTravel } from './class-time-travel';

import { loggerMiddleware } from './middle-ware-log';

import type {
  Middleware,
  Reducer,
  ReducerAction,
  StateManagerOptions,
} from './types';

/**
 * # 状态统一管理
 *
 * @example
 *
 * ```ts
 * import { StateManager } from '@vvi/state';
 *
 * interface Data {
 *   toy: number;
 *   age: number,
 *   name: string
 * }
 *
 * const manager = new StateManager<Data>((data, action)=> {
 *   switch(action.type) {
 *     case 'toy':
 *         // 正确用法，只更新当前的对应的值
 *         return {...data, toy: data.toy + 1 }
 *     case 'age':
 *         // 错误用法，即便同时更改了 `toy` 的值，也不会触发 `toy` 更新消息下发
 *         return {...data, toy: data.toy + 1, age: data.age + 1}
 *     default:
 *     return data;
 *  }
 * }, {
 *  toy: 0,
 *  age:
 * })
 *
 * // 数据订阅侧
 * const unsubscribe = manager.subscript({
 *  toy: (newValue: number) => console.log('铛铛铛铛，新玩具到。现在有玩具：'，newValue),
 * });
 *
 *
 * // 消费侧
 * manager.dispatch({
 *   type: name
 * });
 *
 * // 数据订阅侧取消订阅
 * unsubscribe(); // 取消订阅
 * ```
 */
export class StateManager<State extends object> {
  /** 消息订阅 Map 映射 */
  private readonly subscribers: {
    [K in keyof State]?: Set<(newValue: State[K]) => void>;
  } = {};

  private readonly subscriberAlls = new Set<(state: State) => void>();

  /** 当前的状态 */
  private currentState: State;

  /** 中间件 */
  private middleware: Middleware[] = [];

  /**
   *
   * @param reducer 消息处理机制
   * @param initialState 初始化状态
   * @param options 配置
   * @example
   *
   * ```ts
   * import { StateManager } from '@qqi/state';
   *
   * interface Data {
   *   toy: number;
   *   age: number,
   *   name: string
   * }
   *
   * const manager = new StateManager<Data>((data, action)=> {
   *   switch(action.type) {
   *     case 'toy':
   *         // 正确用法，只更新当前的对应的值
   *         return {...data, toy: data.toy + 1 }
   *     case 'age':
   *         // 错误用法，即便同时更改了 `toy` 的值，也不会触发 `toy` 更新消息下发
   *         return {...data, toy: data.toy + 1, age: data.age + 1}
   *     default:
   *     return data;
   *  }
   * }, {
   *  toy: 0,
   *  age:
   * })
   *
   * // 数据订阅侧
   * const unsubscribe = manager.subscript({
   *  toy: (newValue: number) => console.log('铛铛铛铛，新玩具到。现在有玩具：'，newValue),
   * });
   *
   *
   * // 消费侧
   * manager.dispatch({
   *   type: name
   * });
   *
   * // 数据订阅侧取消订阅
   * unsubscribe(); // 取消订阅
   * ```
   */
  constructor(
    private readonly reducer: Reducer<State>,
    initialState: State,
    private readonly options: StateManagerOptions = {},
  ) {
    this.currentState = initialState;
    this.middleware = options.middleware || [];
    this.options.plugins?.forEach(plugin => plugin.init?.(this)); // 初始化插件系统
  }

  /**
   * ## 获取当前状态
   */
  getState() {
    return this.currentState;
  }

  /**
   * ## 派发动作
   * @param action 动作执行者
   */
  dispatch(action: ReducerAction<State>): void {
    if (this.middleware.length === 0) return this.dispatchCore(action);
    // let currentMiddleware = this.middleware[0];
    const chineLast = (action: ReducerAction<State>) => {
      this.dispatchCore(action);
    };

    const chine = this.middleware.reduceRight((next, mw) => {
      let result = mw(this)(next);
      return () => {
        result(action);
        result = () => null; // 执行完毕后清理执行者，防止在单个中间件中多次 `next`
      };
    }, chineLast);

    chine(action);
  }

  /**
   *
   * @param action 执行的项
   */
  private dispatchCore(action: ReducerAction<State>) {
    // 前置钩子
    this.options?.beforeDispatch?.(action, this.currentState);
    const oldState = this.currentState;
    // 核心：状态更新
    this.currentState = this.reducer(this.currentState, action);
    // 后置钩子
    this.options?.afterDispatch?.(action, this.currentState);
    if (Object.is(oldState[action.type], this.currentState[action.type])) {
      this.currentState = oldState;
      return;
    } else {
      // 消息通知
      this.notifySubscribers(action.type);
    }
  }

  /**
   *
   * @param subscriber 消息订阅者们
   * @param subscriber.key 订阅的键
   */
  subscribe(
    subscriber: Partial<{
      [K in keyof State]: (newValue: State[K]) => void;
    }>,
  ): () => void {
    const keys = Object.keys(subscriber) as (keyof State)[];
    if (keys.length === 0) return () => null;

    // 收集订阅关系
    const unsubscribes = keys
      .map(key => {
        const callback = subscriber[key];
        if (!callback) return null;
        const set = this.subscribers[key] ?? new Set<() => void>();
        set.add(callback);
        this.subscribers[key] = set;
        return () => {
          const currentSet = this.subscribers[key];
          if (currentSet) {
            currentSet.delete(callback);
            if (currentSet.size === 0) {
              delete this.subscribers[key];
            }
          }
        };
      })
      .filter(Boolean);

    return () => unsubscribes.forEach(un => un?.());
  }

  /**
   * ## 订阅所有消息
   * @param callback 回调
   */
  subscribeAll(callback: (state: State) => void) {
    this.subscriberAlls.add(callback);
    return callback;
  }

  /** 全员广播 */
  private notifyAll() {
    this.forEach((set, key) =>
      set?.forEach(sub => sub(this.currentState[key])),
    );
  }

  /**
   *
   * @param callback 执行回调
   *    - set 回调方法参数一：监听者们
   *    - key 回调方法参数二：监听项
   */
  private forEach(
    callback: (
      set: Set<(newValue: State[keyof State]) => void>,
      key: keyof State,
    ) => void,
  ) {
    const keys = Object.keys(this.subscribers) as (keyof State)[];
    keys.forEach(
      key => this.subscribers[key] && callback(this.subscribers[key], key),
    );
  }

  /**
   *
   * @param key 通知的键
   */
  private notifySubscribers(key: keyof State) {
    this.forEach(
      (set, _key) =>
        key === _key && set.forEach(cb => cb?.(this.currentState[_key])),
    );
  }

  /**
   * ## 销毁状态
   */
  destroy() {
    this.options?.plugins?.forEach(plugin => plugin?.destroy?.()); // 插件销毁
    this.forEach((set, key) => (set?.clear(), delete this.subscribers[key]));
  }
}

export { TimeTravel, loggerMiddleware };

export type {
  ReducerAction,
  ReducerAction as QQIReducerAction,
  Reducer,
  Reducer as State,
  Reducer as QQIReducer,
  StateManagerOptions,
  Middleware,
  Middleware as ReducerMiddleware,
  Middleware as QQIReducerMiddleware,
  Plugin,
  Plugin as ReducerPlugin,
  Plugin as QQIReducerPlugin,
} from './types';
