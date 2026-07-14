# 群小猴 ChatLens

群聊智能分析桌面客户端，基于 Electron + React + TypeScript 构建。

## 功能

- **群聊分析** — 选择群聊和时间范围，用 AI 分析聊天内容
- **定时监控** — 自动定时分析群聊动态，支持自定义间隔和指令
- **快捷模板** — 内置多种分析模板（总结、待办、关键发言等），支持自定义
- **结果导出** — 支持复制、Markdown 导出、长图导出
- **群名筛选** — 点击群名快速筛选该群所有分析记录
- **追问** — 对分析结果继续追问，深入挖掘
- **数据持久化** — 分析记录、监控配置、设置自动保存

## 系统要求

- **微信桌面版** 正在运行并已登录
- **Python 3.9+** 及 `wechat-cli`（Windows 首次启动自动安装）
- macOS 10.15+ / Windows 10+

## 安装

### 从源码运行

```bash
# 克隆仓库
git clone https://github.com/XiaoJ123-BIT/ChatLens.git
cd ChatLens

# 安装依赖
npm install

# 安装 wechat-cli
pip install wechat-cli

# 开发模式运行
npm run dev

# 打包
npm run dist
```

### 下载安装

前往 [Releases](https://github.com/XiaoJ123-BIT/ChatLens/releases) 下载对应平台安装包。

## 使用

1. 启动应用，确保微信正在运行
2. 在左侧列表展开群聊
3. 选择时间范围和分析模板
4. 点击「立即分析」查看结果
5. 可设置定时监控，自动分析群聊动态

## 技术栈

- [Electron](https://www.electronjs.org/) — 桌面应用框架
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) — 前端
- [Tailwind CSS v4](https://tailwindcss.com/) — 样式
- [Zustand](https://zustand.docs.pmnd.rs/) — 状态管理
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — 本地数据库
- [wechat-cli](https://github.com/0xpayne/wechat-cli) — 微信数据读取
- [electron-vite](https://electron-vite.org/) — 构建工具

## 配置

首次使用需要在「设置」中配置：

| 配置项 | 说明 |
|--------|------|
| API Key | AI 模型的 API Key |
| 模型 | 如 `glm-5`、`gpt-4o` 等 |
| API Base URL | API 接口地址 |
| wechat-cli 路径 | 留空自动检测 |

## License

MIT
