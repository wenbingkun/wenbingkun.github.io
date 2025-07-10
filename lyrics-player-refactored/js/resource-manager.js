/**
 * 资源管理器 - 统一管理内存资源，防止内存泄漏
 * 解决原版本资源管理不完善的问题
 */
class ResourceManager {
    constructor() {
        this.resources = new Map();
        this.timers = new Set();
        this.eventListeners = new Map();
        this.objectUrls = new Set();
        this.audioElements = new WeakSet();
        this.observers = new Set();
        this.isDestroyed = false;
        this.cleanupInterval = null;
        
        // 自动清理间隔（30秒）
        this.startAutoCleanup();
        
        // 页面卸载时清理
        this.bindPageUnload();
    }
    
    // 注册资源
    register(id, resource, type = 'generic') {
        if (this.isDestroyed) {
            console.warn('ResourceManager has been destroyed');
            return false;
        }
        
        const resourceInfo = {
            id,
            resource,
            type,
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 0
        };
        
        this.resources.set(id, resourceInfo);
        return id;
    }
    
    // 获取资源
    get(id) {
        if (this.isDestroyed) return null;
        
        const resourceInfo = this.resources.get(id);
        if (resourceInfo) {
            resourceInfo.lastAccessed = Date.now();
            resourceInfo.accessCount++;
            return resourceInfo.resource;
        }
        return null;
    }
    
    // 释放资源
    release(id) {
        if (this.isDestroyed) return false;
        
        const resourceInfo = this.resources.get(id);
        if (resourceInfo) {
            this.cleanupResource(resourceInfo);
            this.resources.delete(id);
            return true;
        }
        return false;
    }
    
    // 管理定时器
    addTimer(timer) {
        this.timers.add(timer);
        return timer;
    }
    
    clearTimer(timer) {
        clearTimeout(timer);
        clearInterval(timer);
        this.timers.delete(timer);
    }
    
    clearAllTimers() {
        for (const timer of this.timers) {
            clearTimeout(timer);
            clearInterval(timer);
        }
        this.timers.clear();
    }
    
    // 管理事件监听器
    addEventListener(element, event, handler, options = {}) {
        const key = this.generateEventKey(element, event, handler);
        
        element.addEventListener(event, handler, options);
        
        this.eventListeners.set(key, {
            element,
            event,
            handler,
            options,
            addedAt: Date.now()
        });
        
        return key;
    }
    
    removeEventListener(key) {
        const listenerInfo = this.eventListeners.get(key);
        if (listenerInfo) {
            const { element, event, handler, options } = listenerInfo;
            try {
                element.removeEventListener(event, handler, options);
            } catch (error) {
                console.warn('Error removing event listener:', error);
            }
            this.eventListeners.delete(key);
            return true;
        }
        return false;
    }
    
    removeAllEventListeners() {
        for (const [key, listenerInfo] of this.eventListeners) {
            const { element, event, handler, options } = listenerInfo;
            try {
                element.removeEventListener(event, handler, options);
            } catch (error) {
                console.warn('Error removing event listener:', error);
            }
        }
        this.eventListeners.clear();
    }
    
    // 管理对象URL
    createObjectURL(blob) {
        try {
            const url = URL.createObjectURL(blob);
            this.objectUrls.add(url);
            return url;
        } catch (error) {
            console.error('Error creating object URL:', error);
            return null;
        }
    }
    
    revokeObjectURL(url) {
        try {
            URL.revokeObjectURL(url);
            this.objectUrls.delete(url);
        } catch (error) {
            console.warn('Error revoking object URL:', error);
        }
    }
    
    revokeAllObjectURLs() {
        for (const url of this.objectUrls) {
            try {
                URL.revokeObjectURL(url);
            } catch (error) {
                console.warn('Error revoking object URL:', error);
            }
        }
        this.objectUrls.clear();
    }
    
    // 管理音频元素
    createAudioElement(src = null) {
        const audio = new Audio(src);
        this.audioElements.add(audio);
        
        // 添加清理监听器
        const cleanup = () => {
            this.cleanupAudioElement(audio);
        };
        
        audio.addEventListener('error', cleanup);
        audio.addEventListener('ended', cleanup);
        
        return audio;
    }
    
    cleanupAudioElement(audio) {
        try {
            audio.pause();
            audio.currentTime = 0;
            audio.removeAttribute('src');
            audio.load();
        } catch (error) {
            console.warn('Error cleaning up audio element:', error);
        }
    }
    
    // 管理观察者
    addObserver(observer) {
        this.observers.add(observer);
        return observer;
    }
    
    removeObserver(observer) {
        try {
            if (observer.disconnect) {
                observer.disconnect();
            }
        } catch (error) {
            console.warn('Error disconnecting observer:', error);
        }
        this.observers.delete(observer);
    }
    
    removeAllObservers() {
        for (const observer of this.observers) {
            try {
                if (observer.disconnect) {
                    observer.disconnect();
                }
            } catch (error) {
                console.warn('Error disconnecting observer:', error);
            }
        }
        this.observers.clear();
    }
    
    // 内存使用情况
    getMemoryUsage() {
        const usage = {
            resources: this.resources.size,
            timers: this.timers.size,
            eventListeners: this.eventListeners.size,
            objectUrls: this.objectUrls.size,
            observers: this.observers.size
        };
        
        // 按类型统计资源
        const resourcesByType = {};
        for (const [id, resourceInfo] of this.resources) {
            resourcesByType[resourceInfo.type] = (resourcesByType[resourceInfo.type] || 0) + 1;
        }
        
        usage.resourcesByType = resourcesByType;
        
        // 浏览器内存信息（如果可用）
        if (performance.memory) {
            usage.heap = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        
        return usage;
    }
    
    // 自动清理
    startAutoCleanup() {
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, 30000); // 每30秒清理一次
    }
    
    performCleanup() {
        if (this.isDestroyed) return;
        
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5分钟未访问的资源
        
        // 清理过期资源
        for (const [id, resourceInfo] of this.resources) {
            if (now - resourceInfo.lastAccessed > maxAge) {
                this.release(id);
            }
        }
        
        // 清理过期的事件监听器
        for (const [key, listenerInfo] of this.eventListeners) {
            if (now - listenerInfo.addedAt > maxAge * 2) { // 10分钟
                this.removeEventListener(key);
            }
        }
        
        // 强制垃圾回收（如果可用）
        if (window.gc) {
            window.gc();
        }
    }
    
    // 清理资源
    cleanupResource(resourceInfo) {
        const { resource, type } = resourceInfo;
        
        try {
            switch (type) {
                case 'audio':
                    this.cleanupAudioElement(resource);
                    break;
                    
                case 'url':
                    this.revokeObjectURL(resource);
                    break;
                    
                case 'canvas':
                    if (resource.getContext) {
                        const ctx = resource.getContext('2d');
                        if (ctx) {
                            ctx.clearRect(0, 0, resource.width, resource.height);
                        }
                    }
                    break;
                    
                case 'observer':
                    if (resource.disconnect) {
                        resource.disconnect();
                    }
                    break;
                    
                default:
                    // 通用清理
                    if (resource && typeof resource.destroy === 'function') {
                        resource.destroy();
                    }
            }
        } catch (error) {
            console.warn('Error cleaning up resource:', error);
        }
    }
    
    // 生成事件键
    generateEventKey(element, event, handler) {
        const elementId = element.id || element.tagName || 'unknown';
        const handlerStr = handler.toString().slice(0, 50);
        return `${elementId}_${event}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // 绑定页面卸载事件
    bindPageUnload() {
        const cleanup = () => {
            this.destroy();
        };
        
        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('unload', cleanup);
        
        // 页面隐藏时也进行清理
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.performCleanup();
            }
        });
    }
    
    // 创建资源管理器的安全包装器
    createSafeWrapper(fn) {
        return (...args) => {
            if (this.isDestroyed) {
                console.warn('ResourceManager has been destroyed');
                return null;
            }
            
            try {
                return fn(...args);
            } catch (error) {
                console.error('ResourceManager wrapper error:', error);
                return null;
            }
        };
    }
    
    // 获取资源统计
    getResourceStats() {
        const stats = {
            total: this.resources.size,
            byType: {},
            oldestResource: null,
            newestResource: null,
            mostAccessed: null
        };
        
        let oldestTime = Date.now();
        let newestTime = 0;
        let maxAccess = 0;
        
        for (const [id, resourceInfo] of this.resources) {
            // 按类型统计
            stats.byType[resourceInfo.type] = (stats.byType[resourceInfo.type] || 0) + 1;
            
            // 最旧资源
            if (resourceInfo.createdAt < oldestTime) {
                oldestTime = resourceInfo.createdAt;
                stats.oldestResource = { id, ...resourceInfo };
            }
            
            // 最新资源
            if (resourceInfo.createdAt > newestTime) {
                newestTime = resourceInfo.createdAt;
                stats.newestResource = { id, ...resourceInfo };
            }
            
            // 最多访问
            if (resourceInfo.accessCount > maxAccess) {
                maxAccess = resourceInfo.accessCount;
                stats.mostAccessed = { id, ...resourceInfo };
            }
        }
        
        return stats;
    }
    
    // 销毁资源管理器
    destroy() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        
        // 停止自动清理
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        // 清理所有资源
        for (const [id, resourceInfo] of this.resources) {
            this.cleanupResource(resourceInfo);
        }
        this.resources.clear();
        
        // 清理定时器
        this.clearAllTimers();
        
        // 清理事件监听器
        this.removeAllEventListeners();
        
        // 清理对象URL
        this.revokeAllObjectURLs();
        
        // 清理观察者
        this.removeAllObservers();
        
        console.log('ResourceManager destroyed');
    }
}

// 全局暴露ResourceManager
window.ResourceManager = ResourceManager;