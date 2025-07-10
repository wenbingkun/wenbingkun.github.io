/**
 * 状态管理器 - 统一管理应用状态
 * 解决原版本状态分散管理的问题
 */
class StateManager {
    constructor() {
        this.state = {
            // 播放器状态
            player: {
                isPlaying: false,
                currentTime: 0,
                duration: 0,
                playbackSpeed: 1.0,
                volume: 1.0,
                isLoading: false
            },
            
            // 歌曲状态
            songs: {
                list: [],
                currentIndex: -1,
                playMode: 'loop', // 'list', 'loop', 'single', 'random'
                playHistory: []
            },
            
            // 歌词状态
            lyrics: {
                currentIndex: -1,
                syncOffset: 0,
                searchResults: [],
                cache: new Map()
            },
            
            // 音频状态
            audio: {
                element: null,
                mode: 'lyrics', // 'lyrics', 'audio', 'sync'
                isAvailable: false
            },
            
            // UI状态
            ui: {
                theme: 'classic',
                fontScale: 1.3,
                isFullscreen: false,
                controlPanelVisible: false,
                notifications: []
            }
        };
        
        this.listeners = new Map();
        this.history = [];
        this.maxHistorySize = 50;
    }
    
    // 获取状态
    getState(path = null) {
        if (!path) return this.state;
        return this.getNestedValue(this.state, path);
    }
    
    // 设置状态
    setState(path, value, silent = false) {
        try {
            const oldValue = this.getNestedValue(this.state, path);
            
            // 保存历史记录
            if (!silent) {
                this.pushHistory(path, oldValue, value);
            }
            
            this.setNestedValue(this.state, path, value);
            
            // 触发监听器
            if (!silent) {
                this.notifyListeners(path, value, oldValue);
            }
            
            return true;
        } catch (error) {
            console.error('StateManager.setState error:', error);
            return false;
        }
    }
    
    // 批量更新状态
    batchUpdate(updates, silent = false) {
        const oldState = JSON.parse(JSON.stringify(this.state));
        
        try {
            updates.forEach(({ path, value }) => {
                this.setNestedValue(this.state, path, value);
            });
            
            if (!silent) {
                updates.forEach(({ path, value }) => {
                    const oldValue = this.getNestedValue(oldState, path);
                    this.notifyListeners(path, value, oldValue);
                });
            }
            
            return true;
        } catch (error) {
            console.error('StateManager.batchUpdate error:', error);
            // 回滚状态
            this.state = oldState;
            return false;
        }
    }
    
    // 订阅状态变化
    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        
        this.listeners.get(path).add(callback);
        
        // 返回取消订阅函数
        return () => {
            const pathListeners = this.listeners.get(path);
            if (pathListeners) {
                pathListeners.delete(callback);
                if (pathListeners.size === 0) {
                    this.listeners.delete(path);
                }
            }
        };
    }
    
    // 取消订阅
    unsubscribe(path, callback) {
        const pathListeners = this.listeners.get(path);
        if (pathListeners) {
            pathListeners.delete(callback);
            if (pathListeners.size === 0) {
                this.listeners.delete(path);
            }
        }
    }
    
    // 清空所有监听器
    clearListeners() {
        this.listeners.clear();
    }
    
    // 重置状态
    reset() {
        const defaultState = {
            player: {
                isPlaying: false,
                currentTime: 0,
                duration: 0,
                playbackSpeed: 1.0,
                volume: 1.0,
                isLoading: false
            },
            songs: {
                list: [],
                currentIndex: -1,
                playMode: 'loop',
                playHistory: []
            },
            lyrics: {
                currentIndex: -1,
                syncOffset: 0,
                searchResults: [],
                cache: new Map()
            },
            audio: {
                element: null,
                mode: 'lyrics',
                isAvailable: false
            },
            ui: {
                theme: 'classic',
                fontScale: 1.3,
                isFullscreen: false,
                controlPanelVisible: false,
                notifications: []
            }
        };
        
        this.state = defaultState;
        this.history = [];
        this.notifyListeners('*', this.state, null);
    }
    
    // 获取嵌套值
    getNestedValue(obj, path) {
        if (typeof path === 'string') {
            path = path.split('.');
        }
        
        let current = obj;
        for (const key of path) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[key];
        }
        return current;
    }
    
    // 设置嵌套值
    setNestedValue(obj, path, value) {
        if (typeof path === 'string') {
            path = path.split('.');
        }
        
        let current = obj;
        for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[path[path.length - 1]] = value;
    }
    
    // 通知监听器
    notifyListeners(path, newValue, oldValue) {
        // 精确路径监听器
        const pathListeners = this.listeners.get(path);
        if (pathListeners) {
            pathListeners.forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error('StateManager listener error:', error);
                }
            });
        }
        
        // 通配符监听器
        const wildcardListeners = this.listeners.get('*');
        if (wildcardListeners) {
            wildcardListeners.forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error('StateManager wildcard listener error:', error);
                }
            });
        }
    }
    
    // 历史记录管理
    pushHistory(path, oldValue, newValue) {
        this.history.push({
            timestamp: Date.now(),
            path,
            oldValue: JSON.parse(JSON.stringify(oldValue)),
            newValue: JSON.parse(JSON.stringify(newValue))
        });
        
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }
    
    // 获取历史记录
    getHistory(limit = 10) {
        return this.history.slice(-limit);
    }
    
    // 状态验证
    validate() {
        const errors = [];
        
        // 验证播放器状态
        const player = this.state.player;
        if (player.currentTime < 0) {
            errors.push('播放器当前时间不能为负数');
        }
        if (player.playbackSpeed <= 0) {
            errors.push('播放速度必须大于0');
        }
        
        // 验证歌曲状态
        const songs = this.state.songs;
        if (songs.currentIndex >= songs.list.length) {
            errors.push('当前歌曲索引超出范围');
        }
        
        return errors;
    }
    
    // 导出状态（用于保存）
    export() {
        return {
            timestamp: Date.now(),
            state: JSON.parse(JSON.stringify(this.state)),
            history: this.history.slice(-10) // 只保存最近10条历史
        };
    }
    
    // 导入状态（用于恢复）
    import(data) {
        try {
            if (data.state) {
                this.state = data.state;
                // 重新创建Map对象
                this.state.lyrics.cache = new Map();
            }
            if (data.history) {
                this.history = data.history;
            }
            this.notifyListeners('*', this.state, null);
            return true;
        } catch (error) {
            console.error('StateManager.import error:', error);
            return false;
        }
    }
}

// 全局暴露StateManager
window.StateManager = StateManager;