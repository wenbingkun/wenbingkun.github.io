<#
.SYNOPSIS
  完整配置 Windows PowerShell 7 现代化开发环境
.DESCRIPTION
  实现以下功能：
  ✓ PowerShell 7 - 更现代的 shell
  ✓ oh-my-posh + Terminal-Icons - 美观 + Git 状态显示
  ✓ PSReadLine - 智能补全与历史搜索
  ✓ Posh-Git - Git 集成
  ✓ z - 快速目录跳转
  ✓ Scoop Completion - Scoop 命令补全
.NOTES
  在 PowerShell 7 (pwsh) 环境运行
  作者: PowerShell Enhancement Script v2.0
#>

param(
    [switch]$Force,     # 强制重写配置
    [switch]$Diagnose,  # 诊断模式
    [switch]$Minimal    # 最小化安装（跳过可选组件）
)

# 美化输出
function Write-Step {
    param(
        [string]$Message, 
        [string]$Type = "Info"
    )
    
    $color = switch ($Type) {
        "Info"    { "Cyan" }
        "Success" { "Green" }
        "Warning" { "Yellow" }
        "Error"   { "Red" }
        default   { "White" }
    }
    
    Write-Host $Message -ForegroundColor $color
}

# 诊断函数 - 检查所有组件状态
function Test-Environment {
    Write-Step "`n========== 环境诊断报告 ==========" "Info"
    
    # PowerShell 7 检查
    Write-Step "`n[PowerShell 版本]" "Info"
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -ge 7) {
        Write-Step "  ✓ PowerShell $psVersion - 现代化 Shell 已就绪" "Success"
    } else {
        Write-Step "  ✗ PowerShell $psVersion - 需要升级到 v7+" "Error"
    }
    
    # oh-my-posh 检查
    Write-Step "`n[oh-my-posh - 美化终端]" "Info"
    if (Get-Command oh-my-posh -ErrorAction SilentlyContinue) {
        $ompVersion = oh-my-posh version
        Write-Step "  ✓ oh-my-posh $ompVersion - 终端美化已安装" "Success"
        
        # 检查主题
        $themePaths = @(
            "$env:LOCALAPPDATA\Programs\oh-my-posh\themes",
            "$env:POSH_THEMES_PATH"
        )
        foreach ($path in $themePaths) {
            if (Test-Path $path) {
                $themeCount = (Get-ChildItem -Path $path -Filter "*.omp.json").Count
                Write-Step "    └─ 找到 $themeCount 个主题在: $path" "Success"
                break
            }
        }
    } else {
        Write-Step "  ✗ oh-my-posh 未安装 - 无法美化终端" "Error"
    }
    
    # PSReadLine 检查
    Write-Step "`n[PSReadLine - 智能补全]" "Info"
    $psReadLine = Get-Module -ListAvailable PSReadLine
    if ($psReadLine) {
        Write-Step "  ✓ PSReadLine $($psReadLine.Version) - 智能补全已就绪" "Success"
        Write-Step "    └─ 支持: 历史搜索、语法高亮、智能提示" "Success"
    } else {
        Write-Step "  ✗ PSReadLine 未安装 - 无智能补全功能" "Error"
    }
    
    # Terminal-Icons 检查
    Write-Step "`n[Terminal-Icons - 文件图标]" "Info"
    if (Get-Module -ListAvailable Terminal-Icons) {
        Write-Step "  ✓ Terminal-Icons - 文件类型图标已启用" "Success"
    } else {
        Write-Step "  ✗ Terminal-Icons 未安装 - 无文件图标显示" "Warning"
    }
    
    # Posh-Git 检查
    Write-Step "`n[Posh-Git - Git 集成]" "Info"
    if (Get-Module -ListAvailable Posh-Git) {
        Write-Step "  ✓ Posh-Git - Git 状态集成已启用" "Success"
        Write-Step "    └─ 支持: 分支显示、状态提示、Tab补全" "Success"
    } else {
        Write-Step "  ✗ Posh-Git 未安装 - 无 Git 集成" "Warning"
    }
    
    # z 模块检查
    Write-Step "`n[z - 快速跳转]" "Info"
    if (Get-Module -ListAvailable z) {
        Write-Step "  ✓ z 模块 - 智能目录跳转已启用" "Success"
        Write-Step "    └─ 用法: z <部分路径> 快速跳转" "Success"
    } else {
        Write-Step "  ✗ z 未安装 - 无快速目录跳转" "Warning"
    }
    
    # Scoop 检查
    Write-Step "`n[Scoop - 包管理器]" "Info"
    if (Get-Command scoop -ErrorAction SilentlyContinue) {
        Write-Step "  ✓ Scoop 已安装" "Success"
        
        # 使用 scoop prefix 获取路径
        try {
            $scoopPath = scoop prefix scoop 2>$null
            if ($scoopPath) {
                $completionPath = Join-Path $scoopPath "lib\completion.ps1"
                if (Test-Path $completionPath) {
                    Write-Step "    └─ 自动补全可用: $completionPath" "Success"
                } else {
                    Write-Step "    └─ 自动补全文件未找到" "Warning"
                }
            }
        } catch {
            Write-Step "    └─ 无法获取 Scoop 路径" "Warning"
        }
    } else {
        Write-Step "  ✗ Scoop 未安装" "Warning"
    }
    
    # Profile 检查
    Write-Step "`n[配置文件]" "Info"
    if (Test-Path $PROFILE) {
        Write-Step "  ✓ Profile 存在: $PROFILE" "Success"
        $content = Get-Content $PROFILE -Raw
        if ($content -match "PowerShell 增强配置") {
            Write-Step "    └─ 已包含增强配置" "Success"
        }
    } else {
        Write-Step "  ✗ Profile 不存在" "Warning"
    }
    
    Write-Step "`n========== 诊断完成 ==========" "Info"
}

# 如果是诊断模式，只运行诊断
if ($Diagnose) {
    Test-Environment
    exit
}

# 主安装流程
Write-Step "`n╔══════════════════════════════════════╗" "Info"
Write-Step "║   PowerShell 7 现代化环境配置工具   ║" "Info"
Write-Step "╚══════════════════════════════════════╝" "Info"
Write-Step "  实现: 美化 + Git集成 + 智能补全 + 快速跳转" "Success"

# 1. PowerShell 7 检查
Write-Step "`n[1/8] 检查 PowerShell 7..." "Info"
if ($PSVersionTable.PSVersion.Major -lt 7) {
    Write-Step "  需要 PowerShell 7，正在安装..." "Warning"
    winget install --id Microsoft.Powershell --source winget -e
    Write-Step "  请在 PowerShell 7 中重新运行此脚本！" "Error"
    Write-Step "  运行: pwsh.exe" "Warning"
    exit
} else {
    Write-Step "  ✓ PowerShell $($PSVersionTable.PSVersion) 已就绪" "Success"
}

# 2. 创建 Profile
Write-Step "`n[2/8] 准备配置文件..." "Info"
$profileDir = Split-Path $PROFILE
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}
if (-not (Test-Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force | Out-Null
    Write-Step "  ✓ 创建配置文件: $PROFILE" "Success"
} else {
    Write-Step "  ✓ 配置文件已存在" "Success"
}

# 3. 安装 oh-my-posh (终端美化)
Write-Step "`n[3/8] 安装 oh-my-posh (终端美化)..." "Info"
if (-not (Get-Command oh-my-posh -ErrorAction SilentlyContinue)) {
    Write-Step "  安装中..." "Warning"
    winget install JanDeDobbeleer.OhMyPosh -s winget -e --accept-package-agreements --accept-source-agreements
    # 刷新 PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Step "  ✓ oh-my-posh 安装完成" "Success"
} else {
    Write-Step "  ✓ oh-my-posh 已安装" "Success"
}

# 获取主题路径
$selectedTheme = $null
$themePaths = @(
    "$env:LOCALAPPDATA\Programs\oh-my-posh\themes",
    "$env:POSH_THEMES_PATH"
)

foreach ($path in $themePaths) {
    if (Test-Path $path) {
        # 选择合适的主题
        $preferredThemes = @("powerlevel10k_lean", "agnoster", "paradox", "robbyrussell", "material")
        foreach ($theme in $preferredThemes) {
            $themePath = Join-Path $path "$theme.omp.json"
            if (Test-Path $themePath) {
                $selectedTheme = $themePath
                Write-Step "  ✓ 选择主题: $theme" "Success"
                break
            }
        }
        if ($selectedTheme) { break }
    }
}

# 4. 安装 PSReadLine (智能补全)
Write-Step "`n[4/8] 安装 PSReadLine (智能补全)..." "Info"
if (-not (Get-Module -ListAvailable PSReadLine)) {
    Install-Module PSReadLine -Force -Scope CurrentUser -AllowPrerelease -SkipPublisherCheck
    Write-Step "  ✓ PSReadLine 安装完成 - 启用智能补全" "Success"
} else {
    Write-Step "  ✓ PSReadLine 已安装" "Success"
}

# 5. 安装 Terminal-Icons (文件图标)
Write-Step "`n[5/8] 安装 Terminal-Icons (文件图标)..." "Info"
if (-not (Get-Module -ListAvailable Terminal-Icons)) {
    Install-Module -Name Terminal-Icons -Repository PSGallery -Scope CurrentUser -Force
    Write-Step "  ✓ Terminal-Icons 安装完成 - 美化文件显示" "Success"
} else {
    Write-Step "  ✓ Terminal-Icons 已安装" "Success"
}

# 6. 安装 Posh-Git (Git 集成)
Write-Step "`n[6/8] 安装 Posh-Git (Git 集成)..." "Info"
if (-not (Get-Module -ListAvailable Posh-Git)) {
    Install-Module -Name Posh-Git -Repository PSGallery -Scope CurrentUser -Force
    Write-Step "  ✓ Posh-Git 安装完成 - Git 状态集成" "Success"
} else {
    Write-Step "  ✓ Posh-Git 已安装" "Success"
}

# 7. 安装 z (快速跳转)
Write-Step "`n[7/8] 安装 z 模块 (快速目录跳转)..." "Info"
if (-not (Get-Module -ListAvailable z)) {
    try {
        Install-Module -Name z -Repository PSGallery -Scope CurrentUser -Force -AllowClobber
        Write-Step "  ✓ z 模块安装完成 - 智能目录跳转" "Success"
    } catch {
        Write-Step "  ⚠ z 模块安装失败，可稍后手动安装" "Warning"
    }
} else {
    Write-Step "  ✓ z 模块已安装" "Success"
}

# 7.5 配置 Scoop 自动补全
Write-Step "`n[7.5/8] 配置 Scoop 自动补全..." "Info"
$scoopCompletionPath = $null

if (Get-Command scoop -ErrorAction SilentlyContinue) {
    try {
        # 使用 scoop prefix 获取准确路径
        $scoopRoot = scoop prefix scoop 2>$null
        if ($scoopRoot) {
            $completionPath = Join-Path $scoopRoot "lib\completion.ps1"
            if (Test-Path $completionPath) {
                $scoopCompletionPath = $completionPath
                Write-Step "  ✓ 找到 Scoop 自动补全: $completionPath" "Success"
            } else {
                # 尝试其他可能的路径
                $altPath = Join-Path $scoopRoot "supporting\completion\completion.ps1"
                if (Test-Path $altPath) {
                    $scoopCompletionPath = $altPath
                    Write-Step "  ✓ 找到 Scoop 自动补全 (备用路径)" "Success"
                }
            }
        }
    } catch {
        Write-Step "  ⚠ 无法获取 Scoop 路径" "Warning"
    }
    
    # 如果还没找到，尝试安装 scoop-completion 模块
    if (-not $scoopCompletionPath -and -not $Minimal) {
        Write-Step "  尝试安装 scoop-completion 模块..." "Warning"
        try {
            Install-Module -Name scoop-completion -Repository PSGallery -Scope CurrentUser -Force -AllowClobber
            Write-Step "  ✓ scoop-completion 模块已安装" "Success"
        } catch {
            Write-Step "  ⚠ scoop-completion 模块安装失败: $_" "Warning"
        }
    }
} else {
    Write-Step "  ⚠ Scoop 未安装，跳过自动补全" "Warning"
}

# 8. 生成完整配置
Write-Step "`n[8/8] 生成增强配置..." "Info"

$profileContent = @"
# ╔══════════════════════════════════════╗
# ║   PowerShell 7 现代化增强配置       ║
# ║   Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm")         ║
# ╚══════════════════════════════════════╝

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎨 基础设置
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# UTF-8 编码
[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding

# 去除烦人的版权信息
Clear-Host

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 PSReadLine - 智能补全与历史搜索
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (Get-Module -ListAvailable PSReadLine) {
    Import-Module PSReadLine
    
    # 启用预测功能
    Set-PSReadLineOption -PredictionSource HistoryAndPlugin
    Set-PSReadLineOption -PredictionViewStyle ListView
    Set-PSReadLineOption -EditMode Windows
    
    # 历史搜索
    Set-PSReadLineOption -HistorySearchCursorMovesToEnd
    Set-PSReadLineKeyHandler -Key Tab -Function MenuComplete
    Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward
    Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward
    
    # 智能括号匹配
    Set-PSReadLineOption -ShowToolTips
    Set-PSReadLineOption -BellStyle None
    
    # 自定义颜色
    Set-PSReadLineOption -Colors @{
        Command = 'Green'
        Parameter = 'Gray'
        Operator = 'Magenta'
        Variable = 'Yellow'
        String = 'Cyan'
        Number = 'White'
        Type = 'Gray'
        Comment = 'DarkGray'
    }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📁 Terminal-Icons - 美化文件显示
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (Get-Module -ListAvailable Terminal-Icons) {
    Import-Module Terminal-Icons
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔀 Posh-Git - Git 状态集成
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (Get-Module -ListAvailable Posh-Git) {
    Import-Module Posh-Git
    `$GitPromptSettings.DefaultPromptAbbreviateHomeDirectory = `$true
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📍 z - 智能目录跳转
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (Get-Module -ListAvailable z) {
    Import-Module z
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎨 Oh-My-Posh - 终端美化主题
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"@

# 添加 oh-my-posh 配置
if ($selectedTheme) {
    $profileContent += @"
if (Get-Command oh-my-posh -ErrorAction SilentlyContinue) {
    oh-my-posh init pwsh --config "$selectedTheme" | Invoke-Expression
}

"@
} else {
    $profileContent += @"
if (Get-Command oh-my-posh -ErrorAction SilentlyContinue) {
    oh-my-posh init pwsh | Invoke-Expression
}

"@
}

# 添加 Scoop 自动补全
if ($scoopCompletionPath) {
    $profileContent += @"
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📦 Scoop - 命令自动补全
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (Test-Path "$scoopCompletionPath") {
    . "$scoopCompletionPath"
}

"@
} elseif (Get-Module -ListAvailable scoop-completion) {
    $profileContent += @"
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📦 Scoop - 命令自动补全 (模块)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Import-Module scoop-completion

"@
}

# 添加实用功能
$profileContent += @"
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🛠️ 实用别名与函数
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 常用别名
Set-Alias -Name ll -Value Get-ChildItem
Set-Alias -Name la -Value 'Get-ChildItem -Force'
Set-Alias -Name which -Value Get-Command
Set-Alias -Name grep -Value Select-String
Set-Alias -Name vim -Value notepad -ErrorAction SilentlyContinue

# 实用函数
function touch { param(`$file) New-Item -ItemType File -Path `$file -Force | Out-Null }
function reload { . `$PROFILE; Write-Host "✓ 配置已重载" -ForegroundColor Green }
function mkcd { param(`$path) New-Item -ItemType Directory -Path `$path -Force; Set-Location `$path }
function .. { Set-Location .. }
function ... { Set-Location ../.. }
function home { Set-Location ~ }
function desktop { Set-Location ~/Desktop }
function downloads { Set-Location ~/Downloads }
function docs { Set-Location ~/Documents }

# Git 快捷命令
function gs { git status }
function ga { git add . }
function gc { param(`$m) git commit -m `$m }
function gp { git push }
function gl { git log --oneline --graph --decorate }

# Clash 代理管理命令
Set-Alias -Name clash-check -Value Test-ClashProxy
Set-Alias -Name clash-start -Value Start-ClashProxy
Set-Alias -Name clash-reset -Value Reset-Proxy

# 系统信息
function sysinfo {
    Write-Host "PowerShell `$(`$PSVersionTable.PSVersion)" -ForegroundColor Cyan
    Write-Host "Windows `$([System.Environment]::OSVersion.Version)" -ForegroundColor Cyan
    Write-Host "User: `$env:USERNAME@`$env:COMPUTERNAME" -ForegroundColor Green
}

# Clash 代理检测和配置
function Get-ClashConfig {
    # 常见的 Clash 配置文件路径
    $configPaths = @(
        "$env:USERPROFILE\.config\clash\config.yaml",
        "$env:USERPROFILE\.config\clash\config.yml",
        "$env:APPDATA\clash\config.yaml",
        "$env:APPDATA\clash\config.yml",
        "$env:USERPROFILE\Documents\clash\config.yaml",
        "C:\Users\*\.config\clash\config.yaml"
    )
    
    foreach ($path in $configPaths) {
        $expandedPath = $ExecutionContext.InvokeCommand.ExpandString($path)
        if (Test-Path $expandedPath -ErrorAction SilentlyContinue) {
            try {
                $content = Get-Content $expandedPath -Raw -Encoding UTF8
                # 解析端口配置
                if ($content -match 'port:\s*(\d+)') {
                    $httpPort = $matches[1]
                }
                if ($content -match 'socks-port:\s*(\d+)') {
                    $socksPort = $matches[1]
                }
                if ($content -match 'external-controller:\s*[''"]?.*:(\d+)[''"]?') {
                    $controllerPort = $matches[1]
                }
                
                return @{
                    ConfigPath = $expandedPath
                    HttpPort = $httpPort
                    SocksPort = $socksPort
                    ControllerPort = $controllerPort
                }
            } catch {
                Write-Warning "无法解析配置文件: $expandedPath"
            }
        }
    }
    return $null
}

function Test-ClashProxy {
    param(
        [switch]$AutoConfigure,
        [switch]$ShowDetails
    )
    
    Write-Host "🔍 正在检测 Clash 代理状态..." -ForegroundColor Cyan
    
    # 检查 Clash 进程
    $clashProcesses = Get-Process -Name "*clash*" -ErrorAction SilentlyContinue
    if (-not $clashProcesses) {
        Write-Host "❌ 未检测到 Clash 进程" -ForegroundColor Red
        Write-Host "   请确保 Clash 已启动" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "✅ 检测到 Clash 进程: $($clashProcesses.ProcessName -join ', ')" -ForegroundColor Green
    
    # 获取配置信息
    $config = Get-ClashConfig
    if (-not $config) {
        Write-Host "⚠️  无法找到 Clash 配置文件，使用默认端口检测" -ForegroundColor Yellow
        $config = @{
            HttpPort = 7890
            SocksPort = 7891
            ControllerPort = 9090
        }
    } else {
        Write-Host "📄 找到配置文件: $(Split-Path -Leaf $config.ConfigPath)" -ForegroundColor Green
    }
    
    if ($ShowDetails) {
        Write-Host "`n📋 配置详情:" -ForegroundColor Cyan
        Write-Host "   HTTP 代理端口: $($config.HttpPort)" -ForegroundColor White
        Write-Host "   SOCKS 代理端口: $($config.SocksPort)" -ForegroundColor White
        Write-Host "   控制器端口: $($config.ControllerPort)" -ForegroundColor White
    }
    
    # 测试端口连通性
    $httpPortActive = $false
    $socksPortActive = $false
    $controllerPortActive = $false
    
    if ($config.HttpPort) {
        $httpPortActive = Test-NetConnection -ComputerName "127.0.0.1" -Port $config.HttpPort -InformationLevel Quiet -ErrorAction SilentlyContinue
        if ($httpPortActive) {
            Write-Host "✅ HTTP 代理端口 $($config.HttpPort) 已开启" -ForegroundColor Green
        } else {
            Write-Host "❌ HTTP 代理端口 $($config.HttpPort) 未响应" -ForegroundColor Red
        }
    }
    
    if ($config.SocksPort) {
        $socksPortActive = Test-NetConnection -ComputerName "127.0.0.1" -Port $config.SocksPort -InformationLevel Quiet -ErrorAction SilentlyContinue
        if ($socksPortActive) {
            Write-Host "✅ SOCKS 代理端口 $($config.SocksPort) 已开启" -ForegroundColor Green
        }
    }
    
    if ($config.ControllerPort) {
        $controllerPortActive = Test-NetConnection -ComputerName "127.0.0.1" -Port $config.ControllerPort -InformationLevel Quiet -ErrorAction SilentlyContinue
        if ($controllerPortActive) {
            Write-Host "✅ 控制器端口 $($config.ControllerPort) 已开启" -ForegroundColor Green
            Write-Host "   管理界面: http://127.0.0.1:$($config.ControllerPort)/ui" -ForegroundColor Cyan
        }
    }
    
    # 自动配置代理
    if ($AutoConfigure -and $httpPortActive) {
        Write-Host "`n🔧 正在自动配置系统代理..." -ForegroundColor Yellow
        
        # 设置系统代理
        Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name ProxyEnable -Value 1
        Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name ProxyServer -Value "127.0.0.1:$($config.HttpPort)"
        
        # 配置环境变量
        $env:HTTP_PROXY = "http://127.0.0.1:$($config.HttpPort)"
        $env:HTTPS_PROXY = "http://127.0.0.1:$($config.HttpPort)"
        $env:ALL_PROXY = "http://127.0.0.1:$($config.HttpPort)"
        
        Write-Host "✅ 系统代理已配置" -ForegroundColor Green
        Write-Host "   HTTP_PROXY: $env:HTTP_PROXY" -ForegroundColor Cyan
        Write-Host "   HTTPS_PROXY: $env:HTTPS_PROXY" -ForegroundColor Cyan
        
        # 测试代理连接
        Write-Host "`n🌐 测试代理连接..." -ForegroundColor Cyan
        try {
            $response = Invoke-WebRequest -Uri "https://api.github.com" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
            Write-Host "✅ 代理连接测试成功 (状态码: $($response.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  代理连接测试失败，可能需要手动配置规则" -ForegroundColor Yellow
            Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    return ($httpPortActive -or $socksPortActive)
}

function Reset-Proxy {
    Write-Host "🔄 正在重置代理设置..." -ForegroundColor Yellow
    
    # 禁用系统代理
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name ProxyEnable -Value 0
    
    # 清除环境变量
    Remove-Item Env:HTTP_PROXY -ErrorAction SilentlyContinue
    Remove-Item Env:HTTPS_PROXY -ErrorAction SilentlyContinue
    Remove-Item Env:ALL_PROXY -ErrorAction SilentlyContinue
    
    Write-Host "✅ 代理设置已重置" -ForegroundColor Green
}

function Start-ClashProxy {
    Write-Host "🚀 自动检测并配置 Clash 代理..." -ForegroundColor Cyan
    Test-ClashProxy -AutoConfigure
}

# 增强的 ls
function ls {
    param(
        [string]`$Path = ".",
        [switch]`$la,
        [switch]`$ll
    )
    
    if (`$la) {
        Get-ChildItem -Path `$Path -Force | Format-Wide -AutoSize
    }
    elseif (`$ll) {
        Get-ChildItem -Path `$Path | Format-Table Mode, LastWriteTime, Length, Name -AutoSize
    }
    else {
        Get-ChildItem -Path `$Path | Format-Wide -AutoSize
    }
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🌟 启动欢迎信息
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write-Host ""
Write-Host "  🚀 PowerShell `$(`$PSVersionTable.PSVersion.ToString()) " -ForegroundColor Cyan -NoNewline
Write-Host "| 📍 z (目录跳转) " -ForegroundColor Green -NoNewline
Write-Host "| 🔀 Git 集成 " -ForegroundColor Yellow -NoNewline
Write-Host "| 📦 Scoop 补全" -ForegroundColor Magenta
Write-Host "  💡 输入 'sysinfo' 查看系统信息 | 'reload' 重载配置 | 'clash-check' 检测代理" -ForegroundColor DarkGray
Write-Host ""

# 自动检测 Clash 代理
try {
    $clashRunning = Get-Process -Name "*clash*" -ErrorAction SilentlyContinue
    if ($clashRunning) {
        Write-Host "🌐 检测到 Clash 正在运行，输入 'clash-start' 自动配置代理" -ForegroundColor Green
    }
} catch {
    # 静默忽略错误
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✨ 配置完成
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"@

# 写入配置
if ($Force -or -not (Test-Path $PROFILE)) {
    Set-Content -Path $PROFILE -Value $profileContent -Encoding UTF8
    Write-Step "  ✓ 配置已写入" "Success"
} else {
    # 备份
    $backupPath = "$PROFILE.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
    Copy-Item -Path $PROFILE -Destination $backupPath -Force
    Write-Step "  ✓ 已备份到: $(Split-Path -Leaf $backupPath)" "Success"
    
    # 检查是否覆盖
    $existingContent = Get-Content $PROFILE -Raw
    if ($existingContent -match "PowerShell 7 现代化增强配置|PowerShell 增强配置") {
        Write-Host "`n  检测到已有配置，是否覆盖? (Y/N): " -ForegroundColor Yellow -NoNewline
        $response = Read-Host
        if ($response -eq 'Y' -or $response -eq 'y') {
            Set-Content -Path $PROFILE -Value $profileContent -Encoding UTF8
            Write-Step "  ✓ 配置已更新" "Success"
        } else {
            Write-Step "  ⚠ 保留原配置" "Warning"
        }
    } else {
        Add-Content -Path $PROFILE -Value "`n$profileContent" -Encoding UTF8
        Write-Step "  ✓ 配置已追加" "Success"
    }
}

# 完成总结
Write-Step "`n╔══════════════════════════════════════╗" "Info"
Write-Step "║         ✅ 配置完成！                ║" "Info"
Write-Step "╚══════════════════════════════════════╝" "Info"

Write-Step "`n已实现的功能：" "Success"
Write-Step "  ✓ PowerShell 7 - 现代化 Shell" "Success"
Write-Step "  ✓ oh-my-posh + Terminal-Icons - 美观终端 + Git 状态" "Success"
Write-Step "  ✓ PSReadLine - 智能补全与历史搜索" "Success"
Write-Step "  ✓ Posh-Git - Git 完整集成" "Success"
Write-Step "  ✓ z 模块 - 智能目录跳转" "Success"
if ($scoopCompletionPath -or (Get-Module -ListAvailable scoop-completion)) {
    Write-Step "  ✓ Scoop Completion - 命令自动补全" "Success"
}

Write-Step "`n可用命令示例：" "Info"
Write-Step "  z <部分路径>  - 快速跳转到目录" "Info"
Write-Step "  gs/ga/gc/gp   - Git 快捷命令" "Info"
Write-Step "  ll/la         - 增强的目录列表" "Info"
Write-Step "  mkcd <路径>   - 创建并进入目录" "Info"
Write-Step "  reload        - 重载配置" "Info"

Write-Step "`n下一步操作：" "Warning"
Write-Step "  1. 关闭并重新打开终端 (推荐)" "Warning"
Write-Step "  2. 或执行: . `$PROFILE" "Warning"

if ($Diagnose -eq $false) {
    Write-Step "`n提示: 运行 '.\$(Split-Path -Leaf $MyInvocation.MyCommand.Path) -Diagnose' 查看详细状态" "Info"
}

# 询问是否立即重载
Write-Host "`n是否立即重载配置? (Y/N): " -ForegroundColor Cyan -NoNewline
$reload = Read-Host
if ($reload -eq 'Y' -or $reload -eq 'y') {
    . $PROFILE
    Write-Step "`n✓ 配置已重载！享受您的现代化 PowerShell 环境！" "Success"
}