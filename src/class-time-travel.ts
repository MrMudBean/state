/**
 * @module @qqi/state/class-time-travel
 * @file class-time-travel.ts
 * @description 时间旅行模块
 * @author MrMudBean <Mr.MudBean@outlook.com>
 * @license MIT
 * @copyright 2026 ©️ MrMudBean
 * @since 2026-01-26 19:59
 * @version 0.0.0
 * @lastModified 2026-06-12 15:33
 */

import type { StateManager } from './index';

/**
 * ## 时间旅行模块
 *
 * @example
 *
 * ```ts
 * import { StateManager, TimeTravel } from '@qqi/state';
 *
 * const store = new StateManager(...);
 *
 * new TimerTravel(store);
 * ```
 */
export class TimeTravel<State extends object> {
  private history: State[] = [];
  private currentIndex = -1;

  /**
   *
   * @param manager
   * @param maxHistory
   */
  constructor(
    private manager: StateManager<State>,
    private maxHistory = 100,
  ) {
    // 保存初始状态
    this.saveState(manager.getState());

    // 拦截dispatch
    const originalDispatch = manager.dispatch.bind(manager);
    manager.dispatch = action => {
      originalDispatch(action);
      this.saveState(manager.getState());
    };
  }

  /**
   *
   * @param state
   */
  saveState(state: State) {
    // 截断未来历史
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push(structuredClone(state));
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.currentIndex = this.history.length - 1;
  }

  /**
   * ## 重做
   */
  undo() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.manager.dispatch({
        type: '__TIME_TRAVEL__' as keyof State,
        payload: this.history[this.currentIndex],
      });
    }
  }

  /**
   * 重试
   */
  redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      this.manager.dispatch({
        type: '__TIME_TRAVEL__' as keyof State,
        payload: this.history[this.currentIndex],
      });
    }
  }
}
