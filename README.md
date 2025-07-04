# wenbingkun.github.io

这是个人主页及工具集合，包含以下内容：

## 主页（index.html）
- 个人介绍、联系方式（邮箱、GitHub）。
- 展示和入口：
  - 🎲 [lottery-app](lovecan-lottery.html)：LOVECAN重映-幸运弦迷抽奖工具。
  - 🎵 [music-player](lyrics_player%20.html)：LED演出歌词显示器。
  - ⚡ [clash-comprehensive-rules](clash-comprehensive-rules.yaml)：全球精品机场融合配置（推荐）。
  - ⚡ [clash-win](clash-win.yaml)：基础全球机场配置。

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

### clash-comprehensive-rules.yaml（推荐）⭐
**全球精品机场融合配置 - 优化版**
- **版本**: v3.1.0 | **更新**: 2025年7月
- **核心特色**:
  - 🌍 **7大洲节点覆盖**: 包含南极洲在内的31个国家/地区
  - 📋 **智能分流架构**: 专用规则优先，避免通用规则误捕获
  - 🤖 **AI服务支持**: OpenAI、Claude、Gemini、Copilot、Perplexity
  - 🎮 **游戏专线**: 自动筛选游戏专用节点，延迟优化
  - 🎯 **精准分类**: YouTube→谷歌服务，TikTok→社交平台
  
- **平台支持**:
  - ✅ **Windows/macOS**: 完美兼容 (推荐)
  - ✅ **Linux**: 最佳性能
  - ⚠️ **Android**: 基础功能可用
  - ❌ **iOS**: 需要格式转换

- **规则优先级**:
  ```
  专用平台规则 → 通用兜底规则
  YouTube/TikTok/Netflix等专用规则 → GlobalMedia/SocialMedia通用规则
  ```

- **技术亮点**:
  - 解决了行业常见的规则冲突问题
  - 前瞻性的平台逻辑分类
  - 业内领先的全球节点覆盖

### clash-win.yaml（基础版）
**传统全球机场配置**
- 基础的多地区节点支持
- 简单的分流规则
- 适合对配置要求不高的用户

## 使用说明

### Clash配置使用步骤
1. 下载对应的YAML配置文件
2. 替换文件中的机场订阅链接
3. 导入到Clash客户端
4. 根据需要选择对应的代理组

### 适用场景
- **日常使用**: 选择clash-comprehensive-rules.yaml
- **AI开发**: 支持主流AI服务独立路由
- **流媒体**: Netflix、Disney+、YouTube等优化
- **游戏**: Steam、Epic、PlayStation等平台支持
- **开发**: GitHub、GitLab等开发平台优化

## 更新日志

### v3.1.0 (2025-01)
- ✅ 修正AI服务描述，移除夸大宣传
- ✅ 实现规则优先级最佳实践
- ✅ 解决YouTube/TikTok分流冲突
- ✅ 新增南极洲节点支持（7大洲覆盖）
- ✅ 优化规则匹配性能

## 技术支持

如有建议或问题，欢迎联系：
- 📧 邮箱：wenbingkun666@gmail.com 
- 🔗 GitHub：[wenbingkun](https://github.com/wenbingkun)

---

> **免责声明**: 本项目仅供学习交流使用，请遵守当地法律法规。代理服务请选择合规的服务提供商。