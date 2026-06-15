# @vvi/state

[![version](<https://img.shields.io/npm/v/@vvi/state.svg?logo=npm&logoColor=rgb(0,0,0)&label=版本号&labelColor=rgb(73,73,228)&color=rgb(0,0,0)>)](https://www.npmjs.com/package/@vvi/state) [![issues 提交](<https://img.shields.io/badge/issues-提交-rgb(255,0,63)?logo=github>)](https://github.com/MrMudBean/state/issues)

简易的状态管理。

## 安装

```bash
npm install --save @vvi/state
```

## 使用

通过 `StateManager` 构建简易的数仓，然后可订阅。在订阅后通过 `store.dispatch()` 派发消息

```ts
import { StateManager } from '@vvi/state';

interface DataType {
  counting: number;
  age: number;
  name: string;
}

const store = new StateManager<DataType>(
  (data, action) => {
    switch (action.type) {
      case 'counting':
        return { ...data, counting: data.counting + 1 };
      case 'age':
        return { ...data, age: data.age + 1 };
      case 'name':
      default:
        return data;
    }
  },
  {
    counting: 0,
    age: 10,
    name: 'tom',
  },
);

const unsubscribe = store.subscribe({
  counting: newValue => {
    console.log('新的计数值', newValue);
  },
});

store.subscribeAll(state => console.log('当前状态', state));

store.dispatch({
  type: 'age',
});

unsubscribe();
```

注意：

- 本着功能简单，订阅键只会在本键对应值触发更新后下发消息
- 对象类会使用 `Object.is()` 进行浅比较，如果直接修改原对象，可能不会触发消息下发
- 订阅键如果没有更改本订阅键对应值，而是更改了其他键值。不会触发消息，也不会触发值更新
- 订阅时请使用箭头函数作为回调，否则 `this` 丢失概不负责

## 使用日志插件

默认不携带日志，可通过日志插件 `loggerMiddleware` 开启

```ts
import { StateManager, loggerMiddleware } from '@vvi/state';

const state = new StateManager(
  (state, action) => {
    return state;
  },
  {},
  {
    middleware: [loggerMiddleware],
  },
);
```

## 使用时间旅行

默认不携带，可用于开发测试：

```ts
import { StateManager, TimeTravel } from '@vvi/state';

const state = new StateManager(() => {}, {});

const timeTravel = new TimeTravel(state);
```

## 执行钩子

提供了 `beforeDispatch` 和 `afterDispatch` 钩子。即便是数据未发生更新（消息未下发），钩子也将照常运行。

```ts
import { StateManager } from '@vvi/state';

interface DataType {
  counting: number;
  age: number;
  name: string;
}

const store = new StateManager<DataType>(
  (data, action) => {
    switch (action.type) {
      case 'counting':
        return { ...data, counting: data.counting + 1 };
      case 'age':
        return { ...data, age: data.age + 1 };
      case 'name':
      default:
        return data;
    }
  },
  {
    counting: 0,
    age: 10,
    name: 'tom',
  },
  {
    beforeDispatch: (action, state) =>
      console.log('数据尚未更新，旧数据为：', state),
    afterDispatch: (action, state) =>
      console.log(`本次更新 ${action}，更新后状态：`, state),
  },
);
```

## 自定义插件

插件本身不会在数据更新中触发，但是可以在初始化时拦截现有的派发动作以达成某些目的。

嗯，我没有想好怎么写好一个插件。

## 自定义中间键

中间键相对于插件来说要简单些，一个空的中间键，你只需 `state => next => action => next(action)`

参考 `loggerMiddleware` 源码

```ts
import type { Middleware } from '@vvi/state';

export const loggerMiddleware: Middleware = manager => next => action => {
  console.groupCollapsed('触发： ', String(action.type));
  console.log('上一个状态：', manager.getState());
  console.log('执行使用数据：', action?.payload ?? '');
  next(action);
  console.log('下一个状态：', manager.getState());
  console.groupEnd();
};
```

当然，如果你愿意，你可以：

```ts
import type { Middleware } from '@vvi/state';

export const justPlayingMiddleware: Middleware = manager => next => action => {
  next(action);
  next(action);
  next(action);
  next(action);
  next(action);
};
```

然而，他们只会触发一次。

如果在某个部分，你想拦截本地触发，你可以：

```ts
import type { Middleware } from '@vvi/state';

export const interceptMiddleware: Middleware = manager => next => action => {
  if (action.type !== 'name') next(action);
};
```

不显式调用 `next(action)` 会自动退出本次数据更新。

## 状态

此软件包是 `@mudbean` 生态系统的一部分。
它使用严格的 TypeScript 编写，并通过 Rollup 构建进行验证。
虽然单元测试较少，但 API 稳定，并在生产环境中大量使用。
