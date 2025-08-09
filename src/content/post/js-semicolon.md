---
date: 2025-07-25
title: 'JavaScript 中必须用分号的场景'
tags: [
  'JavaScript',
  'Essay'
]
language: 'zh'
---

> 这是一篇短文，不会有过多的细节描述，可能会比较精简。

考虑以下代码：

```js
const world = 1
console.log("hello")
(world + 1).toString()
```

在 REPL 环境中执行这段代码，由于严格按行执行，所以不会报错，能正常运行。但是，如果作为一个文件执行，则会报错：

```plaintext frame="terminal"
TypeError: console.log("hello") is not a function. (In 'console.log("hello")(world + 1)', 'console.log("hello")' is undefined)
```

在这个例子中，报错信息直接指出了原因所在，不过在其他情况下报错信息不一定如此直观。报错原因如下：

1. `console.log("hello")` 的下一行跟随着一个括号。
2. 这附近的代码被解析为：将 `console.log("hello")` 返回的结果视作函数，然后调用这个函数。
3. 因为 `console.log("hello")` 的返回值为 undefined 而不是函数，所以失败报错。

也就是说，上述的代码等价于以下形式：

```js
const world = 1
const fn = console.log("hello")
fn(world + 1).toString()
```

为了解决这个问题，只需要在 `console.log("hello")` 后加上分号即可。这个例子说明了：在项目中最好统一使用带分号的代码风格，写的时候不一定要写分号（除非像这种特殊情况），可以由 formatter 自动整理代码。这也是为什么 prettier 默认风格带有分号。

下面是另一种有趣而常见的情况：

```js
let tim = 0, apple = 1
[tim, apple] = [apple, tim]
```

报错信息如下：

```plaintext frame="terminal"
ReferenceError: Cannot access uninitialized variable.
```

这里 `1[ ... ] = ...` 先被视作一次赋值表达式的左值，`[tim, apple]` 里的 `apple` 在同一条 `let` 声明内还没初始化。

常见需要显式分号（或行首补一个分号）避免黏连的行开头：

- `(` 可能被当成函数调用继续上一行
- `[` 可能被当成下标 / 继续上一行
- `+` `-` 可能与上一行合成一条表达式
- `/` 可能被当成除法（影响正则字面量）
