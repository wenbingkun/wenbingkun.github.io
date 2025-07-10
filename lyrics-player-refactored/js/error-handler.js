/**
 * 错误处理系统 - 统一错误处理和用户友好的错误提示
 * 解决原版本错误处理不一致的问题
 */
class ErrorHandler {
    constructor() {
        this.errorQueue = [];
        this.maxErrors = 50;
        this.notificationCallback = null;
        this.isProduction = false;
        
        // 错误类型映射
        this.errorTypes = {
            FILE_READ: 'file_read',
            AUDIO_LOAD: 'audio_load',
            LYRICS_PARSE: 'lyrics_parse',
            NETWORK: 'network',
            PERMISSION: 'permission',
            VALIDATION: 'validation',
            STATE: 'state',
            UNKNOWN: 'unknown'
        };
        
        // 用户友好的错误消息
        this.userMessages = {
            [this.errorTypes.FILE_READ]: {
                title: '文件读取失败',
                message: '无法读取选择的文件，请检查文件是否损坏或格式是否正确。',
                level: 'error'
            },
            [this.errorTypes.AUDIO_LOAD]: {
                title: '音频加载失败',
                message: '音频文件无法播放，请检查文件格式是否支持。',
                level: 'error'
            },
            [this.errorTypes.LYRICS_PARSE]: {
                title: '歌词解析失败',
                message: '歌词文件格式不正确，请检查LRC文件格式。',
                level: 'warning'
            },
            [this.errorTypes.NETWORK]: {
                title: '网络错误',
                message: '网络连接出现问题，请检查网络连接。',
                level: 'error'
            },
            [this.errorTypes.PERMISSION]: {
                title: '权限不足',
                message: '需要相应权限才能执行此操作。',
                level: 'warning'
            },
            [this.errorTypes.VALIDATION]: {
                title: '输入验证失败',
                message: '输入的数据不符合要求，请检查输入。',
                level: 'warning'
            },
            [this.errorTypes.STATE]: {
                title: '状态错误',
                message: '应用状态异常，请刷新页面重试。',
                level: 'error'
            },
            [this.errorTypes.UNKNOWN]: {
                title: '未知错误',
                message: '发生未知错误，请稍后重试。',
                level: 'error'
            }
        };
        
        // 绑定全局错误处理
        this.bindGlobalHandlers();
    }
    
    // 设置生产模式
    setProduction(isProduction) {
        this.isProduction = isProduction;
    }
    
    // 设置通知回调
    setNotificationCallback(callback) {
        this.notificationCallback = callback;
    }
    
    // 处理错误
    handle(error, context = {}) {
        const errorInfo = this.createErrorInfo(error, context);
        
        // 记录错误
        this.logError(errorInfo);
        
        // 存储错误
        this.storeError(errorInfo);
        
        // 显示用户友好的错误消息
        this.showUserMessage(errorInfo);
        
        return errorInfo;
    }
    
    // 创建错误信息对象
    createErrorInfo(error, context) {
        const timestamp = new Date().toISOString();
        const errorType = this.identifyErrorType(error, context);
        
        const errorInfo = {
            id: this.generateErrorId(),
            timestamp,
            type: errorType,
            message: error.message || String(error),
            stack: error.stack,
            context: { ...context },
            userAgent: navigator.userAgent,
            url: window.location.href,
            handled: true
        };
        
        // 添加额外的上下文信息
        if (context.file) {
            errorInfo.file = {
                name: context.file.name,
                size: context.file.size,
                type: context.file.type
            };
        }
        
        return errorInfo;
    }
    
    // 识别错误类型
    identifyErrorType(error, context) {
        const message = error.message || String(error);
        const contextType = context.type;
        
        // 基于上下文类型
        if (contextType) {
            return contextType;
        }
        
        // 基于错误消息
        if (message.includes('Failed to fetch') || message.includes('Network')) {
            return this.errorTypes.NETWORK;
        }
        
        if (message.includes('Permission') || message.includes('Denied')) {
            return this.errorTypes.PERMISSION;
        }
        
        if (message.includes('decode') || message.includes('format')) {
            return this.errorTypes.AUDIO_LOAD;
        }
        
        if (message.includes('parse') || message.includes('Invalid')) {
            return this.errorTypes.LYRICS_PARSE;
        }
        
        if (context.operation === 'file_read') {
            return this.errorTypes.FILE_READ;
        }
        
        return this.errorTypes.UNKNOWN;
    }
    
    // 记录错误
    logError(errorInfo) {
        if (this.isProduction) {
            // 生产环境：只记录关键信息
            console.error(`[${errorInfo.type}] ${errorInfo.message}`);
        } else {
            // 开发环境：记录详细信息
            console.group(`🔴 Error ${errorInfo.id}`);
            console.error('Type:', errorInfo.type);
            console.error('Message:', errorInfo.message);
            console.error('Context:', errorInfo.context);
            if (errorInfo.stack) {
                console.error('Stack:', errorInfo.stack);
            }
            console.groupEnd();
        }
    }
    
    // 存储错误
    storeError(errorInfo) {
        this.errorQueue.push(errorInfo);
        
        // 限制错误队列大小
        if (this.errorQueue.length > this.maxErrors) {
            this.errorQueue.shift();
        }
    }
    
    // 显示用户友好的错误消息
    showUserMessage(errorInfo) {
        const userMsg = this.userMessages[errorInfo.type] || this.userMessages[this.errorTypes.UNKNOWN];
        
        if (this.notificationCallback) {
            this.notificationCallback({
                title: userMsg.title,
                message: userMsg.message,
                level: userMsg.level,
                duration: userMsg.level === 'error' ? 5000 : 3000,
                errorId: errorInfo.id
            });
        }
    }
    
    // 生成错误ID
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // 获取错误历史
    getErrorHistory(limit = 10) {
        return this.errorQueue.slice(-limit);
    }
    
    // 清空错误历史
    clearErrors() {
        this.errorQueue = [];
    }
    
    // 获取错误统计
    getErrorStats() {
        const stats = {};
        
        this.errorQueue.forEach(error => {
            stats[error.type] = (stats[error.type] || 0) + 1;
        });
        
        return {
            total: this.errorQueue.length,
            byType: stats,
            recent: this.errorQueue.slice(-5)
        };
    }
    
    // 绑定全局错误处理
    bindGlobalHandlers() {
        // 全局错误处理
        window.addEventListener('error', (event) => {
            this.handle(event.error || new Error(event.message), {
                type: this.errorTypes.UNKNOWN,
                source: 'global',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        // Promise 拒绝处理
        window.addEventListener('unhandledrejection', (event) => {
            this.handle(event.reason, {
                type: this.errorTypes.UNKNOWN,
                source: 'promise'
            });
        });
    }
    
    // 创建错误包装器
    wrap(fn, context = {}) {
        return (...args) => {
            try {
                const result = fn(...args);
                
                // 如果返回Promise，处理rejection
                if (result && typeof result.catch === 'function') {
                    return result.catch(error => {
                        this.handle(error, context);
                        throw error;
                    });
                }
                
                return result;
            } catch (error) {
                this.handle(error, context);
                throw error;
            }
        };
    }
    
    // 创建异步错误包装器
    wrapAsync(fn, context = {}) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.handle(error, context);
                throw error;
            }
        };
    }
    
    // 验证输入
    validateInput(value, rules, fieldName = 'input') {
        const errors = [];
        
        if (rules.required && (value === null || value === undefined || value === '')) {
            errors.push(`${fieldName} 是必填项`);
        }
        
        if (rules.type && typeof value !== rules.type) {
            errors.push(`${fieldName} 类型不正确，期望 ${rules.type}`);
        }
        
        if (rules.min && value < rules.min) {
            errors.push(`${fieldName} 不能小于 ${rules.min}`);
        }
        
        if (rules.max && value > rules.max) {
            errors.push(`${fieldName} 不能大于 ${rules.max}`);
        }
        
        if (rules.pattern && !rules.pattern.test(String(value))) {
            errors.push(`${fieldName} 格式不正确`);
        }
        
        if (errors.length > 0) {
            const error = new Error(errors.join(', '));
            error.name = 'ValidationError';
            throw error;
        }
        
        return true;
    }
    
    // 安全执行
    safeExecute(fn, fallback = null, context = {}) {
        try {
            return fn();
        } catch (error) {
            this.handle(error, context);
            return fallback;
        }
    }
    
    // 导出错误报告
    exportErrorReport() {
        return {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            errors: this.errorQueue,
            stats: this.getErrorStats()
        };
    }
}

// 全局暴露ErrorHandler
window.ErrorHandler = ErrorHandler;