# wenbingkun.github.io

这是个人主页及工具集合，包含以下内容：

## 主页（index.html）
- 个人介绍、联系方式（邮箱、GitHub）。
- 展示和入口：
  - 🎲 [lottery-app](lovecan-lottery.html)：LOVECAN重映-幸运弦迷抽奖工具。
  - 🎵 [music-player](lyrics_player%20.html)：LED演出歌词显示器。
  - 🌐 [clash-rules](clash-comprehensive-rules.yaml)：全球196国节点覆盖配置。
  - ⚡ [setup-pwsh.ps1](setup-pwsh.ps1)：PowerShell 7 现代化环境配置。
  - 🐧 [setup-wsl2.sh](setup-wsl2.sh)：WSL2 现代化开发环境配置。
  - 🔧 [fix-wsl2.sh](fix-wsl2.sh)：WSL2 环境修复与优化。

## lottery-app（lovecan-lottery.html）
- 影院座位抽奖工具，支持自定义座位布局。
- 可设置中奖人数，动画揭晓，支持背景图片自定义。
- 适合活动现场抽奖、座位分配等场景。

## music-player（lyrics_player .html）
- 支持LRC歌词文件和音频文件（MP3/WAV等）同步播放。
- 歌词大屏显示，支持多主题、字体大小、播放模式切换。
- 拖拽上传歌词/音频/背景图片，适合演出、KTV、活动现场。
- 支持歌词搜索、播放列表导入导出、同步校准。

## Clash 代理配置文件

### clash-comprehensive-rules.yaml ⭐
**全球精品机场融合配置 - 地理全覆盖版**
- **版本**: v3.1.0 | **更新**: 2025年7月
- **核心特色**:
  - 🌍 **全球196国节点覆盖**: 支持全球所有可能的代理节点国家
  - 🏝️ **7大洲完整覆盖**: 亚洲18国、欧洲50国、南美33国、大洋洲24国、中东15国、非洲54国、北美2国
  - 🚀 **零维护成本**: 任何新增节点自动归入对应地区组，无需手动配置
  - 🤖 **AI服务支持**: OpenAI、Claude、Gemini、Copilot、Perplexity
  - 🎮 **游戏专线**: 自动筛选游戏专用节点，延迟优化
  - 📋 **智能分流架构**: 专用规则优先，避免通用规则误捕获
  
- **地理全覆盖**:
  - 🌏 **东南亚**: 包含马来西亚、泰国、越南、印度等18个国家
  - 🇪🇺 **欧洲**: 包含英国、法国、德国、俄罗斯等50个国家
  - 🌎 **南美**: 包含巴西、阿根廷、智利、墨西哥等33个国家
  - 🏝️ **大洋洲**: 澳大利亚、新西兰单独 + 22个太平洋岛国
  - 🕌 **中东**: 包含阿联酋、沙特、土耳其、伊朗等15个国家
  - 🌍 **非洲**: 包含南非、埃及、尼日利亚、肯尼亚等54个国家

- **技术亮点**:
  - 一劳永逸的地理全覆盖方案
  - 100%节点覆盖保证，不会有遗漏
  - 地理逻辑清晰，符合用户认知习惯

## 环境配置脚本

### setup-pwsh.ps1 ⭐
**PowerShell 7 现代化环境一键配置工具**
- **功能**: 自动配置 Windows PowerShell 7 现代化开发环境
- **特色**:
  - ✓ PowerShell 7 - 现代化 Shell
  - ✓ oh-my-posh + Terminal-Icons - 美观终端 + Git 状态显示
  - ✓ PSReadLine - 智能补全与历史搜索
  - ✓ Posh-Git - Git 完整集成
  - ✓ z 模块 - 智能目录跳转
  - ✓ Scoop Completion - 命令自动补全
- **使用方法**: 在 PowerShell 7 中运行 `.\setup-pwsh.ps1`
- **支持参数**: `-Force` 强制重写配置、`-Diagnose` 诊断模式、`-Minimal` 最小化安装

### setup-wsl2.sh ⭐
**WSL2 现代化开发环境一键配置脚本**
- **功能**: 全自动配置 WSL2 Ubuntu 现代化开发环境
- **特色**:
  - 🚀 Zsh + Oh-My-Zsh + Powerlevel10k - 现代化 Shell 与美观主题
  - 🔍 fzf + bat + eza + fd + ripgrep - 现代化命令行工具套件
  - 🎯 智能补全 - zsh-autosuggestions + zsh-syntax-highlighting
  - 📍 autojump/z - 目录快速跳转
  - 🌐 WSL2 与 Windows 互操作优化
  - 🛠️ Node.js/Python/Go 开发环境支持
- **使用方法**: `bash setup-wsl2.sh`
- **支持参数**: `--diagnose` 诊断环境、`--minimal` 最小安装、`--force` 强制重装

### fix-wsl2.sh
**WSL2 环境快速修复与优化工具**
- **功能**: 补充缺失组件，修复常见 WSL2 环境问题
- **适用场景**: 已有环境的快速修复和优化
- **特色**:
  - 🔧 安装缺失的 fzf、Zsh 插件
  - 🎨 配置 Powerlevel10k 主题
  - ⚡ 优化 Zsh 配置文件
  - 🔗 修复 Node.js 别名（nodejs → node）

## 使用说明

### Clash配置使用步骤
1. 下载对应的YAML配置文件
2. 替换文件中的机场订阅链接
3. 导入到Clash客户端
4. 根据需要选择对应的代理组

### 适用场景
- **全球用户**: 支持全球196个国家和地区的节点
- **AI开发**: 支持主流AI服务独立路由
- **流媒体**: Netflix、Disney+、YouTube等优化
- **游戏**: Steam、Epic、PlayStation等平台支持
- **开发**: GitHub、GitLab等开发平台优化
- **零维护**: 节点新增删除无需修改配置

## 更新日志

### v3.1.0 (2025-07)
- ✅ 实现地理全覆盖方案，支持全球196个国家和地区
- ✅ 新增大洋洲代理组，完善太平洋岛国覆盖
- ✅ 零维护成本设计，节点新增删除无需手动配置
- ✅ 优化地区代理组架构，按七大洲科学分类
- ✅ 修复地区匹配冲突问题（澳洲→澳门，日本→尼日利亚等）

## 技术支持

如有建议或问题，欢迎联系：
- 📧 邮箱：wenbingkun666@gmail.com 
- 🔗 GitHub：[wenbingkun](https://github.com/wenbingkun)

---

> **免责声明**: 本项目仅供学习交流使用，请遵守当地法律法规。代理服务请选择合规的服务提供商。