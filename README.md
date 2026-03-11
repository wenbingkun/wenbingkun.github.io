# wenbingkun.github.io

个人主页与若干独立工具页面的集合仓库。

当前仓库保留 3 类内容：
- GitHub Pages 主页
- 2 个可直接打开的前端页面
- Windows / WSL 环境配置脚本

原先放在这里的歌词播放器与代理配置，已经拆分到独立仓库维护。

## 当前内容

### 页面
- `index.html`
  - 个人主页与项目导航页。
  - 包含当前仓库页面入口，以及已拆分项目的 GitHub 外链。
- `cat-test.html`
  - 猫咪性格测试页面。
  - 通过长按触发测试，结果会写入浏览器 `localStorage`。
- `lovecan-lottery.html`
  - 座位抽奖页面。
  - 适合现场活动或小型放映活动的随机抽奖场景。

### 脚本
- `setup-wsl2.sh`
  - 面向 WSL2 Ubuntu 的一键环境初始化脚本。
  - 会安装大量软件，并重写 `~/.zshrc`。
- `fix-wsl2.sh`
  - 面向已有 WSL2 / Zsh 环境的修复脚本。
  - 也会重写 `~/.zshrc`。
- `setup-pwsh.ps1`
  - 面向 PowerShell 7 的环境增强脚本。
  - 会修改 PowerShell Profile，并安装模块或 Windows 软件。

### 静态文件
- `favicon.svg`
- `CNAME`

## 已拆分项目

- `led-lyrics-player`
  - GitHub: https://github.com/wenbingkun/led-lyrics-player
- `proxy-config`
  - GitHub: https://github.com/wenbingkun/proxy-config

## 仓库结构

```text
.
├── index.html
├── cat-test.html
├── lovecan-lottery.html
├── setup-wsl2.sh
├── fix-wsl2.sh
├── setup-pwsh.ps1
├── favicon.svg
├── CNAME
└── README.md
```

## 使用方式

### 直接打开页面

这是一个无构建步骤的静态仓库，大多数内容可以直接在浏览器中打开：

- `index.html`
- `cat-test.html`
- `lovecan-lottery.html`

如果只是预览页面，直接双击 HTML 文件即可。

### 本地启动静态服务器

如果你更习惯通过本地 HTTP 访问，可以在仓库根目录执行：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000/
```

## 页面说明

### `index.html`

- 定位：个人主页与项目导航
- 特点：单文件、无构建、可直接部署到 GitHub Pages
- 依赖：本地 `favicon.svg`，以及两个 GitHub 仓库外链

### `cat-test.html`

- 定位：轻量互动测试页
- 主要行为：
  - 长按 3 秒生成结果
  - 结果缓存到 `localStorage`
  - 支持重新测试
- 依赖：
  - Tailwind CDN
  - Google Fonts

### `lovecan-lottery.html`

- 定位：座位抽奖页
- 主要行为：
  - 根据座位布局生成座位图
  - 支持多人抽奖
  - 支持本地背景图上传
  - 带动画和开奖弹窗
- 依赖：
  - 外部背景图
  - Google Fonts

## 脚本说明

### `setup-wsl2.sh`

适用场景：
- 新的 WSL2 Ubuntu 环境
- 想一次性安装 Zsh、Oh-My-Zsh、Powerlevel10k 和常用命令行工具

执行方式：

```bash
bash setup-wsl2.sh
```

可用参数：

```bash
bash setup-wsl2.sh --help
bash setup-wsl2.sh --diagnose
```

注意：
- 脚本包含 `sudo apt`、`git clone`、`wget`、`chsh` 等操作。
- 会备份并重写 `~/.zshrc`。
- `--minimal` 会跳过附加命令行工具、`delta` 和 Nerd Fonts。
- `--force` 会重新拉取 / 重装已存在的组件。

### `fix-wsl2.sh`

适用场景：
- 已有 WSL2 + Zsh 环境，但缺少部分插件或主题
- 需要快速重建一份预设的 `~/.zshrc`

执行方式：

```bash
bash fix-wsl2.sh
```

注意：
- 脚本会备份并重写 `~/.zshrc`。
- 更适合已经安装过 Oh-My-Zsh 的环境，不适合把它当成全新初始化脚本。
- 脚本最后会等待交互确认，决定是否立即切换到 `zsh`。

### `setup-pwsh.ps1`

适用场景：
- Windows PowerShell 7 环境增强
- 需要安装 `oh-my-posh`、`PSReadLine`、`Posh-Git`、`Terminal-Icons` 等

执行方式：

```powershell
pwsh -File .\setup-pwsh.ps1
```

诊断模式：

```powershell
pwsh -File .\setup-pwsh.ps1 -Diagnose
```

注意：
- 脚本会写入或追加 `$PROFILE`。
- 会调用 `winget` 和 `Install-Module`。
- `-Minimal` 当前只会跳过部分可选安装，不是严格意义上的“最小安装模式”。

## 维护说明

如果你修改了页面：
- 直接在浏览器手动验证页面是否正常加载
- 检查桌面端和移动端布局
- 检查是否引入了新的外部依赖

如果你修改了脚本：
- 至少做语法检查
- 再确认脚本描述、参数和实际行为是否一致
- 对会覆盖用户配置的操作，在文档里明确写出

## 已知注意事项

- `cat-test.html` 与 `lovecan-lottery.html` 不是完全离线页面，依赖外部 CDN / 字体 / 图片资源。
- 两个环境脚本都会覆盖用户的 Shell 配置文件，运行前应自行确认备份策略。

## 手动检查建议

- 打开 `index.html`，确认主页入口和外链正常
- 打开 `cat-test.html`，确认长按、结果展示和重新测试正常
- 打开 `lovecan-lottery.html`，确认座位生成、抽奖动画和背景上传正常
- 对脚本先执行帮助或诊断模式，再决定是否实际运行

## 联系方式

- Email: `wenbingkun666@gmail.com`
- GitHub: https://github.com/wenbingkun

## 免责声明

本仓库内容仅供学习和个人使用。

运行脚本前请自行审阅内容，确认它会修改哪些系统配置、Shell 配置和代理设置；涉及网络下载、系统安装或系统代理的行为，请根据自己的环境与合规要求决定是否执行。
