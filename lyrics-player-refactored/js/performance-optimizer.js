/**
 * 性能优化器 - 优化渲染性能和内存使用
 * 解决原版本性能问题和DOM操作频繁的问题
 */
class PerformanceOptimizer {
    constructor() {
        this.isEnabled = true;
        this.raf = null;
        this.pendingUpdates = new Map();
        this.updateQueue = [];
        this.batchUpdates = true;
        this.maxBatchSize = 50;
        this.updateInterval = 16; // ~60fps
        
        // 虚拟滚动配置
        this.virtualScrollConfig = {
            itemHeight: 40,
            bufferSize: 5,
            threshold: 100 // 超过100项启用虚拟滚动
        };
        
        // 缓存管理
        this.cache = new Map();
        this.maxCacheSize = 1000;
        this.cacheHitCount = 0;
        this.cacheMissCount = 0;
        
        // 性能监控
        this.performanceData = {
            renderTimes: [],
            updateCounts: 0,
            cacheStats: {
                hits: 0,
                misses: 0,
                size: 0
            }
        };
        
        this.startUpdateLoop();
    }
    
    // 启动更新循环
    startUpdateLoop() {
        const update = () => {
            if (this.isEnabled && this.updateQueue.length > 0) {
                this.processBatchUpdates();
            }
            this.raf = requestAnimationFrame(update);
        };
        
        this.raf = requestAnimationFrame(update);
    }
    
    // 批量处理DOM更新
    batchDOMUpdate(key, updateFunction, priority = 0) {
        if (!this.batchUpdates) {
            updateFunction();
            return;
        }
        
        // 如果已有相同key的更新，替换它（避免重复更新）
        this.pendingUpdates.set(key, {
            function: updateFunction,
            priority,
            timestamp: performance.now()
        });
        
        this.scheduleUpdate();
    }
    
    // 调度更新
    scheduleUpdate() {
        // 将待处理的更新添加到队列
        for (const [key, updateInfo] of this.pendingUpdates) {
            this.updateQueue.push({ key, ...updateInfo });
        }
        
        // 按优先级排序
        this.updateQueue.sort((a, b) => b.priority - a.priority);
        
        // 清空待处理映射
        this.pendingUpdates.clear();
    }
    
    // 处理批量更新
    processBatchUpdates() {
        const startTime = performance.now();
        let processedCount = 0;
        
        while (this.updateQueue.length > 0 && processedCount < this.maxBatchSize) {
            const update = this.updateQueue.shift();
            
            try {
                update.function();
                processedCount++;
            } catch (error) {
                console.error('Batch update error:', error);
            }
            
            // 如果单帧时间超过16ms，暂停处理
            if (performance.now() - startTime > this.updateInterval) {
                break;
            }
        }
        
        // 记录性能数据
        const renderTime = performance.now() - startTime;
        this.recordRenderTime(renderTime);
        this.performanceData.updateCounts += processedCount;
    }
    
    // 虚拟滚动实现
    createVirtualList(container, items, renderItem, options = {}) {
        const config = { ...this.virtualScrollConfig, ...options };
        
        if (items.length < config.threshold) {
            // 项目较少，使用普通渲染
            return this.renderNormalList(container, items, renderItem);
        }
        
        const virtualList = new VirtualList(container, items, renderItem, config);
        return virtualList;
    }
    
    // 普通列表渲染
    renderNormalList(container, items, renderItem) {
        const fragment = document.createDocumentFragment();
        
        items.forEach((item, index) => {
            const element = renderItem(item, index);
            if (element) {
                fragment.appendChild(element);
            }
        });
        
        this.batchDOMUpdate(`normal-list-${container.id}`, () => {
            container.innerHTML = '';
            container.appendChild(fragment);
        });
        
        return {
            update: (newItems) => {
                this.renderNormalList(container, newItems, renderItem);
            },
            destroy: () => {
                container.innerHTML = '';
            }
        };
    }
    
    // 缓存管理
    setCache(key, value) {
        if (this.cache.size >= this.maxCacheSize) {
            // LRU清理：删除最旧的项目
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            accessCount: 0
        });
        
        this.updateCacheStats();
    }
    
    getCache(key) {
        const cached = this.cache.get(key);
        
        if (cached) {
            cached.accessCount++;
            cached.lastAccessed = Date.now();
            this.cacheHitCount++;
            this.updateCacheStats();
            return cached.value;
        }
        
        this.cacheMissCount++;
        this.updateCacheStats();
        return null;
    }
    
    clearCache(pattern = null) {
        if (!pattern) {
            this.cache.clear();
        } else {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        }
        
        this.updateCacheStats();
    }
    
    // 防抖DOM操作
    debounceDOMUpdate(key, updateFunction, delay = 100) {
        const existingTimeout = this.pendingUpdates.get(`debounce-${key}`);
        if (existingTimeout) {
            clearTimeout(existingTimeout.timeoutId);
        }
        
        const timeoutId = setTimeout(() => {
            updateFunction();
            this.pendingUpdates.delete(`debounce-${key}`);
        }, delay);
        
        this.pendingUpdates.set(`debounce-${key}`, { timeoutId });
    }
    
    // 通用节流函数
    throttle(func, interval = 100) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= interval) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    }
    
    // 通用防抖函数
    debounce(func, delay = 100) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    // 节流DOM操作
    throttleDOMUpdate(key, updateFunction, interval = 100) {
        const lastUpdate = this.pendingUpdates.get(`throttle-${key}`);
        const now = Date.now();
        
        if (!lastUpdate || now - lastUpdate.timestamp >= interval) {
            updateFunction();
            this.pendingUpdates.set(`throttle-${key}`, { timestamp: now });
        }
    }
    
    // 测量DOM操作性能
    measureDOMOperation(name, operation) {
        const startTime = performance.now();
        
        try {
            const result = operation();
            const endTime = performance.now();
            
            this.recordRenderTime(endTime - startTime, name);
            return result;
        } catch (error) {
            console.error(`DOM operation '${name}' failed:`, error);
            throw error;
        }
    }
    
    // 优化图片加载
    optimizeImageLoading(img, src, options = {}) {
        const { lazy = true, placeholder = null } = options;
        
        if (lazy && 'IntersectionObserver' in window) {
            return this.lazyLoadImage(img, src, placeholder);
        } else {
            img.src = src;
            return Promise.resolve();
        }
    }
    
    // 懒加载图片
    lazyLoadImage(img, src, placeholder = null) {
        return new Promise((resolve, reject) => {
            if (placeholder) {
                img.src = placeholder;
            }
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        observer.unobserve(img);
                        
                        img.onload = () => resolve();
                        img.onerror = reject;
                        img.src = src;
                    }
                });
            });
            
            observer.observe(img);
        });
    }
    
    // 优化动画
    optimizeAnimation(element, animationFunction, duration = 300) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                animationFunction(progress);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }
    
    // Web Worker支持
    createWebWorker(workerFunction) {
        const blob = new Blob([`(${workerFunction.toString()})()`], {
            type: 'application/javascript'
        });
        
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);
        
        worker.addEventListener('error', (error) => {
            console.error('Web Worker error:', error);
            URL.revokeObjectURL(url);
        });
        
        return {
            worker,
            cleanup: () => {
                worker.terminate();
                URL.revokeObjectURL(url);
            }
        };
    }
    
    // 记录渲染时间
    recordRenderTime(time, operation = 'default') {
        this.performanceData.renderTimes.push({
            time,
            operation,
            timestamp: Date.now()
        });
        
        // 只保留最近100次记录
        if (this.performanceData.renderTimes.length > 100) {
            this.performanceData.renderTimes.shift();
        }
    }
    
    // 更新缓存统计
    updateCacheStats() {
        this.performanceData.cacheStats = {
            hits: this.cacheHitCount,
            misses: this.cacheMissCount,
            size: this.cache.size,
            hitRate: this.cacheHitCount / (this.cacheHitCount + this.cacheMissCount) || 0
        };
    }
    
    // 获取性能报告
    getPerformanceReport() {
        const renderTimes = this.performanceData.renderTimes;
        const avgRenderTime = renderTimes.length > 0 
            ? renderTimes.reduce((sum, r) => sum + r.time, 0) / renderTimes.length 
            : 0;
        
        return {
            averageRenderTime: avgRenderTime,
            totalUpdates: this.performanceData.updateCounts,
            pendingUpdates: this.updateQueue.length,
            cacheStats: this.performanceData.cacheStats,
            recentRenderTimes: renderTimes.slice(-10),
            memoryUsage: this.getMemoryUsage()
        };
    }
    
    // 获取内存使用情况
    getMemoryUsage() {
        const usage = {
            cacheSize: this.cache.size,
            pendingUpdates: this.pendingUpdates.size,
            queueSize: this.updateQueue.length
        };
        
        if (performance.memory) {
            usage.heap = {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        
        return usage;
    }
    
    // 性能优化建议
    getOptimizationSuggestions() {
        const report = this.getPerformanceReport();
        const suggestions = [];
        
        if (report.averageRenderTime > 16) {
            suggestions.push('平均渲染时间过长，考虑减少DOM操作或启用虚拟滚动');
        }
        
        if (report.cacheStats.hitRate < 0.7) {
            suggestions.push('缓存命中率较低，考虑优化缓存策略');
        }
        
        if (report.pendingUpdates > 100) {
            suggestions.push('待处理更新过多，考虑增加批处理大小');
        }
        
        if (report.memoryUsage.heap && report.memoryUsage.heap.used > 100) {
            suggestions.push('内存使用较高，考虑清理未使用的资源');
        }
        
        return suggestions;
    }
    
    // 启用/禁用优化
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (!enabled && this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        } else if (enabled && !this.raf) {
            this.startUpdateLoop();
        }
    }
    
    // 销毁优化器
    destroy() {
        this.isEnabled = false;
        
        if (this.raf) {
            cancelAnimationFrame(this.raf);
        }
        
        this.pendingUpdates.clear();
        this.updateQueue = [];
        this.cache.clear();
        
        console.log('PerformanceOptimizer destroyed');
    }
}

// 虚拟列表实现
class VirtualList {
    constructor(container, items, renderItem, config) {
        this.container = container;
        this.items = items;
        this.renderItem = renderItem;
        this.config = config;
        
        this.scrollTop = 0;
        this.visibleStart = 0;
        this.visibleEnd = 0;
        this.renderedElements = new Map();
        
        this.init();
    }
    
    init() {
        this.container.style.overflow = 'auto';
        this.container.style.position = 'relative';
        
        this.viewport = document.createElement('div');
        this.viewport.style.position = 'absolute';
        this.viewport.style.top = '0';
        this.viewport.style.left = '0';
        this.viewport.style.right = '0';
        
        this.container.appendChild(this.viewport);
        
        this.container.addEventListener('scroll', () => {
            this.handleScroll();
        });
        
        this.update();
    }
    
    handleScroll() {
        this.scrollTop = this.container.scrollTop;
        this.update();
    }
    
    update() {
        const containerHeight = this.container.clientHeight;
        const itemHeight = this.config.itemHeight;
        const bufferSize = this.config.bufferSize;
        
        const visibleStart = Math.floor(this.scrollTop / itemHeight);
        const visibleEnd = Math.min(
            this.items.length - 1,
            Math.ceil((this.scrollTop + containerHeight) / itemHeight)
        );
        
        this.visibleStart = Math.max(0, visibleStart - bufferSize);
        this.visibleEnd = Math.min(this.items.length - 1, visibleEnd + bufferSize);
        
        this.render();
    }
    
    render() {
        // 清理不可见的元素
        for (const [index, element] of this.renderedElements) {
            if (index < this.visibleStart || index > this.visibleEnd) {
                element.remove();
                this.renderedElements.delete(index);
            }
        }
        
        // 渲染可见元素
        for (let i = this.visibleStart; i <= this.visibleEnd; i++) {
            if (!this.renderedElements.has(i)) {
                const element = this.renderItem(this.items[i], i);
                element.style.position = 'absolute';
                element.style.top = `${i * this.config.itemHeight}px`;
                element.style.left = '0';
                element.style.right = '0';
                element.style.height = `${this.config.itemHeight}px`;
                
                this.viewport.appendChild(element);
                this.renderedElements.set(i, element);
            }
        }
        
        // 设置容器高度
        const totalHeight = this.items.length * this.config.itemHeight;
        this.viewport.style.height = `${totalHeight}px`;
    }
    
    updateItems(newItems) {
        this.items = newItems;
        this.renderedElements.clear();
        this.viewport.innerHTML = '';
        this.update();
    }
    
    destroy() {
        this.container.removeChild(this.viewport);
        this.renderedElements.clear();
    }
}

// 全局暴露PerformanceOptimizer
window.PerformanceOptimizer = PerformanceOptimizer;