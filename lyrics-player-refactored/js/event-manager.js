/**
 * 事件管理器 - 优化事件处理，提供更好的事件管理
 * 解决原版本事件监听器过多且管理复杂的问题
 */
class EventManager {
    constructor(resourceManager = null, errorHandler = null) {
        this.resourceManager = resourceManager;
        this.errorHandler = errorHandler;
        this.eventMap = new Map();
        this.delegates = new Map();
        this.throttledEvents = new Map();
        this.debouncedEvents = new Map();
        this.isDestroyed = false;
        
        // 预定义的事件类型
        this.eventTypes = {
            // 播放器事件
            PLAY: 'player:play',
            PAUSE: 'player:pause',
            STOP: 'player:stop',
            SEEK: 'player:seek',
            TIME_UPDATE: 'player:timeupdate',
            SONG_CHANGE: 'player:songchange',
            SONG_END: 'player:songend',
            
            // 文件事件
            FILE_LOAD: 'file:load',
            FILE_ERROR: 'file:error',
            FILES_BATCH_LOAD: 'file:batchload',
            
            // UI事件
            UI_THEME_CHANGE: 'ui:themechange',
            UI_FONT_CHANGE: 'ui:fontchange',
            UI_FULLSCREEN: 'ui:fullscreen',
            UI_NOTIFICATION: 'ui:notification',
            
            // 歌词事件
            LYRICS_CHANGE: 'lyrics:change',
            LYRICS_SEARCH: 'lyrics:search',
            LYRICS_SYNC: 'lyrics:sync',
            
            // 播放列表事件
            PLAYLIST_ADD: 'playlist:add',
            PLAYLIST_REMOVE: 'playlist:remove',
            PLAYLIST_REORDER: 'playlist:reorder',
            PLAYLIST_CLEAR: 'playlist:clear'
        };
    }
    
    // 添加事件监听器
    on(eventType, handler, options = {}) {
        if (this.isDestroyed) {
            console.warn('EventManager has been destroyed');
            return null;
        }
        
        try {
            const wrappedHandler = this.wrapHandler(handler, options);
            const listenerId = this.generateListenerId();
            
            if (!this.eventMap.has(eventType)) {
                this.eventMap.set(eventType, new Map());
            }
            
            this.eventMap.get(eventType).set(listenerId, {
                handler: wrappedHandler,
                originalHandler: handler,
                options,
                addedAt: Date.now()
            });
            
            return listenerId;
        } catch (error) {
            this.handleError(error, { operation: 'addEventListener', eventType });
            return null;
        }
    }
    
    // 移除事件监听器
    off(eventType, listenerId) {
        if (this.isDestroyed) return false;
        
        try {
            const listeners = this.eventMap.get(eventType);
            if (listeners && listeners.has(listenerId)) {
                listeners.delete(listenerId);
                
                // 如果没有监听器了，清理事件类型
                if (listeners.size === 0) {
                    this.eventMap.delete(eventType);
                }
                
                return true;
            }
            return false;
        } catch (error) {
            this.handleError(error, { operation: 'removeEventListener', eventType });
            return false;
        }
    }
    
    // 一次性事件监听器
    once(eventType, handler, options = {}) {
        const wrappedHandler = (...args) => {
            handler(...args);
            this.off(eventType, listenerId);
        };
        
        const listenerId = this.on(eventType, wrappedHandler, options);
        return listenerId;
    }
    
    // 触发事件
    emit(eventType, data = null, options = {}) {
        if (this.isDestroyed) return false;
        
        try {
            const listeners = this.eventMap.get(eventType);
            if (!listeners || listeners.size === 0) {
                return false;
            }
            
            const event = {
                type: eventType,
                data,
                timestamp: Date.now(),
                target: options.target || null
            };
            
            // 按优先级排序（如果有的话）
            const sortedListeners = Array.from(listeners.entries()).sort((a, b) => {
                const priorityA = a[1].options.priority || 0;
                const priorityB = b[1].options.priority || 0;
                return priorityB - priorityA; // 高优先级先执行
            });
            
            let handled = false;
            
            for (const [listenerId, listenerInfo] of sortedListeners) {
                try {
                    const result = listenerInfo.handler(event);
                    
                    // 如果处理器返回 false，停止传播
                    if (result === false && options.stopOnFalse !== false) {
                        break;
                    }
                    
                    handled = true;
                } catch (error) {
                    this.handleError(error, { 
                        operation: 'eventHandler', 
                        eventType, 
                        listenerId 
                    });
                }
            }
            
            return handled;
        } catch (error) {
            this.handleError(error, { operation: 'emitEvent', eventType });
            return false;
        }
    }
    
    // 事件委托
    delegate(containerElement, selector, eventType, handler, options = {}) {
        if (this.isDestroyed) return null;
        
        const delegateId = this.generateListenerId();
        const wrappedHandler = (event) => {
            const target = event.target.closest(selector);
            if (target && containerElement.contains(target)) {
                event.delegateTarget = target;
                return handler(event);
            }
        };
        
        const listenerKey = this.addDOMEventListener(
            containerElement, 
            eventType, 
            wrappedHandler, 
            options
        );
        
        if (listenerKey) {
            this.delegates.set(delegateId, {
                containerElement,
                selector,
                eventType,
                handler,
                listenerKey,
                addedAt: Date.now()
            });
        }
        
        return delegateId;
    }
    
    // 移除事件委托
    undelegate(delegateId) {
        if (this.isDestroyed) return false;
        
        const delegateInfo = this.delegates.get(delegateId);
        if (delegateInfo) {
            this.removeDOMEventListener(delegateInfo.listenerKey);
            this.delegates.delete(delegateId);
            return true;
        }
        return false;
    }
    
    // 节流事件
    throttle(eventType, handler, delay = 100, options = {}) {
        if (this.isDestroyed) return null;
        
        let lastExecution = 0;
        let timeoutId = null;
        
        const throttledHandler = (...args) => {
            const now = Date.now();
            
            if (now - lastExecution >= delay) {
                lastExecution = now;
                return handler(...args);
            } else if (!timeoutId && options.trailing !== false) {
                timeoutId = setTimeout(() => {
                    lastExecution = Date.now();
                    timeoutId = null;
                    handler(...args);
                }, delay - (now - lastExecution));
                
                if (this.resourceManager) {
                    this.resourceManager.addTimer(timeoutId);
                }
            }
        };
        
        const listenerId = this.on(eventType, throttledHandler, options);
        
        if (listenerId) {
            this.throttledEvents.set(listenerId, {
                delay,
                handler,
                timeoutId: () => timeoutId
            });
        }
        
        return listenerId;
    }
    
    // 防抖事件
    debounce(eventType, handler, delay = 300, options = {}) {
        if (this.isDestroyed) return null;
        
        let timeoutId = null;
        
        const debouncedHandler = (...args) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                if (this.resourceManager) {
                    this.resourceManager.clearTimer(timeoutId);
                }
            }
            
            timeoutId = setTimeout(() => {
                timeoutId = null;
                handler(...args);
            }, delay);
            
            if (this.resourceManager) {
                this.resourceManager.addTimer(timeoutId);
            }
        };
        
        const listenerId = this.on(eventType, debouncedHandler, options);
        
        if (listenerId) {
            this.debouncedEvents.set(listenerId, {
                delay,
                handler,
                timeoutId: () => timeoutId
            });
        }
        
        return listenerId;
    }
    
    // 添加DOM事件监听器
    addDOMEventListener(element, eventType, handler, options = {}) {
        if (this.isDestroyed) return null;
        
        try {
            if (this.resourceManager) {
                return this.resourceManager.addEventListener(element, eventType, handler, options);
            } else {
                element.addEventListener(eventType, handler, options);
                return this.generateListenerId();
            }
        } catch (error) {
            this.handleError(error, { operation: 'addDOMEventListener', eventType });
            return null;
        }
    }
    
    // 移除DOM事件监听器
    removeDOMEventListener(listenerKey) {
        if (this.isDestroyed) return false;
        
        try {
            if (this.resourceManager) {
                return this.resourceManager.removeEventListener(listenerKey);
            }
            return false;
        } catch (error) {
            this.handleError(error, { operation: 'removeDOMEventListener' });
            return false;
        }
    }
    
    // 包装处理器
    wrapHandler(handler, options = {}) {
        return (event) => {
            try {
                // 执行前检查
                if (options.condition && !options.condition(event)) {
                    return;
                }
                
                // 执行处理器
                const result = handler(event);
                
                // 如果是异步处理器，处理Promise rejection
                if (result && typeof result.catch === 'function') {
                    result.catch(error => {
                        this.handleError(error, { 
                            operation: 'asyncEventHandler', 
                            eventType: event.type 
                        });
                    });
                }
                
                return result;
            } catch (error) {
                this.handleError(error, { 
                    operation: 'eventHandler', 
                    eventType: event.type 
                });
            }
        };
    }
    
    // 批量添加事件监听器
    addMultiple(eventHandlerMap, options = {}) {
        const listenerIds = [];
        
        for (const [eventType, handler] of Object.entries(eventHandlerMap)) {
            const listenerId = this.on(eventType, handler, options);
            if (listenerId) {
                listenerIds.push(listenerId);
            }
        }
        
        return listenerIds;
    }
    
    // 批量移除事件监听器
    removeMultiple(listenerIds) {
        const results = [];
        
        for (const listenerId of listenerIds) {
            // 查找事件类型
            let eventType = null;
            for (const [type, listeners] of this.eventMap) {
                if (listeners.has(listenerId)) {
                    eventType = type;
                    break;
                }
            }
            
            if (eventType) {
                results.push(this.off(eventType, listenerId));
            } else {
                results.push(false);
            }
        }
        
        return results;
    }
    
    // 清空特定事件类型的所有监听器
    clear(eventType) {
        if (this.isDestroyed) return false;
        
        if (eventType) {
            this.eventMap.delete(eventType);
        } else {
            this.eventMap.clear();
        }
        
        return true;
    }
    
    // 获取事件统计
    getEventStats() {
        const stats = {
            totalListeners: 0,
            byEventType: {},
            delegates: this.delegates.size,
            throttled: this.throttledEvents.size,
            debounced: this.debouncedEvents.size
        };
        
        for (const [eventType, listeners] of this.eventMap) {
            const count = listeners.size;
            stats.byEventType[eventType] = count;
            stats.totalListeners += count;
        }
        
        return stats;
    }
    
    // 生成监听器ID
    generateListenerId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // 错误处理
    handleError(error, context) {
        if (this.errorHandler) {
            this.errorHandler.handle(error, {
                type: this.errorHandler.errorTypes.STATE,
                ...context
            });
        } else {
            console.error('EventManager error:', error, context);
        }
    }
    
    // 键盘快捷键管理
    addShortcut(keys, handler, options = {}) {
        const normalizedKeys = this.normalizeShortcut(keys);
        const shortcutHandler = (event) => {
            if (this.matchesShortcut(event, normalizedKeys)) {
                if (options.preventDefault !== false) {
                    event.preventDefault();
                }
                if (options.stopPropagation !== false) {
                    event.stopPropagation();
                }
                
                return handler(event);
            }
        };
        
        return this.addDOMEventListener(document, 'keydown', shortcutHandler, options);
    }
    
    // 规范化快捷键
    normalizeShortcut(keys) {
        return keys.toLowerCase()
            .split('+')
            .map(key => key.trim())
            .sort();
    }
    
    // 检查快捷键匹配
    matchesShortcut(event, normalizedKeys) {
        const pressed = [];
        
        if (event.ctrlKey) pressed.push('ctrl');
        if (event.altKey) pressed.push('alt');
        if (event.shiftKey) pressed.push('shift');
        if (event.metaKey) pressed.push('meta');
        
        // 添加按键
        const key = event.key.toLowerCase();
        if (key !== 'control' && key !== 'alt' && key !== 'shift' && key !== 'meta') {
            pressed.push(key);
        }
        
        pressed.sort();
        
        return JSON.stringify(pressed) === JSON.stringify(normalizedKeys);
    }
    
    // 销毁事件管理器
    destroy() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        
        // 清理节流和防抖定时器
        for (const [listenerId, info] of this.throttledEvents) {
            const timeoutId = info.timeoutId();
            if (timeoutId && this.resourceManager) {
                this.resourceManager.clearTimer(timeoutId);
            }
        }
        
        for (const [listenerId, info] of this.debouncedEvents) {
            const timeoutId = info.timeoutId();
            if (timeoutId && this.resourceManager) {
                this.resourceManager.clearTimer(timeoutId);
            }
        }
        
        // 清理委托
        for (const [delegateId, delegateInfo] of this.delegates) {
            this.removeDOMEventListener(delegateInfo.listenerKey);
        }
        
        // 清理所有事件
        this.eventMap.clear();
        this.delegates.clear();
        this.throttledEvents.clear();
        this.debouncedEvents.clear();
        
        console.log('EventManager destroyed');
    }
}

// 全局暴露EventManager
window.EventManager = EventManager;