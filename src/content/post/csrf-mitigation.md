---
date: 2025-06-07
title: "如何正确地防御CSRF攻击"
tags: [
  'Web Dev',
  'Security',
]
language: 'zh'
---

## 引言

CSRF（跨站请求伪造）是一种常见的 Web 安全攻击 ~~（也是找工作时面试官最喜欢问的问题之一，但是往往面试官自己都一知半解）~~，攻击者可以诱导用户无意识地发出带有认证信息的恶意请求（如转账、改资料等敏感操作）。需要注意的是，虽然 CSRF 可以通过缓解措施阻止攻击，但如果存在 XSS（跨站脚本攻击）漏洞，多数 CSRF 缓解措施都可能失效。

在实际应用中，应当遵循以下步骤选择多个合适的 CSRF 缓解措施：

1. 确保无 XSS 漏洞。
2. 若框架提供了 CSRF 缓解措施，则尽量使用框架自带的，否则考虑下一个步骤。
3. 使用 CSRF token 保护所有引发状态变化的请求，依次考虑：
  - **有状态应用**：采用同步 token 模式。
  - **无状态应用**：采用具备签名的双重提交 Cookie。
4. 对于高度敏感的操作，采用用户介入的一次性 token。
5. 考虑「辅助措施」。
6. 引发状态变化的请求禁止使用 `GET` 方法。

网络上有很多关于 CSRF 缓解措施的文章，但是大多数文章都存在不严谨、过时、基础事实错误、结构混乱等问题，以至于主流的 LLMs 都不同程度受到信息污染。本文将综合多个可信来源，尝试严谨地说明如何在 mission-critical 的项目中选择 CSRF 缓解措施。

从最高层级来看，CSRF 缓解措施的本质在于：

1. CSRF 利用同源的 Cookie 在请求发出时自动携带的特性。
2. 浏览器的 SOP（同源策略）能阻止其他网站读取跨源请求结果，但是默认不会阻止发出跨源请求。
3. 缓解措施的关键在于递交「同源证明」：针对第 1 条，采用其他方式携带 token；利用第 2 条，通过请求结果获得 token，并保证只有同源请求能获得 token。
4. 浏览器自动添加的「同源证明」不一定可信，所以往往需要开发者构造。

## 主要措施

### 同步 token 模式

此措施的核心流程如下：

1. 服务端为每个 session 绑定强随机的 token，通过安全的方式传输到客户端。
2. 客户端以非 Cookie 的形式携带 token 发送请求（避免了 CSRF 利用的 Cookie 自动携带）。
3. 服务端校验 token 的有效性。

将 token 传输给客户端的常见方式如下，需要根据具体的架构和场景选择：

- 注入在 HTML 的 `<form>`、`<meta>` 等位置，一般在 SSR（服务端渲染）中实现。
- 在 JavaScript 中通过 fetch 获得。

客户端携带 token 发送请求的常见方式如下，其他携带方式可能会扩大潜在的攻击面 ~~（红队的脑洞永远猜不透）~~：

- 通过自定义的 header 携带。
- 通过 JSON payload 中的字段携带。

### 具备签名的双重提交 Cookie

相较于「同步 token 模式」，此缓解措施不需要在服务端持久化额外的信息，适合无状态应用。「具备签名的双重提交 Cookie」这个名称其实有点误导性，因为此措施在最初提出后经过了改进和泛化，而最初提出的实现其实是不安全的（例如[子域劫持攻击](https://owasp.org/www-chapter-london/assets/slides/David_Johansson-Double_Defeat_of_Double-Submit_Cookie.pdf)）。

此措施的核心流程如下：

1. 服务端保管密钥，使用安全的算法（如 HMAC）生成 session 信息（如 session ID、JWT 中的 UUID）的签名，通过安全的方式传输签名到客户端。
2. 客户端以非 Cookie 的形式携带签名发送请求（避免了 CSRF 利用的 Cookie 自动携带）。
3. 服务端使用相同的算法生成签名，校验客户端发送的签名是否有效。

在传输和携带方式方面，此措施和「同步 token 模式」类似。一些文章可能会提及其他的传输方式，但是这些传输和携带方式可能会扩大潜在的攻击面，因此保险起见不建议使用。可以思考一下这个问题：如果能保证用户的浏览器循规蹈矩，以及不存在 XSS 漏洞，那么后文中的「header 校验」足以阻止 CSRF 攻击，实现这些复杂机制的意义又在哪里呢？

### Cookie 作用域限制

如果网站使用 Cookie 存储和管理 token，那么限制 Cookie 作用域就能阻止绝大多数 CSRF 攻击。在服务端发送给客户端 `Set-Cookie` header 时，需要配置这些属性：

- `SameSite`：允许服务端声明 Cookie 不应随跨站点请求一起发送。此属性有以下值：
  - `Strict`：Cookie 仅在第一方上下文中发送，即仅当请求来自最初设置 Cookie 的站点时。
  - `Lax`：Cookie 在大多数情况下不随跨站点请求一起发送，但允许在用户从外部站点导航到原始站点时（如通过链接）发送。**这是大多数现代浏览器的默认设置**，在安全性和可用性之间提供了良好的平衡。
  - `None`：Cookie 将随所有请求（包括跨站点请求）一起发送。如果使用此设置，则必须同时指定 `Secure` 属性，这意味着 Cookie 只能通过 HTTPS 发送。此设置通常用于需要跨站点共享 Cookie 的场景，例如 SSO（单点登录）或第三方嵌入内容。
- `HttpOnly`：指示浏览器不允许通过 JavaScript 访问 Cookie。这意味着即使站点存在 XSS 漏洞，攻击者也无法通过脚本窃取设置了 `HttpOnly` 属性的 Cookie。虽然 `HttpOnly` 主要用于防止 XSS 攻击窃取会话 Cookie，但它也间接增强了 CSRF 防护，因为攻击者无法轻易获取用于伪造请求的 Cookie。

某些浏览器支持通过 Cookie 前缀增强安全性：

- `__Secure-`：要求 Cookie 必须设置 `Secure` 属性，且只能通过 HTTPS 发送。
- `__Host-`：要求 Cookie 必须设置 `Secure` 属性，且不能设置 `Domain` 属性，且 `Path` 必须为 `/`。

但是，一些不符合现代 Web 规范的浏览器可能存在漏洞，且此缓解措施可能会导致跨站工作流中断。例如，`SameSite=Strict` 设置可能会阻止用户在跨站点导航后保持登录状态，而不使用的话可能存在安全隐患（如 [dirty dancing](https://labs.detectify.com/writeups/account-hijacking-using-dirty-dancing-in-sign-in-oauth-flows)）。

## 辅助措施

### header 校验

浏览器在发送跨站请求时会自动添加一些特定的 HTTP header，通过验证这些 headers 可以检测大多数 CSRF 攻击，常见的校验 headers 包括：

- `Origin`：包含了发起请求的页面的源（协议、域名和端口）。浏览器会在所有跨域请求中自动添加此 header，且**无法被 JavaScript 修改**。
- `Referer`：包含了发起请求的完整 URL（不仅仅是源）。豆知识：`Referer` 虽然是 Web 标准中的写法，但其实是拼写错误，正确拼写是 `Referrer`。

此外，还有一些专用的 headers 可用于校验，具体可参考：[Fetch Metadata Request Header](https://developer.mozilla.org/zh-CN/docs/Glossary/Fetch_metadata_request_header)

但是，这些 headers 在某些情况下可能为空或不存在，例如使用浏览器的隐私模式、某些代理服务器等。此外，一些不符合现代 Web 规范的浏览器不能保证这些 headers 的可信，所以此措施并不能保证阻止 CSRF 攻击。

### 禁止部分内容类型

API 端点校验内容类型，对于大多数接受 JSON 的 API 端点应该禁止 `application/x-www-form-urlencoded`、`multipart/form-data`、`text/plain` 这些内容类型。

## 参考资料

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#token-based-mitigation)
- [MDN Web Docs: CSRF](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF)
- [Double Defeat of Double-Submit Cookie](https://owasp.org/www-chapter-london/assets/slides/David_Johansson-Double_Defeat_of_Double-Submit_Cookie.pdf)
- [Account Hijacking Using Dirty Dancing](https://labs.detectify.com/writeups/account-hijacking-using-dirty-dancing-in-sign-in-oauth-flows/)
- [美团技术团队：Web 安全之 CSRF 攻击](https://tech.meituan.com/2018/10/11/fe-security-csrf.html)