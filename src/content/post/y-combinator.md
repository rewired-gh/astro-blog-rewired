---
date: 2026-02-24
title: '从发明的角度看 Y 组合子'
tags: [
  'Math'
]
language: 'zh'
---

> 提示：本文中不区分函数和高阶函数（泛函、算子）。

## 引言

Y 组合子的定义不算复杂，不过原理不算直观。如果考虑惰性求值，并实际追踪一个具体例子的运算过程，一般都能很清晰地感受到 Y 组合子的运算原理。但是，这个组合子究竟是如何凭空冒出来的呢：

$$
\lambda f.\;(\lambda x.\;f\;(x\;x))(\lambda x.\;f\;(x\;x))
$$

总不可能是猴子打字机试出来的，Alonzo Church 一定是通过数学分析、演绎法、惊人的注意力找到 Y 组合子的。本文不一定按照 Alonzo Church 当时的思路，只是尝试使用最符合直觉的方式凭空构造出 Y 组合子，以求对其原理有更本质的认知。为了方便表述，后文均以经典的阶乘函数为例，有时使用 Haskell 代码代替数学公式。

## 在 λ 演算中表示递归函数

如果不用 λ 演算，阶乘函数的递归定义很简单：

```haskell
factorial :: Integer -> Integer
factorial 0 = 1
factorial n = n * factorial (n - 1)
```

这种定义中，factorial 需要自指，然而在 λ 演算中做不到。一种比较直观的解决方法是：将自己重复定义一遍，然后传给自己，这样就可以使用「自己的克隆」。具体的定义如下（不妨称作「雏形」），由于 Haskell 的限制，类型定义仍然存在自指：

```haskell
newtype RecFunc = RF (RecFunc -> Integer -> Integer)
factorial :: Integer -> Integer
factorial =
  (\(RF f) n ->
    if n == 0
      then 1
      else n * f (RF f) (n - 1)
  )
  (RF (\(RF f) n ->
    if n == 0
      then 1
      else n * f (RF f) (n - 1)
  ))
```

至此，我们已经完成了任务，而且解决方法非常直观。

## 好用的工具

如果数学是哲学，哲学是工具，则数学是工具。作为工具，当然应该尽量好用，这种好用往往意味着：

1. 直观上、共识上的优雅（事实上，如果无法达成共识，则无法探讨哲学）；
1. 使用者只需付出严格的最小代价；
1. 如果使用者不关心某一个部分，则对应的部分被抽象化。

回顾不使用 λ 演算的递归函数定义，我们需要跳出 λ 演算的游乐园，引入了额外的工具，然而这些工具是不必要的。对于「雏形」，我们仍然在 λ 演算的游乐园中玩，没有引入额外的工具，但是付出了重复定义相同函数的代价。

如果我们想付出最小代价，则需要发明好用的工具，把「重复定义一次函数，然后塞给自己」这件事情抽象化。

## 从具体例子演绎

考虑「雏形」，如果想要计算 factorial 2，则需要经过以下的步骤（为了方便直观理解，每一步的 factorial 函数都有自己的命名，然而实际上都是一样的函数）：

1. 将 factorial 2 表示为 $f_2\;f_2'\;2$；
1. $f_2$ 接收 $f_2'$，吐出 $n_2\cdot (f_2'\;f_2'\;(n_2 - 1))$；再接收 2，吐出 $2\cdot (f_2'\;f_2'\;1)$，亦可理解成吐出 $2\cdot (f_1\;f_1'\;1)$；
1. $f_1$ 接收 $f_1'$，吐出 $n_1\cdot (f_1'\;f_1'\;(n_1 - 1))$；再接收 1，吐出 $1\cdot (f_1'\;f_1'\;0)$，亦可理解成吐出 $1\cdot (f_0\;f_0'\;0)$；
1. $f_0$ 接收 $f_0'$，吐出 $n_0\cdot (f_0'\;f_0'\;(n_0 - 1))$；再接收 0，没有用到 $f_0'，$吐出 1；
1. $f_0\;f_0'\;0=1\rightarrow f_1\;f_1'\;1 = 1\cdot (f_1'\;f_1'\;0)=1\cdot (f_0\;f_0'\;0)=1$；
1. $f_1\;f_1'\;1=1\rightarrow f_2\;f_2'\;2 = 2\cdot (f_2'\;f_2'\;1)=1\cdot (f_1\;f_1'\;1)=2$。

我们的目标是发明好用的工具，使得不需要重复定义 $f_2'$，于是演绎出给 factorial 2 再加一层包装，姑且称之为 wrapper：

```haskell
newtype RecFunc = RF (RecFunc -> Integer -> Integer)
wrapper :: RecFunc -> Integer -> Integer
wrapper = \f'@(RF f) -> (\n -> f f' n)
```

直接利用 wrapper 工具，即可解决前文提到重复定义的问题：

```haskell
factorial :: Integer -> Integer
factorial = wrapper $ RF $ \f n ->
  if n == 0
    then 1
    else n * (wrapper f (n - 1))
```

## U 组合子

具体的例子确实会更易于理解，不过之前定义的 wrapper 和 factorial 的定义是耦合的，只能包裹一个 `RecFunc` 类型的函数。如果我们尝试将 wrapper 泛化，就会得到 U 组合子：

```haskell
newtype U a = U (U a -> a)
u :: U a -> a
u f'@(U f) = f f'
factorial :: Integer -> Integer
factorial = u $ U $ \f n ->
  if n == 0
    then 1
    else n * (u f (n - 1))
```

数学表达形式：

$$
U = \lambda x.\;x\;x
$$

不妨把这种 factorial 定义称作「雏形 Pro」。「雏形 Pro」其实已经很完美了，但是架不住数学家都有强迫症，不难发现有这些「缺陷」：

1. U 组合子并不是「改造 factorial 原始定义的机器」，而是「factorial 定义时使用的工具」；
1. 「雏形 Pro」需要使用两次 U 组合子工具。

## 工具 vs. 改造机器

如果再仔细一点观察，会发现「雏形 Pro」具有自相似性，考虑 factorial 2 的伪代码：

```haskell
-- 外部形状：u f 2
factorial 2 = u (\f n -> ...) 2

-- 展开
factorial 2 = u (\f n ->
  if n == 0
    then 1
    else n * (u f (n - 1))
) 2

-- 内部的相似部分
u f (n - 1)
```

目前为止，我们定义「factorial 生成器」时用到的「引擎」是 f，那么能不能更进一步，把 `u f`（即最终的 factorial 函数）作为「引擎」来定义「factorial 生成器」呢？这样一来，就能解决前文中提到的「缺陷」。在这种愿景下，可以得到如下定义：

```haskell
factGen :: (Integer -> Integer) -> (Integer -> Integer)
factGen = \x -> (\n ->
  if n == 0
    then 1
    else n * (x (n - 1)))
```

可以看到，factGen 定义了最终的 factorial 函数所需要的核心逻辑。factGen 渴望接收一个最终的 factorial 函数（或等价物），然后吐出最终的 factorial 函数，即使最终的 factorial 函数还没被构造出来，即：

$$
factGen\;factorial = factorial
$$

到此为止，我们需要从演绎的视角切换到分析的视角。假设有一个「改造机器」Y 存在，能够将 factorialGen 改造成 factorial，即：

$$
Y\;factGen = factorial
$$

代入后得到：

$$
Y\;factGen = factGen\;factorial = factGen\;(Y\;factGen)
$$

## 注意力惊人

观察上文中最后一个公式，不难注意到 $Y\;factGen$ 是 factGen 的不动点！由于 Y 应当能接收各种各样的「递归函数生成器」，而不是局限于 factGen，这意味着 Y 满足以下约束条件，使得 $Y_g = Y\;g$ 是 g 的不动点：

$$
\forall g\;(Y\;g = g\;(Y\;g)) \Leftrightarrow \forall g\;(Y_g = g\;Y_g)
$$

从上述公式的结构可以注意到：**$Y_g$ 的定义必然有自相似部分**，且在 λ 演算中不允许自指。回顾 U 组合子的定义，我们注意到 U 组合子可以构造出自相似部分：

$$
U\;x = x\;x,\quad U\;U = (\lambda x.\;x\;x)(\lambda x.\;x\;x) \rightarrow_\beta [x \colonequals x\;x](x\;x) \twoheadrightarrow_{\beta} U\;U
$$

U 组合子看起来只会原地踏步，没什么用，不过启发了我们**可以通过自应用构造出自相似部分**。不妨试试利用这种自应用模式，构造 $Y_g = W_g\;W_g$，那么：

$$
W_g = \lambda x.\;\text{Body},\quad Y_g = W_g\;W_g = (\lambda x.\;\text{Body})\;W_g \rightarrow_\beta [x \colonequals W_g]\text{Body}
$$

由于我们的目标是 $Y_g = g\;Y_g$，所以迫切需要构造出符合条件的 Body，使得：

$$
[x \colonequals W_g]\text{Body}=g(W_g\;W_g)
$$

**不 难 注 意 到**，我们现在能玩的字母只有 x、g，而且既要在外面凑出一个 g，又要在里面凑出一个自应用，那么**显 然 可 以 试 试**：

$$
\text{Body}=g\;(x\;x)
$$

看起来挺像样的，让我们从头验证一下：

$$
\forall g\;(Y_g = W_g\;W_g = (\lambda x.\;g\;(x\;x))\;W_g = g\;(W_g\;W_g) = g\;Y_g)
$$

哇，不早说，**居 然 可 以 诶**！别急，让我们再套多一层，把 Y 组合子定义出来：

$$
Y = \lambda g.\;(\lambda x.\;g\;(x\;x))\;(\lambda x.\;g\;(x\;x))
$$

多亏了注意力，我们成功把 Y 组合子这个「改造机器」发明出来了。

## 利用 Y 组合子编写阶乘函数

现在，让我们收割果实，看看如何利用这个「改造机器」来重塑最初的阶乘函数：

```haskell
-- g 即 factGen，它是一个接收「函数」并返回「函数」的高阶函数
factGen :: (Integer -> Integer) -> (Integer -> Integer)
factGen = \x -> (\n ->
  if n == 0
    then 1
    else n * (x (n - 1)))

-- Y 组合子的 Haskell 定义（注：需在惰性求值环境下，或使用特殊的递归类型绕过类型检查）
y = \g -> (\x -> g (x x)) (\x -> g (x x))

-- 最终的阶乘函数
factorial = y factGen
```
