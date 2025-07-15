/**
 * 辅助组件类 - 支持主播放器的各种功能组件
 */

// 歌词解析器
class LyricsParser {
    constructor() {
        this.cache = new Map();
    }
    
    async parseMultipleFiles(files) {
        const songs = [];
        
        for (const file of files) {
            try {
                const song = await this.parseFile(file);
                songs.push(song);
            } catch (error) {
                console.error(`解析歌词文件失败: ${file.name}`, error);
            }
        }
        
        return songs.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    async parseFile(file) {
        const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
            reader.onload = (e) => {
                try {
                    const lyrics = this.parseLrcContent(e.target.result);
                    const song = {
                        name: file.name.replace(/\.[^/.]+$/, ""),
                        lyrics: lyrics,
                        duration: lyrics.length > 0 ? lyrics[lyrics.length - 1].time + 5 : 300,
                        mode: 'auto', // 支持 'auto', 'lyrics', 'audio', 'sync'
                        availableModes: ['lyrics'], // 初始只有歌词模式
                        file: file,
                        audioFile: null,
                        originalMode: 'auto'
                    };
                    
                    this.cache.set(cacheKey, song);
                    resolve(song);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file, 'UTF-8');
        });
    }
    
    parseLrcContent(content) {
        const lyrics = [];
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
            const match = line.match(/\[(\d+):(\d+)(?:\.(\d+))?\](.*)/);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const centiseconds = match[3] ? parseInt(match[3].padEnd(2, '0').slice(0, 2)) : 0;
                const text = match[4].trim() || '♪';
                
                const time = minutes * 60 + seconds + centiseconds / 100;
                lyrics.push({ time, text });
            }
        });
        
        return lyrics.sort((a, b) => a.time - b.time);
    }
    
    clearCache() {
        this.cache.clear();
    }
}

// 歌词渲染器
class LyricsRenderer {
    constructor(performanceOptimizer) {
        this.performanceOptimizer = performanceOptimizer;
        this.currentLyricEl = document.getElementById('currentLyric');
        this.nextLyricEl = document.getElementById('nextLyric');
        this.fontScale = 1.3;
        this.currentIndex = -1;
    }
    
    render(lyrics, currentTime) {
        const newIndex = this.findLyricIndex(lyrics, currentTime);
        
        if (newIndex !== this.currentIndex) {
            this.currentIndex = newIndex;
            this.updateDisplay(lyrics, newIndex);
        }
    }
    
    findLyricIndex(lyrics, currentTime) {
        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (lyrics[i].time <= currentTime) {
                return i;
            }
        }
        return -1;
    }
    
    updateDisplay(lyrics, index) {
        this.performanceOptimizer.batchDOMUpdate('lyrics', () => {
            if (index >= 0 && index < lyrics.length) {
                this.currentLyricEl.textContent = lyrics[index].text;
                this.currentLyricEl.classList.add('entering');
                
                // 移除动画类
                setTimeout(() => {
                    this.currentLyricEl.classList.remove('entering');
                }, 800);
            } else {
                this.currentLyricEl.textContent = '♪';
            }
            
            // 显示下一句歌词
            if (index + 1 < lyrics.length) {
                this.nextLyricEl.textContent = lyrics[index + 1].text;
            } else {
                this.nextLyricEl.textContent = '';
            }
        });
    }
    
    setFontScale(scale) {
        this.fontScale = scale;
        document.documentElement.style.setProperty('--font-scale', scale);
    }
    
    destroy() {
        // 清理渲染器
    }
}

// 音频管理器
class AudioManager {
    constructor(resourceManager, errorHandler, eventManager) {
        this.resourceManager = resourceManager;
        this.errorHandler = errorHandler;
        this.eventManager = eventManager; // 添加 eventManager
        this.currentAudio = null;
        this.audioCache = new Map();

        // 监听歌曲移除事件
        this.eventManager.on('song-removed', (event) => {
            this.cleanupSong(event.data.song);
        });
    }
    
    async play(song) {
        const finalMode = this.determineFinalMode(song);

        if (finalMode === 'audio' || finalMode === 'sync') {
            if (!this.currentAudio || this.currentAudio.song !== song) {
                await this.loadAudio(song);
            }
            
            if (this.currentAudio) {
                await this.currentAudio.element.play();
            }
        }
    }
    
    pause() {
        if (this.currentAudio) {
            this.currentAudio.element.pause();
        }
    }
    
    setCurrentTime(time) {
        if (this.currentAudio) {
            this.currentAudio.element.currentTime = time;
        }
    }
    
    setPlaybackRate(rate) {
        if (this.currentAudio) {
            this.currentAudio.element.playbackRate = rate;
        }
    }

    async preload(song) {
        if (!song || !song.audioFile || song.mode === 'lyrics') return;

        const cacheKey = `${song.audioFile.name}_${song.audioFile.size}`;
        if (this.audioCache.has(cacheKey)) {
            return; // 已经缓存
        }

        // 使用 loadAudio 方法来预加载，但不播放
        try {
            await this.loadAudio(song, { preload: true });
        } catch (error) {
            this.errorHandler.handle(error, {
                operation: 'preloadAudio',
                songName: song.name
            });
        }
    }
    
    async loadAudio(song, options = {}) {
        if (!song.audioFile) return;

        const cacheKey = `${song.audioFile.name}_${song.audioFile.size}`;

        if (this.audioCache.has(cacheKey)) {
            if (!options.preload) {
                this.currentAudio = this.audioCache.get(cacheKey);
            }
            return;
        }

        const audio = this.resourceManager.createAudioElement();
        const url = this.resourceManager.createObjectURL(song.audioFile);

        return new Promise((resolve, reject) => {
            audio.onloadedmetadata = () => {
                const audioInfo = {
                    element: audio,
                    song: song,
                    url: url
                };

                // 添加时间更新事件监听
                this.setupAudioEvents(audio, song);

                this.audioCache.set(cacheKey, audioInfo);
                if (!options.preload) {
                    this.currentAudio = audioInfo;
                }
                resolve();
            };

            audio.onerror = (e) => {
                this.resourceManager.revokeObjectURL(url);
                reject(new Error('音频加载失败'));
            };

            audio.src = url;
        });
    }
    
    async loadMultipleFiles(files) {
        const results = [];
        
        for (const file of files) {
            try {
                // 创建音频歌曲对象
                const audioSong = {
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    lyrics: [],
                    duration: 0, // 会在加载音频时更新
                    mode: 'auto',
                    availableModes: ['audio'],
                    file: null,
                    audioFile: file,
                    originalMode: 'auto'
                };
                
                // 尝试匹配现有歌词
                const matchedSong = this.findMatchingSong(audioSong.name);
                
                if (matchedSong) {
                    // 找到匹配的歌词，合并为同步模式
                    matchedSong.audioFile = file;
                    matchedSong.availableModes = ['lyrics', 'audio', 'sync'];
                    matchedSong.mode = 'auto'; // 自动选择最佳模式
                    
                    // 更新音频时长
                    await this.updateAudioDuration(matchedSong);
                    
                    results.push({ type: 'matched', song: matchedSong });
                } else {
                    // 没有匹配的歌词，创建纯音频歌曲
                    await this.updateAudioDuration(audioSong);
                    results.push({ type: 'new', song: audioSong });
                }
                
            } catch (error) {
                console.error(`加载音频文件失败: ${file.name}`, error);
                results.push({ type: 'error', file, error: error.message });
            }
        }
        
        return results;
    }
    
    // 查找匹配的歌曲
    findMatchingSong(audioName) {
        // 通过全局播放器实例获取歌曲列表和智能匹配器
        if (window.playerInstance && window.playerInstance.smartMatcher) {
            const songs = window.playerInstance.stateManager.getState('songs.list');
            const matchResult = window.playerInstance.smartMatcher.findBestMatch(audioName, songs);
            return matchResult ? matchResult.song : null;
        }
        return null;
    }
    
    // 更新音频时长
    async updateAudioDuration(song) {
        if (!song.audioFile) return;
        
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            const url = URL.createObjectURL(song.audioFile);
            
            audio.onloadedmetadata = () => {
                song.duration = audio.duration;
                URL.revokeObjectURL(url);
                resolve();
            };
            
            audio.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('无法加载音频元数据'));
            };
            
            audio.src = url;
        });
    }
    
    setupAudioEvents(audio, song) {
        // 时间更新事件
        audio.addEventListener('timeupdate', () => {
            if (this.currentAudio && this.currentAudio.element === audio) {
                const finalMode = this.determineFinalMode(song);
                
                if (finalMode === 'sync' || finalMode === 'audio') {
                    // 在同步模式或音频模式下，以音频时间为准
                    if (window.playerInstance && window.playerInstance.stateManager) {
                        window.playerInstance.stateManager.setState('player.currentTime', audio.currentTime);
                    }
                }
            }
        });
        
        // 播放结束事件
        audio.addEventListener('ended', () => {
            if (this.currentAudio && this.currentAudio.element === audio) {
                this.eventManager.emit('song-ended');
            }
        });
        
        // 音频错误事件
        audio.addEventListener('error', (e) => {
            console.error('音频播放错误:', e);
            if (window.playerInstance && window.playerInstance.errorHandler) {
                window.playerInstance.errorHandler.handle(new Error('音频播放错误'), {
                    operation: 'audioPlayback',
                    songName: song.name
                });
            }
        });
    }
    
    destroy() {
        // 停止所有音频
        if (this.currentAudio) {
            this.currentAudio.element.pause();
        }
        
        // 清理缓存
        this.audioCache.forEach(audioInfo => {
            this.resourceManager.revokeObjectURL(audioInfo.url);
        });
        this.audioCache.clear();
        this.currentAudio = null;
    }

    cleanupSong(song) {
        if (!song || !song.audioFile) return;
        const cacheKey = `${song.audioFile.name}_${song.audioFile.size}`;
        if (this.audioCache.has(cacheKey)) {
            const audioInfo = this.audioCache.get(cacheKey);
            this.resourceManager.revokeObjectURL(audioInfo.url);
            this.audioCache.delete(cacheKey);
        }
    }

    determineFinalMode(song) {
        if (song.mode === 'auto') {
            const availableModes = this.getAvailableModes(song);
            if (availableModes.includes('sync')) return 'sync';
            if (availableModes.includes('audio')) return 'audio';
            return 'lyrics';
        }
        return song.mode;
    }

    getAvailableModes(song) {
        const modes = ['lyrics'];
        if (song.audioFile) {
            modes.push('audio');
            if (song.lyrics && song.lyrics.length > 0) {
                modes.push('sync');
            }
        }
        return modes;
    }
}

// UI管理器
class UIManager {
    constructor(stateManager, eventManager, performanceOptimizer) {
        this.stateManager = stateManager;
        this.eventManager = eventManager;
        this.performanceOptimizer = performanceOptimizer;
        this.elements = {};
        this.isFullscreen = false;
    }
    
    initialize(elements) {
        this.elements = elements;
        this.initializeThemes();
        this.initializeResponsiveDesign();
    }
    
    initializeThemes() {
        // 设置默认主题
        this.applyTheme('classic');
    }
    
    initializeResponsiveDesign() {
        // 监听窗口大小变化
        this.eventManager.addDOMEventListener(window, 'resize', 
            this.performanceOptimizer.throttle(() => {
                this.adjustLayoutForScreenSize();
            }, 250)
        );
    }
    
    applyTheme(theme) {
        document.body.className = `theme-${theme}`;
        this.updateThemeButtons(theme);
    }
    
    updateThemeButtons(activeTheme) {
        this.performanceOptimizer.batchDOMUpdate('theme-buttons', () => {
            document.querySelectorAll('.theme-button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === activeTheme);
            });
        });
    }
    
    updateSpeedButtons(activeSpeed) {
        this.performanceOptimizer.batchDOMUpdate('speed-buttons', () => {
            document.querySelectorAll('.speed-button').forEach(btn => {
                btn.classList.toggle('active', parseFloat(btn.dataset.speed) === activeSpeed);
            });
        });
    }
    
    updateFontSizeButtons(activeSize) {
        this.performanceOptimizer.batchDOMUpdate('font-buttons', () => {
            document.querySelectorAll('.font-size-button').forEach(btn => {
                btn.classList.toggle('active', parseFloat(btn.dataset.fontSize) === activeSize);
            });
        });
    }
    
    setBackgroundImage(url) {
        if (this.elements.backgroundContainer) {
            this.elements.backgroundContainer.style.backgroundImage = `url(${url})`;
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    }
    
    adjustLayoutForScreenSize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // 根据屏幕尺寸调整布局
        if (width < 768) {
            document.body.classList.add('mobile-layout');
        } else {
            document.body.classList.remove('mobile-layout');
        }
    }
    
    destroy() {
        // 清理UI管理器
    }
}

// 播放列表管理器
class PlaylistManager {
    constructor(stateManager, eventManager) {
        this.stateManager = stateManager;
        this.eventManager = eventManager;
    }
    
    addSong(song) {
        const songs = this.stateManager.getState('songs.list');
        songs.push(song);
        this.stateManager.setState('songs.list', songs);
        
        // 如果是第一首歌，自动选中
        if (songs.length === 1) {
            this.stateManager.setState('songs.currentIndex', 0);
        }
    }
    
    removeSong(index) {
        const songs = this.stateManager.getState('songs.list');
        const currentIndex = this.stateManager.getState('songs.currentIndex');
        
        if (index >= 0 && index < songs.length) {
            const removedSong = songs.splice(index, 1)[0];
            this.stateManager.setState('songs.list', songs);
            this.eventManager.emit('song-removed', { song: removedSong });
            
            // 调整当前索引
            if (currentIndex >= index && currentIndex > 0) {
                this.stateManager.setState('songs.currentIndex', currentIndex - 1);
            } else if (songs.length === 0) {
                this.stateManager.setState('songs.currentIndex', -1);
            }
        }
    }
    
    switchToSong(index) {
        const songs = this.stateManager.getState('songs.list');
        
        if (index >= 0 && index < songs.length) {
            this.stateManager.setState('songs.currentIndex', index);
            this.stateManager.setState('player.currentTime', 0);
            this.stateManager.setState('lyrics.currentIndex', -1);
        }
    }
    
    getCurrentSong() {
        const songs = this.stateManager.getState('songs.list');
        const currentIndex = this.stateManager.getState('songs.currentIndex');
        
        return currentIndex >= 0 && currentIndex < songs.length ? songs[currentIndex] : null;
    }
    
    nextSong() {
        const nextIndex = this.peekNextSongIndex();
        if (nextIndex >= 0) {
            this.switchToSong(nextIndex);
        }
    }

    peekNextSongIndex() {
        const songs = this.stateManager.getState('songs.list');
        const currentIndex = this.stateManager.getState('songs.currentIndex');
        const playMode = this.stateManager.getState('songs.playMode');

        if (songs.length === 0) return -1;

        switch (playMode) {
            case 'single':
                return currentIndex;
            case 'random':
                return Math.floor(Math.random() * songs.length);
            case 'list':
                return currentIndex < songs.length - 1 ? currentIndex + 1 : -1;
            case 'loop':
            default:
                return (currentIndex + 1) % songs.length;
        }
    }
    
    previousSong() {
        const songs = this.stateManager.getState('songs.list');
        const currentIndex = this.stateManager.getState('songs.currentIndex');
        const playMode = this.stateManager.getState('songs.playMode');
        
        if (songs.length === 0) return;
        
        let prevIndex;
        switch (playMode) {
            case 'single':
                prevIndex = currentIndex;
                break;
            case 'random':
                prevIndex = Math.floor(Math.random() * songs.length);
                break;
            case 'list':
            case 'loop':
            default:
                prevIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1;
                break;
        }
        
        this.switchToSong(prevIndex);
    }

    changeSongMode(index, newMode) {
        const songs = this.stateManager.getState('songs.list');
        if (index >= 0 && index < songs.length) {
            const song = songs[index];
            song.mode = newMode;
            this.stateManager.setState('songs.list', songs);
            this.eventManager.emit('playlist-updated');
        }
    }

    renderPlaylist(songs, currentIndex) {
        const container = document.getElementById('playlist');
        if (!container) return;

        if (songs.length === 0) {
            container.innerHTML = '<div class="empty-playlist">还没有歌曲，请上传歌词文件</div>';
            return;
        }

        // 增量更新
        const existingItems = new Map(Array.from(container.children).map(child => [child.dataset.index, child]));
        const newFragment = document.createDocumentFragment();

        songs.forEach((song, index) => {
            const existing = existingItems.get(String(index));
            if (existing) {
                // 更新现有项
                existing.className = `song-item ${index === currentIndex ? 'current' : ''}`;
                existingItems.delete(String(index)); // 从map中移除，剩下的就是需要删除的
            } else {
                // 添加新项
                const item = this.createPlaylistItem(song, index, currentIndex);
                newFragment.appendChild(item);
            }
        });

        // 删除不再存在的项
        existingItems.forEach(item => item.remove());

        // 添加新的项
        if (newFragment.children.length > 0) {
            container.appendChild(newFragment);
        }
    }

    createPlaylistItem(song, index, currentIndex) {
        const item = document.createElement('div');
        item.className = `song-item ${index === currentIndex ? 'current' : ''}`;
        item.dataset.index = index;

        item.innerHTML = `
            <div class="song-index-num">${index + 1}</div>
            <div class="song-name" title="${song.name}">${song.name}</div>
            <div class="song-mode">${this.createModeSelector(song, index)}</div>
            <div class="song-duration">${this.formatTime(song.duration)}</div>
            <div class="song-controls">
                <button class="song-control-btn delete-btn" data-action="delete" data-index="${index}">×</button>
            </div>
        `;
        return item;
    }

    createModeSelector(song, index) {
        const availableModes = this.getAvailableModes(song);
        const currentMode = song.mode;

        const modeOptions = {
            'auto': { icon: '🔄', label: '自动', available: true },
            'lyrics': { icon: '📝', label: '歌词', available: availableModes.includes('lyrics') },
            'audio': { icon: '🎵', label: '音频', available: availableModes.includes('audio') },
            'sync': { icon: '🎶', label: '同步', available: availableModes.includes('sync') }
        };

        const options = Object.entries(modeOptions)
            .filter(([mode, config]) => config.available)
            .map(([mode, config]) =>
                `<option value="${mode}" ${mode === currentMode ? 'selected' : ''}>${config.icon} ${config.label}</option>`
            ).join('');

        return `<select class="mode-selector" data-index="${index}">${options}</select>`;
    }

    getAvailableModes(song) {
        const modes = ['lyrics'];
        if (song.audioFile) {
            modes.push('audio');
            if (song.lyrics && song.lyrics.length > 0) {
                modes.push('sync');
            }
        }
        return modes;
    }

    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    destroy() {
        // 清理播放列表管理器
    }
}

// UI管理器

// 快捷键管理器
class ShortcutManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.shortcuts = new Map();
    }
    
    addShortcut(keys, handler) {
        const id = this.eventManager.addShortcut(keys, handler);
        this.shortcuts.set(keys, id);
        return id;
    }
    
    removeShortcut(keys) {
        const id = this.shortcuts.get(keys);
        if (id) {
            this.eventManager.removeDOMEventListener(id);
            this.shortcuts.delete(keys);
        }
    }
    
    destroy() {
        for (const [keys, id] of this.shortcuts) {
            this.eventManager.removeDOMEventListener(id);
        }
        this.shortcuts.clear();
    }
}

// 通知系统
class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.maxNotifications = 5;
    }
    
    initialize(container) {
        this.container = container;
    }
    
    show(notification) {
        if (!this.container) return;
        
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification ${notification.level || 'info'}`;
        
        if (notification.title) {
            notificationEl.innerHTML = `
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
            `;
        } else {
            notificationEl.textContent = notification.message;
        }
        
        this.container.appendChild(notificationEl);
        this.notifications.push(notificationEl);
        
        // 限制通知数量
        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications.shift();
            oldest?.remove();
        }
        
        // 自动移除
        const duration = notification.duration || 3000;
        setTimeout(() => {
            this.remove(notificationEl);
        }, duration);
    }
    
    remove(notificationEl) {
        const index = this.notifications.indexOf(notificationEl);
        if (index > -1) {
            this.notifications.splice(index, 1);
            notificationEl.remove();
        }
    }
    
    clear() {
        this.notifications.forEach(n => n.remove());
        this.notifications = [];
    }
    
    destroy() {
        this.clear();
        this.container = null;
    }
}

// 拖拽上传处理器
class DragAndDropHandler {
    constructor(eventManager, onFilesDropped) {
        this.eventManager = eventManager;
        this.onFilesDropped = onFilesDropped;
        this.dragCounter = 0;
        this.overlay = document.getElementById('dragOverlay');
        
        this.bindEvents();
    }
    
    bindEvents() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.eventManager.addDOMEventListener(document, eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        
        this.eventManager.addDOMEventListener(document, 'dragenter', (e) => {
            this.dragCounter++;
            if (e.dataTransfer.types.includes('Files')) {
                this.overlay?.classList.add('active');
            }
        });
        
        this.eventManager.addDOMEventListener(document, 'dragleave', (e) => {
            this.dragCounter--;
            if (this.dragCounter <= 0) {
                this.dragCounter = 0;
                this.overlay?.classList.remove('active');
            }
        });
        
        this.eventManager.addDOMEventListener(document, 'drop', (e) => {
            this.dragCounter = 0;
            this.overlay?.classList.remove('active');
            
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                this.onFilesDropped(files);
            }
        });
    }
}

// 歌词搜索管理器
class LyricsSearchManager {
    constructor(stateManager, eventManager, playlistManager) {
        this.stateManager = stateManager;
        this.eventManager = eventManager;
        this.playlistManager = playlistManager;
        this.searchResults = [];
        this.searchInput = null;
        this.searchResultsContainer = null;
        this.currentQuery = '';
    }
    
    initialize() {
        // 缓存DOM元素
        this.searchInput = document.getElementById('lyricsSearch');
        this.searchResultsContainer = document.getElementById('searchResults');
        
        if (!this.searchInput || !this.searchResultsContainer) {
            console.warn('搜索组件DOM元素未找到');
            return;
        }
        
        // 绑定事件
        this.bindEvents();
    }
    
    bindEvents() {
        // 输入事件 - 实时搜索
        this.searchInput.addEventListener('input', (e) => {
            this.searchLyrics(e.target.value);
        });
        
        // 键盘事件
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchLyrics(this.searchInput.value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.clearSearch();
            }
        });
        
        // 监听歌曲切换事件，自动清理搜索结果
        this.eventManager.on('song-changed', () => {
            if (this.currentQuery) {
                this.searchLyrics(this.currentQuery);
            }
        });
    }
    
    searchLyrics(query) {
        this.currentQuery = query;
        
        if (!query.trim()) {
            this.clearSearch();
            return;
        }
        
        // 获取当前歌曲
        const currentSong = this.playlistManager.getCurrentSong();
        if (!currentSong) {
            this.showSearchMessage('请先选择一首歌曲');
            return;
        }
        
        // 检查是否有歌词
        if (!currentSong.lyrics || currentSong.lyrics.length === 0) {
            this.showSearchMessage('当前歌曲没有歌词');
            return;
        }
        
        // 执行搜索
        this.searchResults = [];
        const queryLower = query.toLowerCase();
        
        currentSong.lyrics.forEach((lyric, lyricIndex) => {
            if (lyric.text.toLowerCase().includes(queryLower)) {
                this.searchResults.push({
                    lyricIndex,
                    songName: currentSong.name,
                    time: lyric.time,
                    text: lyric.text
                });
            }
        });
        
        // 显示搜索结果
        this.displaySearchResults(query);
    }
    
    displaySearchResults(query) {
        if (this.searchResults.length === 0) {
            this.showSearchMessage(`未找到包含"${query}"的歌词`);
            return;
        }
        
        // 生成搜索结果HTML
        const resultsHtml = this.searchResults.map(result => {
            // 高亮搜索关键词
            const highlightedText = result.text.replace(
                new RegExp(query, 'gi'),
                match => `<span class="search-highlight">${match}</span>`
            );
            
            return `
                <div class="search-result-item" 
                     data-lyric-index="${result.lyricIndex}"
                     data-time="${result.time}">
                    <span class="search-result-time">${this.formatTime(result.time)}</span>
                    <span class="search-result-text">${highlightedText}</span>
                </div>
            `;
        }).join('');
        
        this.searchResultsContainer.innerHTML = resultsHtml;
        this.searchResultsContainer.style.display = 'block';
        
        // 添加点击事件
        this.searchResultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const time = parseFloat(item.dataset.time);
                this.jumpToLyric(time);
            });
        });
        
        console.log(`在当前歌曲中搜索到 ${this.searchResults.length} 条结果`);
    }
    
    showSearchMessage(message) {
        this.searchResultsContainer.innerHTML = `
            <div class="search-message">${message}</div>
        `;
        this.searchResultsContainer.style.display = 'block';
    }
    
    jumpToLyric(time) {
        if (window.playerInstance) {
            // 通过音频管理器设置时间
            window.playerInstance.audioManager.setCurrentTime(time);
            window.playerInstance.stateManager.setState('player.currentTime', time);
            
            // 如果当前没有播放，则开始播放
            const isPlaying = window.playerInstance.stateManager.getState('player.isPlaying');
            if (!isPlaying) {
                // 延迟播放，确保时间设置生效
                setTimeout(() => {
                    window.playerInstance.play();
                }, 100);
            }
            
            // 显示通知
            window.playerInstance.showNotification({
                message: `跳转到: ${this.formatTime(time)}`,
                level: 'success'
            });
        }
        
        // 清除搜索结果
        this.clearSearch();
    }
    
    clearSearch() {
        this.searchInput.value = '';
        this.currentQuery = '';
        this.searchResults = [];
        this.searchResultsContainer.style.display = 'none';
        this.searchResultsContainer.innerHTML = '';
    }
    
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    focusSearch() {
        if (this.searchInput) {
            this.searchInput.focus();
        }
    }
    
    destroy() {
        this.clearSearch();
        this.searchInput = null;
        this.searchResultsContainer = null;
    }
}

// 全局暴露所有组件
window.LyricsParser = LyricsParser;
window.LyricsRenderer = LyricsRenderer;
window.AudioManager = AudioManager;
window.UIManager = UIManager;
window.PlaylistManager = PlaylistManager;
window.ShortcutManager = ShortcutManager;
window.NotificationSystem = NotificationSystem;
window.DragAndDropHandler = DragAndDropHandler;
window.LyricsSearchManager = LyricsSearchManager;