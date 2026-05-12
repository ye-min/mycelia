# Claude Code + 本地大模型完整使用指南

> 基于实际使用经验整理，包含原理、配置、模型选择、工作流规划。

---

## 一、核心原理

### Claude Code 是什么

Claude Code 本质上只是一个**终端客户端程序**，它把你的输入组装成 API 请求发出去。发给谁，完全取决于环境变量的配置，与 Anthropic 本身没有强制绑定。

### 两个关键环境变量

| 变量 | 作用 |
|---|---|
| `ANTHROPIC_BASE_URL` | 请求发到哪里（Anthropic 服务器 or 本地 Ollama） |
| `ANTHROPIC_MODEL` | 请求体里带什么模型名 |

### 请求链路对比

**使用 Claude 原生模型：**
```
Claude Code → https://api.anthropic.com → Claude Sonnet/Opus
```

**使用本地 Qwen：**
```
Claude Code → http://localhost:11434 → Ollama → qwen3-coder:30b
```

设置了本地模式后，`api.anthropic.com` 完全不在链路里，**不消耗任何 Claude token，数据不出本机**。

---

## 二、Ollama 的工作方式

### 为什么端口是 11434

11434 是 Ollama 的默认监听端口，硬编码的默认值，类似 MySQL 用 3306。执行 `ollama serve` 后自动在此端口启动。

### 所有模型共用一个端口

Ollama 是模型调度中心，所有模型通过同一端口提供服务，通过模型名区分：

```
http://localhost:11434
        ↓
    Ollama 服务
    ├── qwen3-coder:30b
    ├── gemma4:27b
    └── deepseek-coder-v2
```

切换模型只需改模型名，端口不变。但**同一时刻只有一个模型加载在内存里**，切换时有冷启动等待。

### Ollama 内置了 Anthropic API 兼容层

Claude Code 使用 Anthropic 的 `/v1/messages` 格式，Ollama 新版已内置翻译层，无需额外代理即可直接对接，**翻译工作在 Ollama 内部完成**。

（注：llama.cpp 裸部署只有 OpenAI 格式，才需要额外代理）

### API Key 为什么填 ollama

Claude Code 代码层面要求 Auth 字段不能为空，但 Ollama 本地运行不验证 Key，收到请求后直接处理。所以：

- `ANTHROPIC_AUTH_TOKEN=ollama`：填充必须存在的 Auth 头，Ollama 收到后忽略
- `ANTHROPIC_API_KEY=""`：防止 Claude Code 因 Key 为空在本地提前报错

填 `ollama` 只是约定俗成的占位符，写任何值都可以。

---

## 三、模型切换原理与限制

### 切换规则

```
同一后端之间（原生 ↔ 原生，Ollama ↔ Ollama）
  → 只需改模型名
  → 会话内 /model 命令即可，无需退出

跨后端（原生 ↔ Ollama）
  → 必须同时改 BASE_URL + MODEL
  → 必须退出，重置环境变量，重新启动
```

### 为什么 /model sonnet 在 Ollama 模式下无效

`/model` 只改请求体里的模型名字段，**不改 BASE_URL**。流量还是发到 Ollama，Ollama 找不到叫 `sonnet` 的模型，直接报错。

### 切换能力总结

| 切换类型 | 是否需要退出 | 方法 |
|---|---|---|
| 原生 Sonnet → 原生 Opus | ❌ 不需要 | `/model opus` |
| 原生模型之间任意切换 | ❌ 不需要 | `/model <名称>` |
| Ollama 模型之间任意切换 | ❌ 不需要 | `/model <模型名>` |
| **原生 → Ollama** | ✅ **必须退出** | 退出后重新启动 |
| **Ollama → 原生** | ✅ **必须退出** | 退出后重新启动 |

---

## 四、环境配置

### Shell 函数（一次配置，永久生效）

在 `~/.zshrc` 或 `~/.bashrc` 中添加：

```bash
# 使用 Claude 原生 Sonnet（Pro 订阅用户，无需 API Key）
function cc-sonnet() {
  unset ANTHROPIC_BASE_URL
  unset ANTHROPIC_AUTH_TOKEN
  unset ANTHROPIC_MODEL
  unset ANTHROPIC_API_KEY      # Pro 订阅用账号登录，不需要 Key
  claude "$@"
}

# 使用 Claude 原生 Opus（复杂任务）
function cc-opus() {
  unset ANTHROPIC_BASE_URL
  unset ANTHROPIC_AUTH_TOKEN
  unset ANTHROPIC_MODEL
  unset ANTHROPIC_API_KEY
  claude --model opus "$@"
}

# 使用本地 Qwen3-Coder-30B（日常编码，免费）
function cc-qwen() {
  export ANTHROPIC_BASE_URL=http://localhost:11434
  export ANTHROPIC_AUTH_TOKEN=ollama
  export ANTHROPIC_API_KEY=""
  export ANTHROPIC_MODEL=qwen3-coder:30b
  claude "$@"
}

# 使用本地 Gemma 4（可选）
function cc-gemma() {
  export ANTHROPIC_BASE_URL=http://localhost:11434
  export ANTHROPIC_AUTH_TOKEN=ollama
  export ANTHROPIC_API_KEY=""
  export ANTHROPIC_MODEL=gemma4:27b
  claude "$@"
}

# 查看当前配置
function cc-status() {
  echo "BASE_URL  : ${ANTHROPIC_BASE_URL:-（未设置，使用 Anthropic 官方）}"
  echo "MODEL     : ${ANTHROPIC_MODEL:-（未设置，使用默认）}"
  echo "API_KEY   : ${ANTHROPIC_API_KEY:+已设置}${ANTHROPIC_API_KEY:-（未设置）}"
  echo "AUTH_TOKEN: ${ANTHROPIC_AUTH_TOKEN:-（未设置）}"
}
```

> **重要**：Pro 订阅用户在原生模式函数里必须用 `unset ANTHROPIC_API_KEY`，而不是赋值。
> 如果环境里残留 Key，Claude Code 会优先用 Key 鉴权而不是你的 Pro 账号登录状态。

配置完成后执行：
```bash
source ~/.zshrc
```

### 推荐工作方式：双终端并行

```
终端标签页 1：cc-qwen    （日常编码，常驻）
终端标签页 2：cc-sonnet  （复杂问题，按需切换）
```

两个会话独立运行，不需要来回退出，遇到复杂问题直接切到 Sonnet 标签页。

---

## 五、Qwen 命名体系说明

Qwen 有两条独立的产品线，容易混淆：

| 系列 | 定位 | 代表型号 |
|---|---|---|
| **Qwen3.5** | 通用多模态系列（2026.2 发布） | Qwen3.5-35B-A3B、27B、397B |
| **Qwen3-Coder** | 专门编码系列 | Qwen3-Coder-30B-A3B、Qwen3-Coder-Next |

**没有"Qwen3.5-Coder"这个型号。**

`Qwen3-Coder-Next` 是 Qwen3-Coder 系列里的第三个型号，80B 总参数但每次只激活 3B，专门为编码 agent 和本地开发优化，不是 Qwen3.5 系列。

---

## 六、本地模型能力对比

### Qwen3-Coder-30B vs Claude Sonnet 4.6

| 指标 | Qwen3-Coder-30B | Sonnet 4.6 |
|---|---|---|
| SWE-bench Verified | ~70.6% | **79.6%** |
| 上下文窗口 | 160K | 200K |
| 多模态 | ❌ | ✅ |
| 本地运行 | ✅ 免费 | ❌ |
| 内存需求 | ~14GB | — |

**Sonnet 明显领先的场景：**
- 不常见语言特性（高级 TypeScript 类型等）
- 跨多文件架构推理
- 模糊需求的意图理解
- 复杂 Bug 排查

**Qwen3-Coder 完全胜任的场景（日常 80%+ 工作）：**
- 标准 CRUD 组件生成
- HTTP Service 封装
- 常见框架代码（Angular、React、FastAPI 等）
- 重构、注释、文档

### Gemma 4 vs Qwen3-Coder（编码维度）

| 指标 | Qwen3-Coder-30B | Gemma 4 31B |
|---|---|---|
| 编码专项训练 | ✅ 专门针对编码 | ⚠️ 通用模型 |
| LiveCodeBench | ~70% | **80%** |
| SWE-bench（工程编码） | 70.6% | **未公布**（不代表不行） |
| Codeforces ELO | 未公布 | **2150（竞赛级）** |
| 需求理解/指令遵循 | 中等 | ✅ 继承 Gemini 3，普遍反馈更好 |
| 内存需求 | ~14GB | 26B MoE 只需 ~8GB |
| 多模态（看截图写代码） | ❌ | ✅ |
| 中文理解 | ✅ 更强 | 一般 |

**关键认知**：Gemma 4 在 LiveCodeBench（竞赛/算法题）上领先，但没有公布 SWE-bench（真实工程任务）数据。两者各有优势，**最准确的判断是用你自己的真实需求测试两个模型**。

---

## 七、CLAUDE.md 对本地模型的效果

CLAUDE.md 本质是自动注入到每次对话开头的文本，与模型无关，任何模型都会收到。

**对 Qwen/Gemma 有效：**
- 项目目录结构、技术栈声明
- 命名规范、禁止事项
- 接口定义和数据模型

**效果打折扣：**
- 模糊的质量要求（"保持代码优雅"）
- 复杂的跨模块架构约定

**对本地模型写 CLAUDE.md 的核心原则：**

```markdown
# 差的写法
遵循 Angular 最佳实践，保持代码简洁。

# 好的写法
## 错误处理规范
所有 HTTP 请求必须使用以下模式：

service.getData().pipe(
  catchError(err => {
    this.errorService.handle(err);
    return EMPTY;
  })
).subscribe()
```

**把规范变成可复制的代码模板**，本地模型照着模板生成的一致性远高于理解抽象描述。

### 引用外部项目作为参考

| 方式 | 模型实际读到内容 | 推荐度 |
|---|---|---|
| CLAUDE.md 里写路径 | ❌ 只看到字符串 | 不推荐 |
| `--add-dir /path/to/ref` | ✅ 可按需读取 | ✅ 推荐 |
| 会话内手动让它读文件 | ✅ 完整读取 | ✅ 推荐 |
| 关键代码粘贴进 CLAUDE.md | ✅ 每次自动注入 | ✅ 推荐（内容不多时） |

---

## 八、中等规模项目混合使用策略

### 任务分配原则

```
模式化 + 低风险   →  Qwen/Gemma（本地免费）
模式化 + 高风险   →  本地生成，人工 Review
非模式化 + 高风险  →  Sonnet
非模式化 + 低风险  →  视 token 预算决定
```

### 交给本地模型（免费）

- 标准 CRUD 组件（列表、表单、删除弹窗）
- HTTP Service 封装、拦截器模板
- 路由配置、懒加载模块
- 简单表单验证
- Interface/Model 定义
- 单元测试骨架、代码注释
- 代码重构、格式整理

### 交给 Sonnet（付费）

- 整体架构设计、模块划分
- 复杂状态管理（NgRx）
- 权限与路由守卫
- 跨模块共享逻辑
- 复杂业务规则
- 关键 Bug 排查
- 上线前 Code Review

### 什么时候立即切换到 Sonnet

```
🚨 切换信号：
  ├── 同一问题修了 3 次还是错
  ├── 生成的代码自己看不懂逻辑
  ├── 涉及安全（认证、权限、数据脱敏）
  ├── 这个决策会影响超过 5 个文件
  └── 需求本身还不确定，需要讨论方案
```

让本地模型反复试错消耗的是你的时间，时间成本远高于 Sonnet 的 token 费用。

### 项目各阶段工作流

```
阶段一：项目启动（重 Sonnet）
  用 Sonnet 完成架构设计、模块划分、核心 Interface 定义
  产出标准模板文件 → 后续 Qwen 对齐这个标准生成代码

阶段二：功能开发（主用本地模型）
  Qwen/Gemma 生成骨架 → 人工快速 Review → 复杂部分交 Sonnet

阶段三：集成联调
  本地模型：修改接口字段、调整路由
  Sonnet：跨模块数据流问题、权限逻辑

阶段四：上线前
  Sonnet 做一次整体 Code Review（集中使用，不分散）
```

### 给本地模型的高效提示词模板

```
## 背景
项目：Angular 17，Standalone Component，Reactive Forms
目录结构：[粘贴目录结构]
已有 Interface：[粘贴相关 Interface]

## 任务
为 [模块名] 生成 [具体内容]

## 要求
- 遵循已有文件的命名风格
- 错误处理使用 catchError + ErrorService
- 不要生成注释

## 参考示例
[粘贴一个已有的类似文件]
```

提供"参考示例"是提升本地模型输出一致性最有效的方式。

---

## 九、常见问题

**Q：执行 cc-qwen 后，会消耗 Claude Pro 的 token 吗？**

不会。请求完全在本地闭环，Anthropic 服务器收不到任何请求，不消耗额度，不产生费用。

**Q：同一个 Ollama 端口能跑多个模型吗？**

端口相同，但同一时刻只有一个模型加载在内存里。切换时 Ollama 自动卸载当前模型、加载新模型，有几秒到几十秒的冷启动等待。

**Q：cc-sonnet 里为什么用 unset 而不是赋值空字符串？**

`export VAR=""` 变量还存在（值为空），某些程序会检测变量是否存在而不是值是否为空。`unset VAR` 才是彻底删除变量，确保 Claude Code 完全感知不到它。

**Q：CLAUDE.md 写了外部路径，模型会去读吗？**

不会。CLAUDE.md 里写路径只是一段文字，Claude Code 不会自动读取。需要用 `--add-dir` 参数或在会话内明确让它读取文件。

**Q：Gemma 4 没公布 SWE-bench，是不是代表它不行？**

不能这样推断。没公布可能是还没测，也可能数据不够好看。SWE-bench 未公布不等于工程编码能力差。最准确的判断是用自己的真实需求对比测试两个模型。
