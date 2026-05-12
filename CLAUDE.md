# 个人网站 CLAUDE.md

## 项目概述
Angular 个人网站，包含个人简历、技术文章 两个模块。
无后端服务，所有数据存于项目内的 JSON / Markdown 文件。

## 运行环境
所有命令（`ng serve`、`ng build`、`npm install` 等）均需在 conda 的 `angular16` 环境下执行：
```bash
conda activate angular16
```

## 技术栈
- Angular 16
- TypeScript strict 模式
- Angular Router（懒加载路由）

## 数据约定
- **简历**：`assets/content/resumes/<slug>.md`，元数据在 `data/resumes.json`
- **文章**：`assets/content/articles/<slug>.md`，元数据在 `data/articles.json`
- 新增内容时，**同时更新对应的索引 JSON 文件**

## 编码规范
- 使用 NgModule（`app.module.ts`），新页面组件需在此声明
- 服务用 `providedIn: 'root'`，数据加载返回 `Observable` 而非 Promise
- 文件命名：`kebab-case`；类命名：`PascalCase`
- 路由统一在 `app-routing.module.ts` 注册
- 禁止在模板中使用 `any` 类型

## 禁止事项
- 不引入外部后端或数据库
- 不使用 `HttpClient` 请求外部 API（数据均为本地资源）
- 不安装非必要的第三方库，新增依赖前先确认
- 不修改 `data/*.json` 的字段结构（除非同步更新所有相关代码）

## 部署
- 托管于 GitHub Pages，通过 GitHub Actions 自动构建发布。
- 自定义域名，无子路径。

## 关键文件位置
- 路由注册：`src/app/app-routing.module.ts`
- 模块声明：`src/app/app.module.ts`
- 导航栏：`src/app/core/components/navbar/navbar.component.ts`
- 全局样式 & Design Tokens：`src/styles.css`
- 数据服务：`src/app/core/services/feed-data.service.ts`
- 数据模型：`src/app/shared/models/feed-item.model.ts`
- 页面组件目录：`src/app/pages/<name>/<name>.component.{ts,html,css}`
- 本地数据文件：`data/resumes.json`、`data/articles.json`、`data/bookmarks.json`

## 参考文档（按需引入）
- @docs/content-schema.md   # 所有内容的数据结构定义
- @README.md               # 项目背景与部署说明