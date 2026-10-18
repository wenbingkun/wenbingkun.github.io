# wenbingkun.github.io

个人主页与 Windows / WSL 环境配置脚本的集合仓库，部署在 GitHub Pages（https://wenbingkun.com）。

原先放在这里的歌词播放器与代理配置已经拆分到独立仓库维护；猫咪测试、座位抽奖等一次性页面已下线。

## 当前内容

| 文件 | 说明 |
|------|------|
| `index.html` | 终端风格的个人主页与项目导航 |
| `setup-wsl2.sh` | WSL2 Ubuntu 环境初始化（Zsh / Oh-My-Zsh / Powerlevel10k / 现代命令行工具） |
| `setup-pwsh.ps1` | Windows PowerShell 7 环境增强（oh-my-posh / PSReadLine / Posh-Git / Terminal-Icons / z） |
| `favicon.svg`、`CNAME` | 站点静态文件 |

## 已拆分项目

- `led-lyrics-player`：https://github.com/wenbingkun/led-lyrics-player
- `proxy-config`：https://github.com/wenbingkun/proxy-config

## 本地预览

无构建步骤，直接打开 `index.html`，或在仓库根目录执行：

```bash
python3 -m http.server 8000
```

## 脚本说明

两个脚本生成的 Shell 配置与作者本机实际使用的配置保持同步。

### `setup-wsl2.sh`

适用于新的 WSL2 Ubuntu（在 24.04 上使用）。

```bash
bash setup-wsl2.sh             # 标准安装
bash setup-wsl2.sh --diagnose  # 只诊断，不修改
bash setup-wsl2.sh --minimal   # 跳过附加工具、delta 和 Nerd Fonts
bash setup-wsl2.sh --force     # 重新拉取 / 重装已存在的组件
```

会做的事：
- `sudo apt` 安装 Zsh、bat、eza、fd、ripgrep、autojump、htop、duf 等，`chsh` 切换默认 Shell。
- 克隆 Oh-My-Zsh、Powerlevel10k、zsh-autosuggestions / syntax-highlighting / completions、fzf。
- **备份并重写** `~/.zshrc`、`~/.zshenv`、`~/.config/zsh/fzf.zsh` 和 `~/.config/wget/wgetrc`（备份为同目录 `*.backup.<时间戳>`）。
- 配置文件与状态遵循 XDG：
  - p10k 配置：`~/.config/zsh/p10k.zsh`
  - fzf 集成：`~/.config/zsh/fzf.zsh`
  - zsh 历史 / z 数据：`~/.local/state/zsh/`，补全缓存：`~/.cache/zsh/`
  - less / wget 状态：`~/.local/state/{less,wget}/`

代理：
- 若 Windows 透传了 `http_proxy` 等环境变量，`.zshrc` 会统一派生大小写变量与 `GRADLE_OPTS` 中的 JVM 代理参数（保留其中原有的非代理参数）。
- `proxyon [端口]` / `proxyoff` 只影响当前会话，默认端口 7897（Clash Verge）；切换时同步更新 / 移除 `GRADLE_OPTS` 的代理参数。
  - `networkingMode=mirrored` 时指向 `127.0.0.1`；
  - NAT 模式时指向默认网关（宿主机），需在 Clash 中开启"允许局域网连接"。

### `setup-pwsh.ps1`

```powershell
pwsh -File .\setup-pwsh.ps1            # 安装并生成 $PROFILE
pwsh -File .\setup-pwsh.ps1 -Diagnose  # 只诊断
pwsh -File .\setup-pwsh.ps1 -Force     # 直接覆盖已有 $PROFILE
pwsh -File .\setup-pwsh.ps1 -Minimal   # 跳过部分可选安装
```

会做的事：
- 通过 `winget` 安装 oh-my-posh，通过 `Install-Module` 安装 PSReadLine、Terminal-Icons、Posh-Git、z、scoop-completion。
- 写入 `$PROFILE`：已有本脚本生成的配置时询问是否覆盖，否则追加；`-Force` 直接覆盖。已有 `$PROFILE` 时一律先备份为 `$PROFILE.backup.<时间戳>`。
- 代理：`proxy-on [地址]` / `proxy-off` / `proxy-status`，只修改当前会话环境变量，不写注册表系统代理。

## 维护说明

- 修改脚本后至少做语法检查：`bash -n setup-wsl2.sh`；PowerShell 用 `[System.Management.Automation.Language.Parser]::ParseFile` 解析。
- `setup-pwsh.ps1` 的 profile 模板写在 `@"..."@` 里，模板内的 `$` 必须写成 `` `$ ``，否则会在生成时被提前展开。
- 本机配置有变化时，同步回脚本模板，并在文档里写明会覆盖哪些文件。

## 联系方式

- Email: `wenbingkun666@gmail.com`
- GitHub: https://github.com/wenbingkun

## 免责声明

本仓库内容仅供学习和个人使用。运行脚本前请自行审阅，确认它会修改哪些系统配置与 Shell 配置。
