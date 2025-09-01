#!/bin/bash

#############################################
# WSL2 Modern Development Environment Setup
# Version: 2.0
# Author: WSL2 Enhancement Script
# 
# Features:
# ✓ Zsh + Oh-My-Zsh - 现代化 Shell
# ✓ Powerlevel10k - 美观主题
# ✓ fzf - 模糊搜索
# ✓ bat/eza/fd/ripgrep - 现代化工具
# ✓ zsh-autosuggestions - 智能建议
# ✓ zsh-syntax-highlighting - 语法高亮
# ✓ autojump - 目录快速跳转
# ✓ Node.js/Python/Go - 开发环境
#############################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 美化输出函数
print_header() {
    echo -e "\n${CYAN}╔══════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${WHITE}   WSL2 现代化开发环境一键配置       ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
}

print_step() {
    echo -e "\n${BLUE}[$(date +'%H:%M:%S')]${NC} ${GREEN}➜${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# 检测系统类型
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        print_error "无法检测系统类型"
        exit 1
    fi
}

# 备份函数
backup_file() {
    if [ -f "$1" ]; then
        cp "$1" "$1.backup.$(date +%Y%m%d%H%M%S)"
        print_info "已备份: $1"
    fi
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 诊断模式
diagnose_environment() {
    print_header
    echo -e "\n${CYAN}========== 环境诊断报告 ==========${NC}\n"
    
    # 系统信息
    echo -e "${YELLOW}[系统信息]${NC}"
    echo "  发行版: $(lsb_release -ds 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
    echo "  内核: $(uname -r)"
    echo "  架构: $(uname -m)"
    
    # Shell 环境
    echo -e "\n${YELLOW}[Shell 环境]${NC}"
    if command_exists zsh; then
        print_success "Zsh 已安装: $(zsh --version)"
    else
        print_error "Zsh 未安装"
    fi
    
    if [ -d "$HOME/.oh-my-zsh" ]; then
        print_success "Oh-My-Zsh 已安装"
    else
        print_error "Oh-My-Zsh 未安装"
    fi
    
    # 现代化工具
    echo -e "\n${YELLOW}[现代化工具]${NC}"
    local tools=("fzf" "bat" "eza" "fd" "rg" "autojump" "delta" "tldr" "htop" "ncdu")
    for tool in "${tools[@]}"; do
        if command_exists "$tool"; then
            print_success "$tool 已安装"
        else
            print_warning "$tool 未安装"
        fi
    done
    
    # 开发环境
    echo -e "\n${YELLOW}[开发环境]${NC}"
    
    # Node.js 检查多种可能的命令名
    if command_exists node; then
        print_success "Node.js: $(node --version)"
    elif command_exists nodejs; then
        print_success "Node.js: $(nodejs --version)"
    else
        print_warning "Node.js 未安装"
    fi
    
    if command_exists npm; then
        print_success "npm: $(npm --version)"
    else
        print_warning "npm 未安装"
    fi
    
    if command_exists python3; then
        print_success "Python: $(python3 --version)"
    else
        print_warning "Python3 未安装"
    fi
    
    if command_exists go; then
        print_success "Go: $(go version)"
    else
        print_info "Go 未安装"
    fi
    
    if command_exists docker; then
        print_success "Docker: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
    else
        print_info "Docker 未安装"
    fi
    
    echo -e "\n${CYAN}========== 诊断完成 ==========${NC}"
}

# 主安装函数
main_install() {
    print_header
    
    # 检测系统
    detect_distro
    print_step "检测到系统: $OS $VER"
    
    # 1. 更新系统包
    print_step "[1/10] 更新系统包..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        sudo apt update && sudo apt upgrade -y
        # 安装基础工具
        sudo apt install -y curl wget git vim build-essential software-properties-common \
            apt-transport-https ca-certificates gnupg lsb-release \
            unzip fontconfig locales
    else
        print_error "不支持的系统: $OS"
        exit 1
    fi
    print_success "系统包更新完成"
    
    # 2. 安装 Zsh
    print_step "[2/10] 安装 Zsh..."
    if ! command_exists zsh; then
        sudo apt install -y zsh
        print_success "Zsh 安装完成"
    else
        print_success "Zsh 已安装"
    fi
    
    # 3. 安装 Oh-My-Zsh
    print_step "[3/10] 安装 Oh-My-Zsh..."
    if [ ! -d "$HOME/.oh-my-zsh" ]; then
        # 使用国内镜像加速
        REMOTE="https://gitee.com/mirrors/oh-my-zsh.git"
        git clone --depth=1 $REMOTE "$HOME/.oh-my-zsh" || {
            # 如果国内镜像失败，使用官方源
            REMOTE="https://github.com/ohmyzsh/ohmyzsh.git"
            git clone --depth=1 $REMOTE "$HOME/.oh-my-zsh"
        }
        
        # 复制默认配置
        backup_file "$HOME/.zshrc"
        cp "$HOME/.oh-my-zsh/templates/zshrc.zsh-template" "$HOME/.zshrc"
        print_success "Oh-My-Zsh 安装完成"
    else
        print_success "Oh-My-Zsh 已安装"
    fi
    
    # 4. 安装 Powerlevel10k 主题
    print_step "[4/10] 安装 Powerlevel10k 主题..."
    P10K_DIR="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k"
    if [ ! -d "$P10K_DIR" ]; then
        git clone --depth=1 https://gitee.com/romkatv/powerlevel10k.git "$P10K_DIR" || \
        git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "$P10K_DIR"
        print_success "Powerlevel10k 安装完成"
    else
        print_success "Powerlevel10k 已安装"
    fi
    
    # 5. 安装 Zsh 插件
    print_step "[5/10] 安装 Zsh 插件..."
    
    # zsh-autosuggestions
    AUTOSUGGESTIONS_DIR="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-autosuggestions"
    if [ ! -d "$AUTOSUGGESTIONS_DIR" ]; then
        git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions "$AUTOSUGGESTIONS_DIR"
        print_success "zsh-autosuggestions 安装完成"
    fi
    
    # zsh-syntax-highlighting
    SYNTAX_DIR="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting"
    if [ ! -d "$SYNTAX_DIR" ]; then
        git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting "$SYNTAX_DIR"
        print_success "zsh-syntax-highlighting 安装完成"
    fi
    
    # zsh-completions
    COMPLETIONS_DIR="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-completions"
    if [ ! -d "$COMPLETIONS_DIR" ]; then
        git clone --depth=1 https://github.com/zsh-users/zsh-completions "$COMPLETIONS_DIR"
        print_success "zsh-completions 安装完成"
    fi
    
    # 6. 安装现代化命令行工具
    print_step "[6/10] 安装现代化命令行工具..."
    
    # fzf - 模糊搜索
    if ! command_exists fzf; then
        git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
        ~/.fzf/install --all --no-bash --no-fish
        print_success "fzf 安装完成"
    fi
    
    # bat - 更好的 cat
    if ! command_exists bat; then
        sudo apt install -y bat
        # Ubuntu/Debian 上 bat 可能被安装为 batcat
        if command_exists batcat && ! command_exists bat; then
            sudo ln -sf /usr/bin/batcat /usr/local/bin/bat
        fi
        print_success "bat 安装完成"
    fi
    
    # eza - 更好的 ls (exa 的继承者)
    if ! command_exists eza; then
        # 安装 eza
        sudo apt install -y gpg
        sudo mkdir -p /etc/apt/keyrings
        wget -qO- https://raw.githubusercontent.com/eza-community/eza/main/deb.asc | sudo gpg --dearmor -o /etc/apt/keyrings/gierens.gpg
        echo "deb [signed-by=/etc/apt/keyrings/gierens.gpg] http://deb.gierens.de stable main" | sudo tee /etc/apt/sources.list.d/gierens.list
        sudo apt update
        sudo apt install -y eza || {
            # 如果失败，尝试安装 exa
            sudo apt install -y exa
            sudo ln -sf /usr/bin/exa /usr/local/bin/eza
        }
        print_success "eza/exa 安装完成"
    fi
    
    # fd - 更好的 find
    if ! command_exists fd; then
        sudo apt install -y fd-find
        sudo ln -sf /usr/bin/fdfind /usr/local/bin/fd
        print_success "fd 安装完成"
    fi
    
    # ripgrep - 更好的 grep
    if ! command_exists rg; then
        sudo apt install -y ripgrep
        print_success "ripgrep 安装完成"
    fi
    
    # autojump - 目录快速跳转
    if ! command_exists autojump; then
        sudo apt install -y autojump
        print_success "autojump 安装完成"
    fi
    
    # 其他实用工具
    sudo apt install -y htop ncdu tldr jq tree duf neofetch
    
    # 7. 配置 Git 增强工具
    print_step "[7/9] 配置 Git 增强工具..."
    if ! command_exists delta; then
        # 安装 delta (更好的 git diff)
        wget -q https://github.com/dandavison/delta/releases/download/0.16.5/git-delta_0.16.5_amd64.deb
        sudo dpkg -i git-delta_0.16.5_amd64.deb
        rm git-delta_0.16.5_amd64.deb
        print_success "delta 安装完成"
    fi
    
    # 8. 安装字体
    print_step "[8/9] 安装 Nerd Fonts..."
    FONT_DIR="$HOME/.local/share/fonts"
    mkdir -p "$FONT_DIR"
    
    if [ ! -f "$FONT_DIR/MesloLGS NF Regular.ttf" ]; then
        # 下载 MesloLGS NF 字体（Powerlevel10k 推荐）
        wget -q -P "$FONT_DIR" https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS%20NF%20Regular.ttf
        wget -q -P "$FONT_DIR" https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS%20NF%20Bold.ttf
        wget -q -P "$FONT_DIR" https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS%20NF%20Italic.ttf
        wget -q -P "$FONT_DIR" https://github.com/romkatv/powerlevel10k-media/raw/master/MesloLGS%20NF%20Bold%20Italic.ttf
        
        fc-cache -fv "$FONT_DIR"
        print_success "Nerd Fonts 安装完成"
    else
        print_success "Nerd Fonts 已安装"
    fi
    
    # 9. 生成配置文件
    print_step "[9/9] 生成配置文件..."
    
    # 备份现有配置
    backup_file "$HOME/.zshrc"
    
    # 创建新的 .zshrc
    cat > "$HOME/.zshrc" << 'EOF'
# ╔══════════════════════════════════════╗
# ║   WSL2 Modern Zsh Configuration      ║
# ║   Generated by Setup Script          ║
# ╚══════════════════════════════════════╝

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 Oh-My-Zsh 配置
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export ZSH="$HOME/.oh-my-zsh"

# 主题设置
ZSH_THEME="powerlevel10k/powerlevel10k"

# 插件列表
plugins=(
    git
    sudo
    command-not-found
    zsh-autosuggestions
    zsh-syntax-highlighting
    zsh-completions
    autojump
    docker
    docker-compose
    npm
    python
    pip
    colored-man-pages
    extract
    z
)

# 自动更新
zstyle ':omz:update' mode auto
zstyle ':omz:update' frequency 7

# 加载 Oh-My-Zsh
source $ZSH/oh-my-zsh.sh

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎨 Powerlevel10k 配置
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 启用 Powerlevel10k 即时提示
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# 加载 P10k 配置
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔧 环境变量
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 基础路径
export PATH="$HOME/.local/bin:$HOME/bin:$PATH"

# 编辑器
export EDITOR='vim'
export VISUAL='vim'

# 语言环境
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Man pages 高亮
export LESS_TERMCAP_mb=$'\e[1;32m'
export LESS_TERMCAP_md=$'\e[1;32m'
export LESS_TERMCAP_me=$'\e[0m'
export LESS_TERMCAP_se=$'\e[0m'
export LESS_TERMCAP_so=$'\e[01;33m'
export LESS_TERMCAP_ue=$'\e[0m'
export LESS_TERMCAP_us=$'\e[1;4;31m'

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🛠 现代化工具别名
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 基础命令增强
alias ls='eza --icons --group-directories-first'
alias ll='eza -l --icons --group-directories-first'
alias la='eza -la --icons --group-directories-first'
alias tree='eza --tree --icons'
alias cat='bat --style=plain --paging=never'
alias less='bat --style=plain'
alias grep='rg'
alias find='fd'
alias du='duf'
alias df='duf'
alias top='htop'
alias ncdu='ncdu --color dark'

# Git 别名
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline --graph --decorate'
alias gd='git diff'
alias gco='git checkout'
alias gb='git branch'

# 快速导航
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias ~='cd ~'
alias -- -='cd -'

# 实用函数
mkcd() { mkdir -p "$1" && cd "$1"; }
extract() {
    if [ -f "$1" ]; then
        case $1 in
            *.tar.bz2)   tar xjf "$1"   ;;
            *.tar.gz)    tar xzf "$1"   ;;
            *.bz2)       bunzip2 "$1"   ;;
            *.rar)       unrar x "$1"   ;;
            *.gz)        gunzip "$1"    ;;
            *.tar)       tar xf "$1"    ;;
            *.tbz2)      tar xjf "$1"   ;;
            *.tgz)       tar xzf "$1"   ;;
            *.zip)       unzip "$1"     ;;
            *.Z)         uncompress "$1";;
            *.7z)        7z x "$1"      ;;
            *)           echo "'$1' cannot be extracted" ;;
        esac
    else
        echo "'$1' is not a valid file"
    fi
}

# 系统信息
sysinfo() {
    echo "System: $(lsb_release -ds)"
    echo "Kernel: $(uname -r)"
    echo "Shell: $SHELL ($ZSH_VERSION)"
    echo "Terminal: $TERM"
    echo "CPU: $(lscpu | grep 'Model name' | cut -d':' -f2 | xargs)"
    echo "Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 FZF 配置
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if [ -f ~/.fzf.zsh ]; then
    source ~/.fzf.zsh
    
    # FZF 默认选项
    export FZF_DEFAULT_OPTS="
        --height 40%
        --layout=reverse
        --border
        --inline-info
        --preview 'bat --color=always --style=numbers --line-range=:500 {}'
        --bind 'ctrl-/:toggle-preview'
    "
    
    # 使用 fd 作为默认搜索
    export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
    export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
    export FZF_ALT_C_COMMAND='fd --type d --hidden --follow --exclude .git'
    
    # 快捷键绑定
    bindkey '^F' fzf-file-widget
    bindkey '^R' fzf-history-widget
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📦 开发环境（根据需要手动配置）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Node.js (如果使用 nvm)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Node.js 别名（如果已安装）
if command -v nodejs >/dev/null 2>&1; then
    alias node='nodejs'
fi

# Python
if command -v python3 >/dev/null 2>&1; then
    export PYTHONDONTWRITEBYTECODE=1
    alias python='python3'
    alias pip='pip3'
fi

# Go (如果已安装)
if [ -d "/usr/local/go" ] || [ -d "$HOME/go" ]; then
    export GOPATH="$HOME/go"
    export PATH="$PATH:$GOPATH/bin:/usr/local/go/bin"
fi

# Rust (如果已安装)
[ -s "$HOME/.cargo/env" ] && source "$HOME/.cargo/env"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔌 WSL2 特定配置
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Windows 互操作
export PATH="$PATH:/mnt/c/Windows/System32"
export PATH="$PATH:/mnt/c/Windows/System32/WindowsPowerShell/v1.0"

# 在 WSL2 中打开 Windows 应用
alias explorer='explorer.exe'
alias code='code.exe'
alias notepad='notepad.exe'

# 获取 Windows 用户目录
export WINHOME="/mnt/c/Users/$(cmd.exe /c 'echo %USERNAME%' 2>/dev/null | tr -d '\r')"

# 快速导航到 Windows 目录
alias winhome="cd $WINHOME"
alias desktop="cd $WINHOME/Desktop"
alias downloads="cd $WINHOME/Downloads"
alias documents="cd $WINHOME/Documents"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎨 自动补全增强
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 补全选项
zstyle ':completion:*' menu select
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}"
zstyle ':completion:*' description 'format' '%B%d%b'
zstyle ':completion:*' group-name ''

# Docker 补全
zstyle ':completion:*:*:docker:*' option-stacking yes
zstyle ':completion:*:*:docker-*:*' option-stacking yes

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✨ 启动信息
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 显示系统信息
if command -v neofetch >/dev/null 2>&1; then
    neofetch --config none --ascii_distro ubuntu_small \
        --disable model kernel uptime packages shell resolution \
        --color_blocks off --cpu_temp off
fi

# 欢迎信息
echo ""
echo "  🚀 WSL2 Modern Shell | 📍 autojump/z | 🔍 fzf | 🦇 bat | 📁 eza"
echo "  💡 输入 'sysinfo' 查看系统信息 | 'p10k configure' 配置主题"
echo ""
EOF
    
    print_success "配置文件生成完成"
    
    # 生成 .p10k.zsh (如果不存在)
    if [ ! -f "$HOME/.p10k.zsh" ]; then
        print_info "首次运行时将自动配置 Powerlevel10k 主题"
    fi
    
    # 设置 Zsh 为默认 Shell
    if [ "$SHELL" != "$(which zsh)" ]; then
        print_info "设置 Zsh 为默认 Shell..."
        chsh -s $(which zsh)
        print_success "默认 Shell 已更改为 Zsh"
    fi
}

# 清理函数
cleanup() {
    print_step "清理临时文件..."
    sudo apt autoremove -y
    sudo apt autoclean
    print_success "清理完成"
}

# 显示使用帮助
show_help() {
    echo "WSL2 现代化开发环境配置脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help      显示帮助信息"
    echo "  -d, --diagnose  诊断当前环境"
    echo "  -m, --minimal   最小化安装（跳过开发工具）"
    echo "  -f, --force     强制重新安装所有组件"
    echo ""
    echo "示例:"
    echo "  $0              # 标准安装"
    echo "  $0 --diagnose   # 检查环境"
    echo "  $0 --minimal    # 最小化安装"
}

# 主程序入口
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--diagnose)
            diagnose_environment
            exit 0
            ;;
        -m|--minimal)
            MINIMAL_INSTALL=true
            main_install
            cleanup
            ;;
        -f|--force)
            FORCE_INSTALL=true
            main_install
            cleanup
            ;;
        *)
            main_install
            cleanup
            ;;
    esac
    
    # 完成提示
    echo -e "\n${GREEN}╔══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         ✅ 配置完成！                ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
    
    echo -e "\n${CYAN}已实现的功能：${NC}"
    echo -e "  ${GREEN}✓${NC} Zsh + Oh-My-Zsh - 现代化 Shell"
    echo -e "  ${GREEN}✓${NC} Powerlevel10k - 美观主题（类似 oh-my-posh）"
    echo -e "  ${GREEN}✓${NC} zsh-autosuggestions - 智能建议（类似 PSReadLine）"
    echo -e "  ${GREEN}✓${NC} zsh-syntax-highlighting - 语法高亮"
    echo -e "  ${GREEN}✓${NC} fzf - 模糊搜索（Ctrl+R 历史搜索）"
    echo -e "  ${GREEN}✓${NC} bat/eza/fd/ripgrep - 现代化工具"
    echo -e "  ${GREEN}✓${NC} autojump/z - 目录快速跳转"
    
    echo -e "\n${YELLOW}下一步操作：${NC}"
    echo -e "  1. 退出并重新打开终端"
    echo -e "  2. 首次进入会自动运行 ${CYAN}p10k configure${NC} 配置主题"
    echo -e "  3. 在 Windows Terminal 设置中更改字体为 ${CYAN}MesloLGS NF${NC}"
    
    echo -e "\n${MAGENTA}快速使用指南：${NC}"
    echo -e "  ${CYAN}z <目录名>${NC}     - 快速跳转到目录"
    echo -e "  ${CYAN}Ctrl+R${NC}        - 模糊搜索历史命令"
    echo -e "  ${CYAN}Ctrl+F${NC}        - 模糊搜索文件"
    echo -e "  ${CYAN}ll/la/tree${NC}    - 美化的目录列表"
    echo -e "  ${CYAN}cat/less${NC}      - 语法高亮的文件查看"
    
    echo -e "\n${BLUE}提示：运行 ${CYAN}$0 --diagnose${NC} 可以查看详细环境状态${NC}"
    echo -e "${BLUE}Wiki: https://github.com/your-repo/wsl2-setup${NC}"
}

# 脚本入口
main "$@"