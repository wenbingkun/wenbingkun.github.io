#!/bin/bash

#############################################
# WSL2 环境快速修复与优化
# 用于补充缺失的组件并优化配置
#############################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   WSL2 环境快速修复与优化           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"

# 1. 安装缺失的 fzf
echo -e "\n${BLUE}[1/4]${NC} 安装 fzf (模糊搜索工具)..."
if ! command -v fzf >/dev/null 2>&1; then
    git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
    ~/.fzf/install --all --no-bash --no-fish
    echo -e "${GREEN}✓${NC} fzf 安装完成"
else
    echo -e "${GREEN}✓${NC} fzf 已安装"
fi

# 2. 安装 Zsh 插件（如果缺失）
echo -e "\n${BLUE}[2/4]${NC} 检查 Zsh 插件..."

# zsh-autosuggestions
if [ ! -d "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-autosuggestions" ]; then
    echo "  安装 zsh-autosuggestions..."
    git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions \
        "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-autosuggestions"
    echo -e "${GREEN}  ✓${NC} zsh-autosuggestions 安装完成"
fi

# zsh-syntax-highlighting
if [ ! -d "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting" ]; then
    echo "  安装 zsh-syntax-highlighting..."
    git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting \
        "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting"
    echo -e "${GREEN}  ✓${NC} zsh-syntax-highlighting 安装完成"
fi

# 3. 安装 Powerlevel10k 主题
echo -e "\n${BLUE}[3/4]${NC} 检查 Powerlevel10k 主题..."
P10K_DIR="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k"
if [ ! -d "$P10K_DIR" ]; then
    echo "  安装 Powerlevel10k..."
    git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "$P10K_DIR"
    echo -e "${GREEN}✓${NC} Powerlevel10k 安装完成"
else
    echo -e "${GREEN}✓${NC} Powerlevel10k 已安装"
fi

# 4. 优化 .zshrc 配置
echo -e "\n${BLUE}[4/4]${NC} 优化 Zsh 配置..."

# 备份现有配置
if [ -f "$HOME/.zshrc" ]; then
    cp "$HOME/.zshrc" "$HOME/.zshrc.backup.$(date +%Y%m%d%H%M%S)"
    echo -e "${CYAN}ℹ${NC} 已备份现有配置"
fi

# 创建优化的配置
cat > "$HOME/.zshrc" << 'EOF'
# ╔══════════════════════════════════════╗
# ║   WSL2 Optimized Zsh Configuration   ║
# ╚══════════════════════════════════════╝

# Oh-My-Zsh 路径
export ZSH="$HOME/.oh-my-zsh"

# 主题
ZSH_THEME="powerlevel10k/powerlevel10k"

# 插件
plugins=(
    git
    sudo
    z
    extract
    command-not-found
    zsh-autosuggestions
    zsh-syntax-highlighting
    autojump
    docker
    npm
    python
    colored-man-pages
)

# 自动更新
zstyle ':omz:update' mode auto

source $ZSH/oh-my-zsh.sh

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Powerlevel10k
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 即时提示
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# P10k 配置
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 环境变量
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export PATH="$HOME/.local/bin:$HOME/bin:$PATH"
export EDITOR='vim'
export LANG=en_US.UTF-8

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 现代化工具别名
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 文件操作
alias ls='eza --icons --group-directories-first'
alias ll='eza -l --icons --group-directories-first'
alias la='eza -la --icons --group-directories-first'
alias lt='eza --tree --icons --level=2'
alias tree='eza --tree --icons'

# 增强命令
alias cat='bat --style=plain --paging=never'
alias less='bat'
alias grep='rg'
alias find='fd'
alias top='htop'

# Git 快捷
alias gs='git status'
alias ga='git add'
alias gc='git commit -m'
alias gp='git push'
alias gl='git log --oneline --graph --decorate'
alias gd='delta'

# 导航
alias ..='cd ..'
alias ...='cd ../..'
alias ~='cd ~'
alias -- -='cd -'

# Node.js (适配 Ubuntu 的 nodejs 命令)
if command -v nodejs >/dev/null 2>&1 && ! command -v node >/dev/null 2>&1; then
    alias node='nodejs'
fi

# Python
alias python='python3'
alias pip='pip3'

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FZF 配置
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

export FZF_DEFAULT_OPTS="
    --height 40%
    --layout=reverse
    --border
    --inline-info
    --preview 'bat --color=always --style=numbers --line-range=:500 {}'
    --bind 'ctrl-/:toggle-preview'
"

export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
export FZF_ALT_C_COMMAND='fd --type d --hidden --follow --exclude .git'

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# WSL2 特定配置
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Windows 互操作
export PATH="$PATH:/mnt/c/Windows/System32"
alias explorer='explorer.exe'
alias code='code'
alias notepad='notepad.exe'

# Windows 用户目录
export WINHOME="/mnt/c/Users/$(cmd.exe /c 'echo %USERNAME%' 2>/dev/null | tr -d '\r')"
alias winhome="cd $WINHOME"
alias desktop="cd $WINHOME/Desktop"
alias downloads="cd $WINHOME/Downloads"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 实用函数
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 创建并进入目录
mkcd() { mkdir -p "$1" && cd "$1"; }

# 解压任何压缩文件
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
    fi
}

# 系统信息
sysinfo() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "System: $(lsb_release -ds)"
    echo "Kernel: $(uname -r)"
    echo "Shell:  $SHELL ($ZSH_VERSION)"
    echo "Node:   $(nodejs --version 2>/dev/null || echo 'Not installed')"
    echo "npm:    $(npm --version 2>/dev/null || echo 'Not installed')"
    echo "Python: $(python3 --version 2>/dev/null | cut -d' ' -f2)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 自动补全
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 启用 autojump
[[ -s /usr/share/autojump/autojump.zsh ]] && source /usr/share/autojump/autojump.zsh

# 补全选项
zstyle ':completion:*' menu select
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 启动欢迎
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 简洁的欢迎信息
echo ""
echo "  🚀 WSL2 Ubuntu $(lsb_release -rs) | Node $(nodejs -v 2>/dev/null | cut -d'v' -f2) | Zsh $(zsh --version | cut -d' ' -f2)"
echo "  📍 autojump (j) | 🔍 fzf (Ctrl+R) | 🦇 bat | 📁 eza | ⚡ ripgrep"
echo ""
EOF

echo -e "${GREEN}✓${NC} 配置文件已优化"

# 完成提示
echo -e "\n${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ✅ 优化完成！                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"

echo -e "\n${CYAN}已完成的优化：${NC}"
echo -e "  ${GREEN}✓${NC} 安装 fzf 模糊搜索"
echo -e "  ${GREEN}✓${NC} 配置 Zsh 插件"
echo -e "  ${GREEN}✓${NC} 设置 Powerlevel10k 主题"
echo -e "  ${GREEN}✓${NC} 优化命令别名"
echo -e "  ${GREEN}✓${NC} 配置 Node.js 别名（nodejs → node）"

echo -e "\n${YELLOW}快捷键使用：${NC}"
echo -e "  ${CYAN}Ctrl+R${NC}  - 搜索历史命令（fzf）"
echo -e "  ${CYAN}Ctrl+T${NC}  - 搜索文件（fzf）"
echo -e "  ${CYAN}Alt+C${NC}   - 搜索并跳转目录（fzf）"
echo -e "  ${CYAN}j <名称>${NC} - 快速跳转（autojump）"

echo -e "\n${YELLOW}下一步：${NC}"
echo -e "  1. 运行: ${CYAN}source ~/.zshrc${NC} 或重新打开终端"
echo -e "  2. 首次会运行 ${CYAN}p10k configure${NC} 配置主题"
echo -e "  3. 在 Windows Terminal 设置字体为 ${CYAN}MesloLGS NF${NC}"

# 询问是否立即应用
echo -e "\n${BLUE}是否立即应用配置? (y/n):${NC} "
read -r response
if [[ "$response" == "y" || "$response" == "Y" ]]; then
    exec zsh
fi