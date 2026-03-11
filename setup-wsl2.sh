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

MINIMAL_INSTALL=false
FORCE_INSTALL=false

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
    if [ "$FORCE_INSTALL" = true ] || ! command_exists zsh; then
        sudo apt install -y zsh
        print_success "Zsh 安装完成"
    else
        print_success "Zsh 已安装"
    fi
    
    # 3. 安装 Oh-My-Zsh
    print_step "[3/10] 安装 Oh-My-Zsh..."
    if [ "$FORCE_INSTALL" = true ] && [ -d "$HOME/.oh-my-zsh" ]; then
        rm -rf "$HOME/.oh-my-zsh"
    fi
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
    if [ "$FORCE_INSTALL" = true ] && [ -d "$P10K_DIR" ]; then
        rm -rf "$P10K_DIR"
    fi
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
    if [ "$FORCE_INSTALL" = true ] && [ -d "$AUTOSUGGESTIONS_DIR" ]; then
        rm -rf "$AUTOSUGGESTIONS_DIR"
    fi
    if [ ! -d "$AUTOSUGGESTIONS_DIR" ]; then
        git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions "$AUTOSUGGESTIONS_DIR"
        print_success "zsh-autosuggestions 安装完成"
    fi
    
    # zsh-syntax-highlighting
    SYNTAX_DIR="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting"
    if [ "$FORCE_INSTALL" = true ] && [ -d "$SYNTAX_DIR" ]; then
        rm -rf "$SYNTAX_DIR"
    fi
    if [ ! -d "$SYNTAX_DIR" ]; then
        git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting "$SYNTAX_DIR"
        print_success "zsh-syntax-highlighting 安装完成"
    fi
    
    # zsh-completions
    COMPLETIONS_DIR="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-completions"
    if [ "$FORCE_INSTALL" = true ] && [ -d "$COMPLETIONS_DIR" ]; then
        rm -rf "$COMPLETIONS_DIR"
    fi
    if [ ! -d "$COMPLETIONS_DIR" ]; then
        git clone --depth=1 https://github.com/zsh-users/zsh-completions "$COMPLETIONS_DIR"
        print_success "zsh-completions 安装完成"
    fi
    
    # 6. 安装现代化命令行工具
    print_step "[6/10] 安装现代化命令行工具..."
    
    # fzf - 模糊搜索
    if [ "$FORCE_INSTALL" = true ] && [ -d "$HOME/.fzf" ]; then
        rm -rf "$HOME/.fzf"
    fi
    if [ ! -d "$HOME/.fzf" ]; then
        git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
        ~/.fzf/install --all --no-bash --no-fish
        print_success "fzf 安装完成"
    fi
    
    # bat - 更好的 cat
    if [ "$FORCE_INSTALL" = true ] || ! command_exists bat; then
        sudo apt install -y bat
        # Ubuntu/Debian 上 bat 可能被安装为 batcat
        if command_exists batcat && ! command_exists bat; then
            sudo ln -sf /usr/bin/batcat /usr/local/bin/bat
        fi
        print_success "bat 安装完成"
    fi
    
    # eza - 更好的 ls (exa 的继承者)
    if [ "$FORCE_INSTALL" = true ] || ! command_exists eza; then
        # 优先使用系统自带仓库，避免引入额外外部源
        sudo apt install -y eza || {
            # 如果失败，尝试安装 exa 并建立兼容别名
            sudo apt install -y exa
            sudo ln -sf /usr/bin/exa /usr/local/bin/eza
        }
        print_success "eza/exa 安装完成"
    fi
    
    # fd - 更好的 find
    if [ "$FORCE_INSTALL" = true ] || ! command_exists fd; then
        sudo apt install -y fd-find
        sudo ln -sf /usr/bin/fdfind /usr/local/bin/fd
        print_success "fd 安装完成"
    fi
    
    # ripgrep - 更好的 grep
    if [ "$FORCE_INSTALL" = true ] || ! command_exists rg; then
        sudo apt install -y ripgrep
        print_success "ripgrep 安装完成"
    fi
    
    # autojump - 目录快速跳转
    if [ "$FORCE_INSTALL" = true ] || ! command_exists autojump; then
        sudo apt install -y autojump
        print_success "autojump 安装完成"
    fi
    
    # 其他实用工具
    if [ "$MINIMAL_INSTALL" = true ]; then
        print_info "最小化安装模式：跳过附加实用工具"
    else
        sudo apt install -y htop ncdu tldr jq tree duf neofetch
    fi
    
    # 7. 配置 Git 增强工具
    print_step "[7/9] 配置 Git 增强工具..."
    if [ "$MINIMAL_INSTALL" = true ]; then
        print_info "最小化安装模式：跳过 delta 安装"
    elif [ "$FORCE_INSTALL" = true ] || ! command_exists delta; then
        # 安装 delta (更好的 git diff)，优先使用系统仓库
        sudo apt install -y git-delta || {
            # 回退到官方发布包，并进行 SHA256 校验
            DELTA_VERSION="0.16.5"
            DELTA_DEB="git-delta_${DELTA_VERSION}_amd64.deb"
            DELTA_URL="https://github.com/dandavison/delta/releases/download/${DELTA_VERSION}/${DELTA_DEB}"
            DELTA_SUMS_URL="https://github.com/dandavison/delta/releases/download/${DELTA_VERSION}/sha256sums.txt"

            wget -q "${DELTA_URL}"
            wget -q "${DELTA_SUMS_URL}"

            if ! grep -q "${DELTA_DEB}" sha256sums.txt; then
                print_error "未找到 ${DELTA_DEB} 的校验信息"
                rm -f "${DELTA_DEB}" sha256sums.txt
                exit 1
            fi

            sha256sum --check --ignore-missing sha256sums.txt || {
                print_error "delta 校验失败，终止安装"
                rm -f "${DELTA_DEB}" sha256sums.txt
                exit 1
            }

            sudo dpkg -i "${DELTA_DEB}"
            rm -f "${DELTA_DEB}" sha256sums.txt
        }
        print_success "delta 安装完成"
    fi
    
    # 8. 安装字体
    print_step "[8/9] 安装 Nerd Fonts..."
    FONT_DIR="$HOME/.local/share/fonts"
    mkdir -p "$FONT_DIR"
    
    if [ "$MINIMAL_INSTALL" = true ]; then
        print_info "最小化安装模式：跳过 Nerd Fonts 安装"
    elif [ "$FORCE_INSTALL" = true ] || [ ! -f "$FONT_DIR/MesloLGS NF Regular.ttf" ]; then
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

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🌐 Clash 代理检测和配置
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 获取 Windows 主机 IP
get_windows_host_ip() {
    # 方法1: 通过路由表获取
    local host_ip=$(ip route show | grep -i default | awk '{print $3}' | head -1)
    if [ -n "$host_ip" ] && [ "$host_ip" != "0.0.0.0" ]; then
        echo "$host_ip"
        return 0
    fi
    
    # 方法2: 通过 /etc/resolv.conf 获取
    host_ip=$(grep -oP "(?<=nameserver\s)(\d+\.){3}\d+" /etc/resolv.conf | head -1)
    if [ -n "$host_ip" ]; then
        echo "$host_ip"
        return 0
    fi
    
    # 默认值
    echo "172.16.0.1"
}

# 检测 Clash 配置文件
detect_clash_config() {
    local config_paths=(
        "$WINHOME/.config/clash/config.yaml"
        "$WINHOME/.config/clash/config.yml" 
        "$WINHOME/Documents/clash/config.yaml"
        "/mnt/c/Users/*/.config/clash/config.yaml"
    )
    
    for path in "${config_paths[@]}"; do
        if [ -f "$path" ] 2>/dev/null; then
            echo "$path"
            return 0
        fi
    done
    
    return 1
}

# 解析 Clash 配置获取端口
parse_clash_ports() {
    local config_file="$1"
    local http_port socks_port controller_port
    
    if [ -f "$config_file" ]; then
        # 解析 HTTP 代理端口
        http_port=$(grep -E "^port\s*:" "$config_file" | sed -E 's/port\s*:\s*([0-9]+).*/\1/')
        
        # 解析 SOCKS 代理端口
        socks_port=$(grep -E "^socks-port\s*:" "$config_file" | sed -E 's/socks-port\s*:\s*([0-9]+).*/\1/')
        
        # 解析控制器端口
        controller_port=$(grep -E "^external-controller\s*:" "$config_file" | sed -E 's/.*:([0-9]+).*/\1/')
        
        # 输出结果
        echo "HTTP_PORT=${http_port:-7890}"
        echo "SOCKS_PORT=${socks_port:-7891}"
        echo "CONTROLLER_PORT=${controller_port:-9090}"
        return 0
    fi
    
    # 默认端口
    echo "HTTP_PORT=7890"
    echo "SOCKS_PORT=7891" 
    echo "CONTROLLER_PORT=9090"
    return 1
}

# 测试端口连通性
test_port() {
    local host="$1"
    local port="$2"
    local timeout=3
    
    if command -v nc >/dev/null 2>&1; then
        nc -z -w$timeout "$host" "$port" 2>/dev/null
    elif command -v timeout >/dev/null 2>&1; then
        timeout $timeout bash -c "</dev/tcp/$host/$port" 2>/dev/null
    else
        # 使用 curl 作为备选
        curl -s --connect-timeout $timeout "http://$host:$port" >/dev/null 2>&1
    fi
}

# Clash 代理检测主函数
clash_check() {
    local show_details=false
    local auto_configure=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--details) show_details=true; shift ;;
            -a|--auto) auto_configure=true; shift ;;
            *) shift ;;
        esac
    done
    
    echo -e "\n🔍 正在检测 Clash 代理状态..."
    
    # 获取 Windows 主机 IP
    local host_ip=$(get_windows_host_ip)
    echo "🖥️  Windows 主机 IP: $host_ip"
    
    # 检测配置文件
    local config_file
    config_file=$(detect_clash_config)
    if [ $? -eq 0 ]; then
        echo "📄 找到配置文件: $(basename "$config_file")"
        eval $(parse_clash_ports "$config_file")
    else
        echo "⚠️  未找到 Clash 配置文件，使用默认端口"
        HTTP_PORT=7890
        SOCKS_PORT=7891
        CONTROLLER_PORT=9090
    fi
    
    if [ "$show_details" = true ]; then
        echo -e "\n📋 配置详情:"
        echo "   HTTP 代理端口: $HTTP_PORT"
        echo "   SOCKS 代理端口: $SOCKS_PORT" 
        echo "   控制器端口: $CONTROLLER_PORT"
    fi
    
    # 测试端口连通性
    local http_active=false
    local socks_active=false
    local controller_active=false
    
    echo -e "\n🔌 测试端口连通性..."
    
    if test_port "$host_ip" "$HTTP_PORT"; then
        echo "✅ HTTP 代理端口 $HTTP_PORT 已开启"
        http_active=true
    else
        echo "❌ HTTP 代理端口 $HTTP_PORT 未响应"
    fi
    
    if test_port "$host_ip" "$SOCKS_PORT"; then
        echo "✅ SOCKS 代理端口 $SOCKS_PORT 已开启"
        socks_active=true
    else
        echo "❌ SOCKS 代理端口 $SOCKS_PORT 未响应"
    fi
    
    if test_port "$host_ip" "$CONTROLLER_PORT"; then
        echo "✅ 控制器端口 $CONTROLLER_PORT 已开启"
        echo "   管理界面: http://$host_ip:$CONTROLLER_PORT/ui"
        controller_active=true
    else
        echo "❌ 控制器端口 $CONTROLLER_PORT 未响应"
    fi
    
    # 自动配置代理
    if [ "$auto_configure" = true ] && [ "$http_active" = true ]; then
        echo -e "\n🔧 正在配置代理环境变量..."
        
        export HTTP_PROXY="http://$host_ip:$HTTP_PORT"
        export HTTPS_PROXY="http://$host_ip:$HTTP_PORT"
        export ALL_PROXY="http://$host_ip:$HTTP_PORT"
        export http_proxy="$HTTP_PROXY"
        export https_proxy="$HTTPS_PROXY" 
        export all_proxy="$ALL_PROXY"
        
        # 设置 Git 代理
        git config --global http.proxy "$HTTP_PROXY"
        git config --global https.proxy "$HTTPS_PROXY"
        
        echo "✅ 代理环境变量已配置"
        echo "   HTTP_PROXY: $HTTP_PROXY"
        echo "   HTTPS_PROXY: $HTTPS_PROXY"
        
        # 测试代理连接
        echo -e "\n🌐 测试代理连接..."
        if curl -s --connect-timeout 10 --max-time 10 -o /dev/null -w "%{http_code}" "https://www.google.com" | grep -q "200"; then
            echo "✅ 代理连接测试成功"
        else
            echo "⚠️  代理连接测试失败，请检查 Clash 规则配置"
        fi
    fi
    
    # 返回状态
    if [ "$http_active" = true ] || [ "$socks_active" = true ]; then
        return 0
    else
        return 1
    fi
}

# 重置代理设置
clash_reset() {
    echo "🔄 正在重置代理设置..."
    
    # 清除环境变量
    unset HTTP_PROXY HTTPS_PROXY ALL_PROXY
    unset http_proxy https_proxy all_proxy
    
    # 清除 Git 代理配置
    git config --global --unset http.proxy 2>/dev/null
    git config --global --unset https.proxy 2>/dev/null
    
    echo "✅ 代理设置已重置"
}

# 自动启用代理
clash_start() {
    echo "🚀 自动检测并配置 Clash 代理..."
    clash_check --auto
}

# 快速导航到 Windows 目录
alias winhome="cd $WINHOME"
alias desktop="cd $WINHOME/Desktop"
alias downloads="cd $WINHOME/Downloads"
alias documents="cd $WINHOME/Documents"

# Clash 代理管理别名
alias clash-check='clash_check'
alias clash-start='clash_start'
alias clash-reset='clash_reset'

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
echo "  💡 输入 'sysinfo' 查看系统信息 | 'p10k configure' 配置主题 | 'clash-check' 检测代理"
echo ""

# 自动检测 Clash 代理（静默检测）
if command -v curl >/dev/null 2>&1; then
    host_ip=$(get_windows_host_ip 2>/dev/null)
    if [ -n "$host_ip" ] && test_port "$host_ip" "7890" 2>/dev/null; then
        echo "🌐 检测到 Clash 代理正在运行，输入 'clash-start' 自动配置"
    fi
fi
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
    echo "  -m, --minimal   最小化安装（跳过附加工具、delta 和字体）"
    echo "  -f, --force     强制重新安装已存在的组件"
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
    echo -e "${BLUE}Repo: https://github.com/wenbingkun/wenbingkun.github.io${NC}"
}

# 脚本入口
main "$@"
