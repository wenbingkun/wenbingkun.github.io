#!/usr/bin/env python3
"""
LED歌词播放器本地服务器启动脚本
用于解决file://协议的CORS限制问题
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

def find_free_port(start_port=8000, max_attempts=10):
    """查找可用端口"""
    import socket
    
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    
    raise RuntimeError(f"无法在端口 {start_port}-{start_port + max_attempts} 范围内找到可用端口")

def main():
    # 切换到项目目录
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # 查找可用端口
    try:
        port = find_free_port()
    except RuntimeError as e:
        print(f"❌ 错误: {e}")
        return 1
    
    # 创建HTTP服务器
    handler = http.server.SimpleHTTPRequestHandler
    
    # 添加MIME类型支持
    handler.extensions_map.update({
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
        '.json': 'application/json',
        '.lrc': 'text/plain'
    })
    
    try:
        with socketserver.TCPServer(("localhost", port), handler) as httpd:
            url = f"http://localhost:{port}/index.html"
            
            print("🎵 LED歌词播放器本地服务器")
            print("=" * 40)
            print(f"📡 服务器地址: {url}")
            print(f"🔧 端口号: {port}")
            print("📁 服务目录:", script_dir.absolute())
            print("\n✨ 服务器已启动，正在自动打开浏览器...")
            print("💡 按 Ctrl+C 停止服务器")
            print("=" * 40)
            
            # 自动打开浏览器
            try:
                webbrowser.open(url)
                print(f"🌐 已在默认浏览器中打开: {url}")
            except Exception as e:
                print(f"⚠️  无法自动打开浏览器: {e}")
                print(f"📋 请手动复制以下地址到浏览器中:")
                print(f"   {url}")
            
            print("\n🎯 开始使用LED歌词播放器吧！")
            
            # 启动服务器
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n🛑 服务器已停止")
        print("👋 感谢使用LED歌词播放器！")
        return 0
    except Exception as e:
        print(f"❌ 服务器启动失败: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())