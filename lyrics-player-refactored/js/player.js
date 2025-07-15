/**
 * 主播放器类 - 重构后的LED歌词播放器
 * 修复所有已识别的问题，提供更好的架构和性能
 */

class LEDLyricsPlayer {
    constructor(options = {}) {
        // 初始化依赖
        this.initializeDependencies(options);
        
        // DOM元素引用
        this.elements = {};
        
        // 播放器状态
        this.isInitialized = false;
        this.isDestroyed = false;
        
        // 歌词相关
        this.lyricsParser = new window.LyricsParser();
        this.lyricsRenderer = new window.LyricsRenderer(this.performanceOptimizer);
        
        // 音频相关
        this.audioManager = new window.AudioManager(this.resourceManager, this.errorHandler, this.eventManager);
        
        // UI管理器
        this.uiManager = new window.UIManager(this.stateManager, this.eventManager, this.performanceOptimizer);
        
        // 播放列表管理
        this.playlistManager = new window.PlaylistManager(this.stateManager, this.eventManager);
        
        // 快捷键管理
        this.shortcutManager = new window.ShortcutManager(this.eventManager);
        
        // 通知系统
        this.notificationSystem = new window.NotificationSystem();
        
        // 智能匹配器
        this.smartMatcher = new window.SmartMatcher();
        
        // 歌词搜索管理器
        this.lyricsSearchManager = new window.LyricsSearchManager(this.stateManager, this.eventManager, this.playlistManager);
        
        // 绑定状态变化
        this.bindStateChanges();
        
        // 设置全局实例引用
        window.playerInstance = this;
        
        // 初始化组件
        this.initialize();
    }
    
    // 初始化依赖
    initializeDependencies(options) {
        this.errorHandler = new window.ErrorHandler();
        this.errorHandler.setProduction(options.production || false);
        
        this.resourceManager = new window.ResourceManager();
        this.stateManager = new window.StateManager();
        this.eventManager = new window.EventManager(this.resourceManager, this.errorHandler);
        this.fileHandler = new window.FileHandler(this.errorHandler);
        this.performanceOptimizer = new window.PerformanceOptimizer();
        
        // 设置错误处理回调
        this.errorHandler.setNotificationCallback((notification) => {
            this.showNotification(notification);
        });
    }
    
    // 初始化播放器
    async initialize() {
        try {
            // 缓存DOM元素
            this.cacheElements();
            
            // 初始化UI
            this.initializeUI();
            
            // 绑定事件
            this.bindEvents();
            
            // 初始化状态
            this.initializeState();
            
            // 标记为已初始化
            this.isInitialized = true;
            
            // 发出初始化完成事件
            this.eventManager.emit(this.eventManager.eventTypes.PLAYER_READY);
            
            console.log('LED歌词播放器初始化完成');
            
        } catch (error) {
            this.errorHandler.handle(error, { operation: 'initialize' });
        }
    }
    
    // 缓存DOM元素
    cacheElements() {
        const elementIds = [
            'playButton', 'progressBar', 'progressContainer',
            'currentTime', 'totalTime', 'currentLyric', 'nextLyric',
            'statusIndicator', 'backgroundContainer', 'playlist',
            'playlistCount', 'songInfo', 'displaySongTitle',
            'displaySongIndex', 'currentSongInfo', 'currentSongName',
            'currentSongStatus', 'notificationContainer'
        ];
        
        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.elements[id] = element;
            } else {
                console.warn(`Element with id '${id}' not found`);
            }
        });
    }
    
    // 初始化UI
    initializeUI() {
        this.uiManager.initialize(this.elements);
        this.notificationSystem.initialize(this.elements.notificationContainer);
        this.lyricsSearchManager.initialize();
        
        // 初始化播放模式按钮状态
        this.updatePlayModeButtons();
    }
    
    // 绑定事件
    bindEvents() {
        // 文件上传事件
        this.bindFileEvents();
        
        // 播放控制事件
        this.bindPlaybackEvents();
        
        // UI控制事件
        this.bindUIEvents();
        
        // 播放列表事件
        this.bindPlaylistEvents();
        
        // 快捷键
        this.bindShortcuts();
        
        // 拖拽上传
        this.bindDragAndDrop();
    }
    
    // 绑定文件事件
    bindFileEvents() {
        // 歌词文件上传
        this.eventManager.addDOMEventListener(
            document.getElementById('lrcFile'),
            'change',
            this.errorHandler.wrapAsync(async (e) => {
                const files = Array.from(e.target.files);
                await this.handleLyricsFiles(files);
            })
        );
        
        // 音频文件上传
        this.eventManager.addDOMEventListener(
            document.getElementById('audioFile'),
            'change',
            this.errorHandler.wrapAsync(async (e) => {
                const files = Array.from(e.target.files);
                await this.handleAudioFiles(files);
            })
        );
        
        // 背景图片上传
        this.eventManager.addDOMEventListener(
            document.getElementById('backgroundFile'),
            'change',
            this.errorHandler.wrapAsync(async (e) => {
                if (e.target.files[0]) {
                    await this.handleBackgroundImage(e.target.files[0]);
                }
            })
        );
    }
    
    // 绑定播放控制事件
    bindPlaybackEvents() {
        // 播放/暂停按钮
        this.eventManager.addDOMEventListener(
            this.elements.playButton,
            'click',
            () => this.togglePlayback()
        );
        
        // 进度条点击
        this.eventManager.addDOMEventListener(
            this.elements.progressContainer,
            'click',
            (e) => this.seekToPosition(e)
        );
    }
    
    // 绑定UI事件
    bindUIEvents() {
        // 速度控制
        this.eventManager.delegate(
            document.body,
            '.speed-button',
            'click',
            (e) => {
                const speed = parseFloat(e.delegateTarget.dataset.speed);
                this.setPlaybackSpeed(speed);
            }
        );
        
        // 字体大小控制
        this.eventManager.delegate(
            document.body,
            '.font-size-button',
            'click',
            (e) => {
                const size = parseFloat(e.delegateTarget.dataset.fontSize);
                this.setFontSize(size);
            }
        );
        
        // 主题控制
        this.eventManager.delegate(
            document.body,
            '.theme-button',
            'click',
            (e) => {
                const theme = e.delegateTarget.dataset.theme;
                this.setTheme(theme);
            }
        );
        
        // 搜索按钮
        this.eventManager.addDOMEventListener(
            document.getElementById('searchButton'),
            'click',
            () => {
                const searchInput = document.getElementById('lyricsSearch');
                if (searchInput) {
                    this.lyricsSearchManager.searchLyrics(searchInput.value);
                }
            }
        );
        
        // 清除搜索按钮
        this.eventManager.addDOMEventListener(
            document.getElementById('clearSearch'),
            'click',
            () => {
                this.lyricsSearchManager.clearSearch();
            }
        );
        
        // 同步校准按钮
        this.eventManager.delegate(
            document.body,
            '.sync-button',
            'click',
            (e) => {
                const button = e.delegateTarget;
                if (button.id === 'resetOffset') {
                    this.resetSyncOffset();
                } else if (button.dataset.offset) {
                    const offset = parseFloat(button.dataset.offset);
                    this.adjustSyncOffset(offset);
                }
            }
        );
        
        // 播放模式按钮
        this.eventManager.delegate(
            document.body,
            '.play-mode-button',
            'click',
            (e) => {
                const mode = e.delegateTarget.dataset.mode;
                this.setPlayMode(mode);
            }
        );
    }
    
    // 预加载下一首歌曲
    preloadNextSong() {
        const songs = this.stateManager.getState('songs.list');
        const nextIndex = this.playlistManager.peekNextSongIndex();

        if (nextIndex >= 0 && nextIndex < songs.length) {
            const nextSong = songs[nextIndex];
            if (nextSong) {
                this.audioManager.preload(nextSong);
            }
        }
    }

    // 绑定播放列表事件
    bindPlaylistEvents() {
        const playlistElement = document.getElementById('playlist');
        if (!playlistElement) return;
        
        this.eventManager.delegate(
            playlistElement,
            '.song-item',
            'click',
            (e) => {
                const target = e.target;
                const songItem = e.delegateTarget;
                const index = parseInt(songItem.dataset.index);

                if (target.matches('.delete-btn')) {
                    this.playlistManager.removeSong(index);
                } else if (!target.matches('.mode-selector')) {
                    this.playlistManager.switchToSong(index);
                }
            }
        );

        this.eventManager.delegate(
            playlistElement,
            '.song-item',
            'dblclick',
            (e) => {
                const target = e.target;
                if (target.matches('.mode-selector')) return;

                const songItem = e.delegateTarget;
                const index = parseInt(songItem.dataset.index);
                this.playlistManager.switchToSong(index);
                setTimeout(() => this.play(), 100);
            }
        );

        this.eventManager.delegate(
            playlistElement,
            '.mode-selector',
            'change',
            (e) => {
                const selector = e.target;
                const index = parseInt(selector.dataset.index);
                const newMode = selector.value;
                this.playlistManager.changeSongMode(index, newMode);
            }
        );
    }
    
    // 绑定快捷键
    bindShortcuts() {
        const shortcuts = {
            // 基本播放控制
            'space': () => this.togglePlayback(),
            'ctrl+arrowleft': () => this.previousLyric(),
            'ctrl+arrowright': () => this.nextLyric(),
            'arrowup': () => this.playlistManager.previousSong(),
            'arrowdown': () => this.playlistManager.nextSong(),
            'arrowleft': () => this.seek(-5),
            'arrowright': () => this.seek(5),
            'shift+arrowleft': () => this.seek(-10),
            'shift+arrowright': () => this.seek(10),
            
            // 歌曲选择快捷键（数字键1-9）
            '1': () => this.selectSong(0),
            '2': () => this.selectSong(1),
            '3': () => this.selectSong(2),
            '4': () => this.selectSong(3),
            '5': () => this.selectSong(4),
            '6': () => this.selectSong(5),
            '7': () => this.selectSong(6),
            '8': () => this.selectSong(7),
            '9': () => this.selectSong(8),
            
            // UI控制
            'escape': () => this.toggleFullscreen(),
            't': () => this.switchTheme(),
            'f': () => this.focusSearch(),
            '+': () => this.adjustFontSize(0.1),
            '-': () => this.adjustFontSize(-0.1),
            '=': () => this.adjustFontSize(0.1), // +号的另一种输入
            
            // 播放模式和速度
            'm': () => this.cyclePlayMode(),
            'r': () => this.setRandomMode(),
            'l': () => this.setLoopMode(),
            's': () => this.setSingleMode(),
            
            // 播放速度控制
            'ctrl+1': () => this.setPlaybackSpeed(0.5),
            'ctrl+2': () => this.setPlaybackSpeed(0.75),
            'ctrl+3': () => this.setPlaybackSpeed(1.0),
            'ctrl+4': () => this.setPlaybackSpeed(1.25),
            'ctrl+5': () => this.setPlaybackSpeed(1.5),
            'ctrl+6': () => this.setPlaybackSpeed(2.0),
            
            // 同步校准（如果支持）
            '[': () => this.adjustSyncOffset(-0.1),
            ']': () => this.adjustSyncOffset(0.1),
            'shift+[': () => this.adjustSyncOffset(-1.0),
            'shift+]': () => this.adjustSyncOffset(1.0),
            
            // 播放列表操作
            'ctrl+a': () => this.selectAllSongs(),
            'delete': () => this.deleteCurrentSong(),
            'ctrl+shift+delete': () => this.clearPlaylist(),
            
            // 文件操作
            'ctrl+o': () => this.openFileDialog(),
            'ctrl+shift+o': () => this.openFolderDialog(),
            'ctrl+s': () => this.savePlaylist(),
            'ctrl+shift+s': () => this.savePlaylistAs(),
            
            // 音量控制（如果支持）
            'ctrl+arrowup': () => this.adjustVolume(0.1),
            'ctrl+arrowdown': () => this.adjustVolume(-0.1),
            'ctrl+0': () => this.toggleMute(),
            
            // 帮助
            'h': () => this.showShortcutsHelp(),
            'ctrl+h': () => this.showShortcutsHelp()
        };
        
        Object.entries(shortcuts).forEach(([keys, handler]) => {
            this.shortcutManager.addShortcut(keys, handler);
        });
    }
    
    // 绑定拖拽上传
    bindDragAndDrop() {
        const dragAndDrop = new window.DragAndDropHandler(
            this.eventManager,
            this.errorHandler.wrapAsync(async (files) => {
                await this.handleDroppedFiles(files);
            })
        );
    }
    
    // 绑定状态变化
    bindStateChanges() {
        // 播放状态变化
        this.stateManager.subscribe('player.isPlaying', (isPlaying) => {
            this.updatePlayButton(isPlaying);
            this.updateStatusIndicator();
        });
        
        // 当前时间变化
        this.stateManager.subscribe('player.currentTime', (currentTime) => {
            this.updateProgressBar();
            this.updateTimeDisplay();
            this.updateLyrics();
            this.updateSyncControls();
        });
        
        // 歌曲变化
        this.stateManager.subscribe('songs.currentIndex', (index) => {
            this.updateSongDisplay();
            this.updatePlaylist();
            this.preloadNextSong();
        });
        
        // 歌曲列表变化
        this.stateManager.subscribe('songs.list', (songs) => {
            this.updatePlaylist();
        });
        
        // 主题变化
        this.stateManager.subscribe('ui.theme', (theme) => {
            this.uiManager.applyTheme(theme);
        });
        
        // 播放模式变化
        this.stateManager.subscribe('songs.playMode', (mode) => {
            this.updatePlayModeButtons();
        });
        
        // 歌曲结束事件
        this.eventManager.on('song-ended', () => {
            this.onSongEnded();
        });
    }
    
    // 初始化状态
    initializeState() {
        this.stateManager.setState('ui.theme', 'classic');
        this.stateManager.setState('ui.fontScale', 1.3);
        this.stateManager.setState('songs.playMode', 'loop');
        this.stateManager.setState('player.playbackSpeed', 1.0);
        this.stateManager.setState('lyrics.syncOffset', 0);
    }
    
    // 处理歌词文件
    async handleLyricsFiles(files) {
        try {
            this.showNotification({
                message: `开始处理 ${files.length} 个歌词文件...`,
                level: 'info'
            });
            
            const validationResults = await this.fileHandler.validateFiles(files, 'lyrics');
            const validFiles = validationResults.filter(r => r.valid).map(r => r.file);
            
            if (validFiles.length === 0) {
                throw new Error('没有有效的歌词文件');
            }
            
            const songs = await this.lyricsParser.parseMultipleFiles(validFiles);
            
            songs.forEach(song => {
                this.playlistManager.addSong(song);
            });
            
            this.showNotification({
                message: `成功加载 ${songs.length} 首歌曲`,
                level: 'success'
            });
            
        } catch (error) {
            this.errorHandler.handle(error, { operation: 'handleLyricsFiles' });
        }
    }
    
    // 处理音频文件
    async handleAudioFiles(files) {
        try {
            this.showNotification({
                message: `开始处理 ${files.length} 个音频文件...`,
                level: 'info'
            });
            
            const validationResults = await this.fileHandler.validateFiles(files, 'audio');
            const validFiles = validationResults.filter(r => r.valid).map(r => r.file);
            
            if (validFiles.length === 0) {
                throw new Error('没有有效的音频文件');
            }
            
            // 使用智能匹配器处理音频文件
            const currentSongs = this.stateManager.getState('songs.list');
            const matchResults = this.smartMatcher.batchMatch(validFiles, currentSongs);
            
            let matchedCount = 0;
            let newSongsCount = 0;
            
            for (const result of matchResults) {
                if (result.matchedSong) {
                    // 找到匹配的歌词，合并为同步模式
                    result.matchedSong.audioFile = result.audioFile;
                    result.matchedSong.availableModes = ['lyrics', 'audio', 'sync'];
                    result.matchedSong.mode = 'auto';
                    
                    // 更新音频时长
                    await this.updateAudioDuration(result.matchedSong);
                    matchedCount++;
                    
                    this.showNotification({
                        message: `🎶 ${result.audioFile.name} 与 ${result.matchedSong.name} 自动匹配成功`,
                        level: 'success',
                        duration: 2000
                    });
                } else {
                    // 没有匹配的歌词，创建纯音频歌曲
                    const audioSong = {
                        name: result.audioFile.name.replace(/\.[^/.]+$/, ""),
                        lyrics: [],
                        duration: 0,
                        mode: 'auto',
                        availableModes: ['audio'],
                        file: null,
                        audioFile: result.audioFile,
                        originalMode: 'auto'
                    };
                    
                    await this.updateAudioDuration(audioSong);
                    this.playlistManager.addSong(audioSong);
                    newSongsCount++;
                }
            }
            
            // 更新播放列表显示
            this.updatePlaylist();
            
            // 显示总结和匹配统计
            let summaryMessage = `处理完成: `;
            if (matchedCount > 0) {
                summaryMessage += `${matchedCount}个音频与歌词匹配, `;
            }
            if (newSongsCount > 0) {
                summaryMessage += `${newSongsCount}个新音频歌曲`;
            }
            
            this.showNotification({
                message: summaryMessage,
                level: 'success'
            });
            
            // 显示详细匹配统计
            const stats = this.smartMatcher.getMatchingStats(matchResults);
            if (stats.total > 0) {
                console.log('📊 智能匹配统计:', {
                    总文件数: stats.total,
                    精确匹配: stats.exact,
                    模糊匹配: stats.fuzzy,
                    未匹配: stats.unmatched,
                    平均得分: stats.averageScore.toFixed(2)
                });
                
                // 如果匹配效果较好，显示成功提示
                if (stats.averageScore >= 0.8) {
                    this.showNotification({
                        message: `🎯 智能匹配效果良好 (平均得分: ${stats.averageScore.toFixed(2)})`,
                        level: 'success',
                        duration: 3000
                    });
                }
            }
            
        } catch (error) {
            this.errorHandler.handle(error, { operation: 'handleAudioFiles' });
        }
    }
    
    // 更新音频时长
    async updateAudioDuration(song) {
        if (!song.audioFile) return;
        
        return new Promise((resolve, reject) => {
            const audio = this.resourceManager.createAudioElement();
            const url = this.resourceManager.createObjectURL(song.audioFile);
            
            audio.onloadedmetadata = () => {
                song.duration = audio.duration;
                this.resourceManager.revokeObjectURL(url);
                resolve();
            };
            
            audio.onerror = () => {
                this.resourceManager.revokeObjectURL(url);
                reject(new Error('无法加载音频元数据'));
            };
            
            audio.src = url;
        });
    }
    
    // 处理背景图片
    async handleBackgroundImage(file) {
        try {
            const validation = await this.fileHandler.validateFile(file, 'image');
            if (!validation.valid) {
                throw new Error(validation.error);
            }
            
            const url = this.resourceManager.createObjectURL(file);
            this.uiManager.setBackgroundImage(url);
            
            this.showNotification({
                message: '背景图片更新成功',
                level: 'success'
            });
            
        } catch (error) {
            this.errorHandler.handle(error, { operation: 'handleBackgroundImage' });
        }
    }
    
    // 处理拖拽文件
    async handleDroppedFiles(files) {
        const grouped = this.fileHandler.groupFilesByType(files);
        
        if (grouped.lyrics.length > 0) {
            await this.handleLyricsFiles(grouped.lyrics);
        }
        
        if (grouped.audio.length > 0) {
            await this.handleAudioFiles(grouped.audio);
        }
        
        if (grouped.image.length > 0) {
            await this.handleBackgroundImage(grouped.image[0]);
        }
        
        if (grouped.unknown.length > 0) {
            this.showNotification({
                message: `忽略了 ${grouped.unknown.length} 个不支持的文件`,
                level: 'warning'
            });
        }
    }
    
    // 播放控制方法
    async play() {
        try {
            const currentSong = this.playlistManager.getCurrentSong();
            if (!currentSong) {
                throw new Error('没有可播放的歌曲');
            }

            // 停止当前音频并清理资源
            if (this.audioManager.currentAudio) {
                this.audioManager.pause();
                this.audioManager.setCurrentTime(0);
                this.resourceManager.revokeObjectURL(this.audioManager.currentAudio.url);
                this.audioManager.releaseAudio(this.audioManager.currentAudio.element);
                this.audioManager.currentAudio = null;
            }

            await this.audioManager.play(currentSong);
            this.stateManager.setState('player.isPlaying', true);

            this.eventManager.emit(this.eventManager.eventTypes.PLAY, currentSong);

        } catch (error) {
            this.errorHandler.handle(error, { operation: 'play' });
        }
    }
    
    pause() {
        try {
            this.audioManager.pause();
            this.stateManager.setState('player.isPlaying', false);
            
            this.eventManager.emit(this.eventManager.eventTypes.PAUSE);
            
        } catch (error) {
            this.errorHandler.handle(error, { operation: 'pause' });
        }
    }
    
    togglePlayback() {
        const isPlaying = this.stateManager.getState('player.isPlaying');
        if (isPlaying) {
            this.pause();
        } else {
            this.play();
        }
        this.updatePlayButton(!isPlaying);
    }
    
    seek(seconds) {
        try {
            const currentTime = this.stateManager.getState('player.currentTime');
            const newTime = Math.max(0, currentTime + seconds);
            
            this.audioManager.setCurrentTime(newTime);
            this.stateManager.setState('player.currentTime', newTime);
            
        } catch (error) {
            this.errorHandler.handle(error, { operation: 'seek' });
        }
    }
    
    seekToPosition(event) {
        try {
            const rect = this.elements.progressContainer.getBoundingClientRect();
            const percent = (event.clientX - rect.left) / rect.width;
            const duration = this.stateManager.getState('player.duration');
            
            const newTime = percent * duration;
            this.audioManager.setCurrentTime(newTime);
            this.stateManager.setState('player.currentTime', newTime);
            
        } catch (error) {
            this.errorHandler.handle(error, { operation: 'seekToPosition' });
        }
    }
    
    setPlaybackSpeed(speed) {
        try {
            this.errorHandler.validateInput(speed, {
                type: 'number',
                min: 0.25,
                max: 4.0
            }, '播放速度');
            
            this.audioManager.setPlaybackRate(speed);
            this.stateManager.setState('player.playbackSpeed', speed);
            
            this.uiManager.updateSpeedButtons(speed);
            
        } catch (error) {
            this.errorHandler.handle(error, { operation: 'setPlaybackSpeed' });
        }
    }
    
    // UI控制方法
    setTheme(theme) {
        try {
            const validThemes = ['classic', 'gold', 'blue', 'rainbow'];
            if (!validThemes.includes(theme)) {
                throw new Error(`不支持的主题: ${theme}`);
            }
            
            this.stateManager.setState('ui.theme', theme);
            this.uiManager.updateThemeButtons(theme);
            
        } catch (error) {
            this.errorHandler.handle(error, { operation: 'setTheme' });
        }
    }
    
    setFontSize(scale) {
        try {
            this.errorHandler.validateInput(scale, {
                type: 'number',
                min: 0.5,
                max: 5.0
            }, '字体缩放');
            
            this.stateManager.setState('ui.fontScale', scale);
            this.uiManager.updateFontSizeButtons(scale);
            this.lyricsRenderer.setFontScale(scale);
            
        } catch (error) {
            this.errorHandler.handle(error, { operation: 'setFontSize' });
        }
    }
    
    adjustFontSize(delta) {
        const currentScale = this.stateManager.getState('ui.fontScale');
        const newScale = Math.max(0.5, Math.min(5.0, currentScale + delta));
        this.setFontSize(newScale);
    }
    
    switchTheme() {
        const themes = ['classic', 'gold', 'blue', 'rainbow'];
        const currentTheme = this.stateManager.getState('ui.theme');
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.setTheme(themes[nextIndex]);
    }
    
    toggleFullscreen() {
        this.uiManager.toggleFullscreen();
    }
    
    // 同步校准方法
    adjustSyncOffset(offsetDelta) {
        try {
            const currentOffset = this.stateManager.getState('lyrics.syncOffset');
            const newOffset = currentOffset + offsetDelta;
            
            // 限制偏移范围在-10到+10秒之间
            const clampedOffset = Math.max(-10, Math.min(10, newOffset));
            
            this.stateManager.setState('lyrics.syncOffset', clampedOffset);
            
            this.showNotification({
                message: `同步偏移: ${clampedOffset >= 0 ? '+' : ''}${clampedOffset.toFixed(1)}s`,
                level: 'info',
                duration: 1500
            });
            
        } catch (error) {
            this.errorHandler.handle(error, { operation: 'adjustSyncOffset' });
        }
    }
    
    resetSyncOffset() {
        try {
            this.stateManager.setState('lyrics.syncOffset', 0);
            
            this.showNotification({
                message: '同步偏移已重置',
                level: 'info',
                duration: 1500
            });
            
        } catch (error) {
            this.errorHandler.handle(error, { operation: 'resetSyncOffset' });
        }
    }
    
    // 歌曲结束处理
    onSongEnded() {
        try {
            this.stateManager.setState('player.isPlaying', false);
            
            // 根据播放模式决定下一步操作
            const playMode = this.stateManager.getState('songs.playMode');
            const nextIndex = this.playlistManager.peekNextSongIndex();
            
            if (playMode === 'single') {
                // 单曲循环 - 重新播放当前歌曲
                this.stateManager.setState('player.currentTime', 0);
                setTimeout(() => this.play(), 100);
            } else if (nextIndex >= 0) {
                // 播放下一首歌曲
                this.playlistManager.nextSong();
                setTimeout(() => this.play(), 100);
            } else {
                // 没有下一首歌曲，停止播放
                this.showNotification({
                    message: '播放列表已全部播放完毕',
                    level: 'info'
                });
            }
            
        } catch (error) {
            this.errorHandler.handle(error, { operation: 'onSongEnded' });
        }
    }
    
    focusSearch() {
        this.lyricsSearchManager.focusSearch();
    }
    
    showShortcutsHelp() {
        const helpText = `
🎵 LED歌词播放器 - 快捷键帮助

📍 基本播放控制:
• 空格键 - 播放/暂停
• ↑/↓ - 上一首/下一首歌曲
• ←/→ - 快退/快进5秒
• Shift+←/→ - 快退/快进10秒
• Ctrl+←/→ - 上一句/下一句歌词

🎯 歌曲选择:
• 数字键1-9 - 快速选择歌曲

🎨 界面控制:
• T - 切换主题
• F - 聚焦搜索框
• +/- - 调整字体大小
• Esc - 全屏切换
• H - 显示此帮助

🔄 播放模式:
• M - 循环播放模式
• R - 随机播放
• L - 列表循环
• S - 单曲循环

⚡ 播放速度:
• Ctrl+1-6 - 设置播放速度(0.5x-2.0x)

🎧 同步校准:
• [ / ] - 微调同步偏移(±0.1秒)
• Shift+[ / ] - 粗调同步偏移(±1秒)

📂 文件操作:
• Ctrl+O - 打开文件
• Ctrl+S - 保存播放列表
• Ctrl+A - 全选歌曲
• Delete - 删除当前歌曲
• Ctrl+Shift+Delete - 清空播放列表

🔊 音量控制:
• Ctrl+↑/↓ - 调节音量
• Ctrl+0 - 静音切换
        `;
        
        this.showNotification({
            message: helpText,
            level: 'info',
            duration: 10000
        });
    }
    
    // 快速选择歌曲
    selectSong(index) {
        const songs = this.stateManager.getState('songs.list');
        if (index >= 0 && index < songs.length) {
            this.playlistManager.switchToSong(index);
        }
    }
    
    // 循环播放模式
    cyclePlayMode() {
        const modes = ['list', 'loop', 'single', 'random'];
        const currentMode = this.stateManager.getState('songs.playMode');
        const currentIndex = modes.indexOf(currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        
        this.setPlayMode(modes[nextIndex]);
    }
    
    // 设置播放模式
    setPlayMode(mode) {
        this.stateManager.setState('songs.playMode', mode);
        
        // 更新UI显示
        this.showNotification({
            message: `播放模式: ${this.getPlayModeText(mode)}`,
            level: 'info',
            duration: 1500
        });
    }
    
    setRandomMode() { this.setPlayMode('random'); }
    setLoopMode() { this.setPlayMode('loop'); }
    setSingleMode() { this.setPlayMode('single'); }
    
    // 获取播放模式文本
    getPlayModeText(mode) {
        const modeTexts = {
            'list': '📋 列表播放',
            'loop': '🔁 列表循环', 
            'single': '🔂 单曲循环',
            'random': '🔀 随机播放'
        };
        return modeTexts[mode] || mode;
    }
    
    
    // 删除当前歌曲
    deleteCurrentSong() {
        const currentIndex = this.stateManager.getState('songs.currentIndex');
        if (currentIndex >= 0) {
            this.playlistManager.removeSong(currentIndex);
        }
    }
    
    // 清空播放列表
    clearPlaylist() {
        const songs = this.stateManager.getState('songs.list');
        if (songs.length > 0) {
            if (confirm('确定要清空播放列表吗？')) {
                this.stateManager.setState('songs.list', []);
                this.stateManager.setState('songs.currentIndex', -1);
                this.updatePlaylist();
                
                this.showNotification({
                    message: '播放列表已清空',
                    level: 'info'
                });
            }
        }
    }
    
    // 打开文件对话框
    openFileDialog() {
        const fileInput = document.getElementById('lrcFile');
        if (fileInput) {
            fileInput.click();
        }
    }
    
    // 打开文件夹对话框
    openFolderDialog() {
        // 实现文件夹选择（如果浏览器支持）
        this.showNotification({
            message: '请使用文件上传按钮选择多个文件',
            level: 'info'
        });
    }
    
    // 保存播放列表
    savePlaylist() {
        // 实现播放列表保存功能
        this.showNotification({
            message: '播放列表保存功能开发中',
            level: 'info'
        });
    }
    
    // 另存播放列表
    savePlaylistAs() {
        this.savePlaylist();
    }
    
    // 音量控制
    adjustVolume(delta) {
        const currentVolume = this.stateManager.getState('player.volume') || 1.0;
        const newVolume = Math.max(0, Math.min(1, currentVolume + delta));
        
        this.stateManager.setState('player.volume', newVolume);
        
        if (this.audioManager.currentAudio) {
            this.audioManager.currentAudio.element.volume = newVolume;
        }
        
        this.showNotification({
            message: `音量: ${Math.round(newVolume * 100)}%`,
            level: 'info',
            duration: 1000
        });
    }
    
    // 静音切换
    toggleMute() {
        const isMuted = this.stateManager.getState('player.muted') || false;
        const newMuted = !isMuted;
        
        this.stateManager.setState('player.muted', newMuted);
        
        if (this.audioManager.currentAudio) {
            this.audioManager.currentAudio.element.muted = newMuted;
        }
        
        this.showNotification({
            message: newMuted ? '🔇 静音' : '🔊 取消静音',
            level: 'info',
            duration: 1000
        });
    }
    
    // 全选歌曲
    selectAllSongs() {
        this.showNotification({
            message: '全选功能开发中',
            level: 'info'
        });
    }
    
    // 歌词控制
    previousLyric() {
        const currentIndex = this.stateManager.getState('lyrics.currentIndex');
        if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            this.jumpToLyric(newIndex);
        }
    }
    
    nextLyric() {
        const currentSong = this.playlistManager.getCurrentSong();
        const currentIndex = this.stateManager.getState('lyrics.currentIndex');
        
        if (currentSong && currentSong.lyrics && currentIndex < currentSong.lyrics.length - 1) {
            const newIndex = currentIndex + 1;
            this.jumpToLyric(newIndex);
        }
    }
    
    jumpToLyric(index) {
        try {
            const currentSong = this.playlistManager.getCurrentSong();
            if (!currentSong || !currentSong.lyrics || index < 0 || index >= currentSong.lyrics.length) {
                return;
            }
            
            const lyric = currentSong.lyrics[index];
            this.audioManager.setCurrentTime(lyric.time);
            this.stateManager.setState('player.currentTime', lyric.time);
            this.stateManager.setState('lyrics.currentIndex', index);
            
        } catch (error) {
            this.errorHandler.handle(error, { operation: 'jumpToLyric' });
        }
    }
    
    // 更新UI方法
    updatePlayButton(isPlaying) {
        if (this.elements.playButton) {
            this.elements.playButton.textContent = isPlaying ? '⏸' : '▶';
            this.elements.playButton.title = isPlaying ? '暂停' : '播放';
        }
    }
    
    updateSyncControls() {
        const currentSong = this.playlistManager.getCurrentSong();
        const syncControls = document.getElementById('syncControls');
        const offsetDisplay = document.getElementById('offsetDisplay');
        
        if (!syncControls || !currentSong) return;
        
        // 检查是否为同步模式
        const finalMode = this.audioManager.determineFinalMode(currentSong);
        const showSyncControls = finalMode === 'sync';
        
        syncControls.style.display = showSyncControls ? 'block' : 'none';
        
        if (showSyncControls && offsetDisplay) {
            const offset = this.stateManager.getState('lyrics.syncOffset');
            const sign = offset >= 0 ? '+' : '';
            offsetDisplay.textContent = `${sign}${offset.toFixed(1)}s`;
        }
    }
    
    updatePlayModeButtons() {
        const currentMode = this.stateManager.getState('songs.playMode');
        
        this.performanceOptimizer.batchDOMUpdate('play-mode-buttons', () => {
            document.querySelectorAll('.play-mode-button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === currentMode);
            });
        });
    }
    
    updateProgressBar() {
        const currentTime = this.stateManager.getState('player.currentTime');
        const duration = this.stateManager.getState('player.duration');
        
        if (duration > 0 && this.elements.progressBar) {
            const percent = (currentTime / duration) * 100;
            this.elements.progressBar.style.width = `${percent}%`;
        }
    }
    
    updateTimeDisplay() {
        const currentTime = this.stateManager.getState('player.currentTime');
        const duration = this.stateManager.getState('player.duration');
        
        if (this.elements.currentTime) {
            this.elements.currentTime.textContent = this.formatTime(currentTime);
        }
        
        if (this.elements.totalTime) {
            this.elements.totalTime.textContent = this.formatTime(duration);
        }
    }
    
    updateLyrics() {
        const currentSong = this.playlistManager.getCurrentSong();
        const currentTime = this.stateManager.getState('player.currentTime');
        
        if (currentSong && currentSong.lyrics) {
            // 在同步模式下应用同步偏移
            const finalMode = this.audioManager.determineFinalMode(currentSong);
            let adjustedTime = currentTime;
            
            if (finalMode === 'sync') {
                const syncOffset = this.stateManager.getState('lyrics.syncOffset');
                adjustedTime = currentTime + syncOffset;
            }
            
            this.lyricsRenderer.render(currentSong.lyrics, adjustedTime);
        }
    }
    
    updateSongDisplay() {
        const currentSong = this.playlistManager.getCurrentSong();
        const currentIndex = this.stateManager.getState('songs.currentIndex');
        const totalSongs = this.stateManager.getState('songs.list').length;

        if (this.elements.displaySongTitle && currentSong) {
            this.elements.displaySongTitle.textContent = this.cleanSongName(currentSong.name);
        }

        if (this.elements.displaySongIndex) {
            this.elements.displaySongIndex.textContent = `${currentIndex + 1} / ${totalSongs}`;
        }
    }

    // 辅助函数：清理歌曲名称，移除开头的数字和下划线
    cleanSongName(name) {
        // 匹配开头的数字（可能带小数点），下划线，以及随后的空格
        return name.replace(/^\d+\s*[_\-]?\s*/, '').trim();
    }
    
    updatePlaylist() {
        const songs = this.stateManager.getState('songs.list');
        const currentIndex = this.stateManager.getState('songs.currentIndex');
        this.playlistManager.renderPlaylist(songs, currentIndex);
    }
    
    updateStatusIndicator() {
        const isPlaying = this.stateManager.getState('player.isPlaying');
        const songs = this.stateManager.getState('songs.list');
        
        if (this.elements.statusIndicator) {
            this.elements.statusIndicator.className = 'status-indicator';
            
            if (songs.length > 0) {
                if (isPlaying) {
                    this.elements.statusIndicator.classList.add('playing');
                } else {
                    this.elements.statusIndicator.classList.add('ready');
                }
            }
        }
    }
    
    // 通知系统
    showNotification(notification) {
        this.notificationSystem.show(notification);
    }
    
    // 工具方法
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // 获取性能报告
    getPerformanceReport() {
        return {
            optimizer: this.performanceOptimizer.getPerformanceReport(),
            resources: this.resourceManager.getMemoryUsage(),
            events: this.eventManager.getEventStats(),
            errors: this.errorHandler.getErrorStats()
        };
    }
    
    // 销毁播放器
    destroy() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        
        // 停止播放
        this.pause();
        
        // 销毁所有管理器
        this.audioManager?.destroy();
        this.playlistManager?.destroy();
        this.uiManager?.destroy();
        this.lyricsRenderer?.destroy();
        this.notificationSystem?.destroy();
        this.shortcutManager?.destroy();
        this.lyricsSearchManager?.destroy();
        
        // 销毁依赖
        this.performanceOptimizer?.destroy();
        this.eventManager?.destroy();
        this.resourceManager?.destroy();
        
        // 清理状态
        this.stateManager?.reset();
        
        console.log('LED歌词播放器已销毁');
    }
}

// 全局暴露LEDLyricsPlayer
window.LEDLyricsPlayer = LEDLyricsPlayer;