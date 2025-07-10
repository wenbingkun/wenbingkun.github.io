/**
 * 文件处理器 - 安全的文件处理和验证
 * 解决原版本文件处理安全性和错误处理不足的问题
 */
class FileHandler {
    constructor(errorHandler = null) {
        this.errorHandler = errorHandler;
        
        // 文件类型配置
        this.fileTypes = {
            audio: {
                extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'mp4'],
                mimeTypes: [
                    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
                    'audio/aac', 'audio/flac', 'video/mp4'
                ],
                maxSize: 500 * 1024 * 1024, // 500MB
                validator: this.validateAudioFile.bind(this)
            },
            lyrics: {
                extensions: ['lrc', 'txt'],
                mimeTypes: ['text/plain', 'application/octet-stream'],
                maxSize: 10 * 1024 * 1024, // 10MB
                validator: this.validateLyricsFile.bind(this)
            },
            image: {
                extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
                mimeTypes: [
                    'image/jpeg', 'image/png', 'image/gif',
                    'image/webp', 'image/bmp'
                ],
                maxSize: 50 * 1024 * 1024, // 50MB
                validator: this.validateImageFile.bind(this)
            }
        };
        
        // 危险文件扩展名黑名单
        this.dangerousExtensions = [
            'exe', 'com', 'bat', 'cmd', 'scr', 'pif', 'vbs', 'js', 'jar',
            'app', 'deb', 'pkg', 'dmg', 'run', 'msi', 'dll', 'sys'
        ];
        
        // 支持的编码
        this.supportedEncodings = ['UTF-8', 'UTF-16', 'GBK', 'GB2312'];
    }
    
    // 验证文件
    async validateFile(file, expectedType = null) {
        try {
            // 基本验证
            if (!file || !file.name) {
                throw new Error('无效的文件对象');
            }
            
            // 文件名安全检查
            this.validateFileName(file.name);
            
            // 文件大小检查
            this.validateFileSize(file, expectedType);
            
            // 文件类型验证
            const fileType = this.detectFileType(file);
            
            if (expectedType && fileType !== expectedType) {
                throw new Error(`期望文件类型 ${expectedType}，但检测到 ${fileType}`);
            }
            
            // 文件内容验证
            await this.validateFileContent(file, fileType);
            
            return {
                valid: true,
                type: fileType,
                file,
                metadata: this.extractMetadata(file)
            };
            
        } catch (error) {
            this.handleError(error, { operation: 'validateFile', fileName: file?.name });
            return {
                valid: false,
                error: error.message,
                file
            };
        }
    }
    
    // 批量验证文件
    async validateFiles(files, expectedType = null) {
        const results = [];
        const batchSize = 5; // 每批处理5个文件
        
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const batchPromises = batch.map(file => this.validateFile(file, expectedType));
            
            try {
                const batchResults = await Promise.allSettled(batchPromises);
                
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    } else {
                        results.push({
                            valid: false,
                            error: result.reason.message,
                            file: batch[index]
                        });
                    }
                });
            } catch (error) {
                this.handleError(error, { operation: 'validateFiles', batchIndex: i / batchSize });
            }
            
            // 添加小延迟，避免阻塞UI
            if (i + batchSize < files.length) {
                await this.delay(10);
            }
        }
        
        return results;
    }
    
    // 读取文件内容
    async readFile(file, options = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const timeout = options.timeout || 30000; // 30秒超时
            
            let timeoutId = setTimeout(() => {
                reader.abort();
                reject(new Error('文件读取超时'));
            }, timeout);
            
            reader.onload = (event) => {
                clearTimeout(timeoutId);
                resolve(event.target.result);
            };
            
            reader.onerror = (event) => {
                clearTimeout(timeoutId);
                reject(new Error(`文件读取失败: ${event.target.error}`));
            };
            
            reader.onabort = () => {
                clearTimeout(timeoutId);
                reject(new Error('文件读取被中断'));
            };
            
            // 根据选项选择读取方式
            if (options.readAs === 'dataURL') {
                reader.readAsDataURL(file);
            } else if (options.readAs === 'arrayBuffer') {
                reader.readAsArrayBuffer(file);
            } else {
                // 文本文件尝试不同编码
                const encoding = options.encoding || 'UTF-8';
                reader.readAsText(file, encoding);
            }
        });
    }
    
    // 读取文本文件（支持多种编码）
    async readTextFile(file, options = {}) {
        const encodings = options.encodings || this.supportedEncodings;
        
        for (const encoding of encodings) {
            try {
                const content = await this.readFile(file, { encoding, ...options });
                
                // 验证内容是否可读
                if (this.isValidText(content)) {
                    return {
                        content,
                        encoding,
                        success: true
                    };
                }
            } catch (error) {
                // 继续尝试下一种编码
                continue;
            }
        }
        
        throw new Error('无法使用任何支持的编码读取文件');
    }
    
    // 验证文件名
    validateFileName(fileName) {
        if (!fileName || typeof fileName !== 'string') {
            throw new Error('文件名无效');
        }
        
        // 检查文件名长度
        if (fileName.length > 255) {
            throw new Error('文件名过长');
        }
        
        // 检查危险字符
        const dangerousChars = /[<>:"|?*\x00-\x1f]/;
        if (dangerousChars.test(fileName)) {
            throw new Error('文件名包含不安全字符');
        }
        
        // 检查危险扩展名
        const extension = this.getFileExtension(fileName);
        if (this.dangerousExtensions.includes(extension)) {
            throw new Error('不支持的文件类型');
        }
        
        return true;
    }
    
    // 验证文件大小
    validateFileSize(file, expectedType = null) {
        if (file.size === 0) {
            throw new Error('文件为空');
        }
        
        if (expectedType && this.fileTypes[expectedType]) {
            const maxSize = this.fileTypes[expectedType].maxSize;
            if (file.size > maxSize) {
                throw new Error(`文件过大，最大支持 ${this.formatFileSize(maxSize)}`);
            }
        }
        
        return true;
    }
    
    // 检测文件类型
    detectFileType(file) {
        const extension = this.getFileExtension(file.name);
        
        for (const [type, config] of Object.entries(this.fileTypes)) {
            if (config.extensions.includes(extension)) {
                return type;
            }
        }
        
        // 根据MIME类型检测
        for (const [type, config] of Object.entries(this.fileTypes)) {
            if (config.mimeTypes.includes(file.type)) {
                return type;
            }
        }
        
        throw new Error(`不支持的文件类型: ${extension}`);
    }
    
    // 验证文件内容
    async validateFileContent(file, fileType) {
        const config = this.fileTypes[fileType];
        if (config && config.validator) {
            return await config.validator(file);
        }
        return true;
    }
    
    // 验证音频文件
    async validateAudioFile(file) {
        // 创建临时音频元素验证
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            const url = URL.createObjectURL(file);
            
            const cleanup = () => {
                URL.revokeObjectURL(url);
                audio.remove();
            };
            
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('音频文件验证超时'));
            }, 10000);
            
            audio.onloadedmetadata = () => {
                clearTimeout(timeout);
                cleanup();
                
                // 检查音频时长
                if (audio.duration === 0 || isNaN(audio.duration)) {
                    reject(new Error('音频文件可能已损坏'));
                } else {
                    resolve(true);
                }
            };
            
            audio.onerror = () => {
                clearTimeout(timeout);
                cleanup();
                reject(new Error('音频文件格式不支持或已损坏'));
            };
            
            audio.src = url;
        });
    }
    
    // 验证歌词文件
    async validateLyricsFile(file) {
        try {
            const result = await this.readTextFile(file);
            const content = result.content;
            
            // 检查是否为空
            if (!content.trim()) {
                throw new Error('歌词文件为空');
            }
            
            // 检查LRC格式
            if (file.name.toLowerCase().endsWith('.lrc')) {
                this.validateLrcFormat(content);
            }
            
            return true;
        } catch (error) {
            throw new Error(`歌词文件验证失败: ${error.message}`);
        }
    }
    
    // 验证图片文件
    async validateImageFile(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            const cleanup = () => {
                URL.revokeObjectURL(url);
            };
            
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('图片文件验证超时'));
            }, 10000);
            
            img.onload = () => {
                clearTimeout(timeout);
                cleanup();
                
                // 检查图片尺寸
                if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                    reject(new Error('图片文件可能已损坏'));
                } else {
                    resolve(true);
                }
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                cleanup();
                reject(new Error('图片文件格式不支持或已损坏'));
            };
            
            img.src = url;
        });
    }
    
    // 验证LRC格式
    validateLrcFormat(content) {
        const lines = content.split('\n');
        let hasTimeTag = false;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            // 检查时间标签格式
            const timeMatch = trimmedLine.match(/\[(\d+):(\d+)(?:\.(\d+))?\]/);
            if (timeMatch) {
                hasTimeTag = true;
                
                const minutes = parseInt(timeMatch[1]);
                const seconds = parseInt(timeMatch[2]);
                
                if (minutes < 0 || seconds < 0 || seconds >= 60) {
                    throw new Error(`无效的时间标签: ${timeMatch[0]}`);
                }
            }
        }
        
        if (!hasTimeTag) {
            throw new Error('LRC文件必须包含时间标签');
        }
        
        return true;
    }
    
    // 检查文本是否有效
    isValidText(text) {
        if (typeof text !== 'string') return false;
        
        // 检查是否包含大量不可打印字符
        const printableChars = text.replace(/[\x00-\x1F\x7F-\x9F]/g, '').length;
        const totalChars = text.length;
        
        return totalChars === 0 || (printableChars / totalChars) > 0.8;
    }
    
    // 获取文件扩展名
    getFileExtension(fileName) {
        const lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.slice(lastDot + 1).toLowerCase() : '';
    }
    
    // 提取文件元数据
    extractMetadata(file) {
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            extension: this.getFileExtension(file.name),
            sizeFormatted: this.formatFileSize(file.size)
        };
    }
    
    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // 文件分组
    groupFilesByType(files) {
        const groups = {
            audio: [],
            lyrics: [],
            image: [],
            unknown: []
        };
        
        files.forEach(file => {
            try {
                const type = this.detectFileType(file);
                groups[type].push(file);
            } catch (error) {
                groups.unknown.push(file);
            }
        });
        
        return groups;
    }
    
    // 文件去重
    deduplicateFiles(files) {
        const seen = new Set();
        const unique = [];
        
        files.forEach(file => {
            const key = `${file.name}_${file.size}_${file.lastModified}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(file);
            }
        });
        
        return unique;
    }
    
    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // 错误处理
    handleError(error, context) {
        if (this.errorHandler) {
            this.errorHandler.handle(error, {
                type: this.errorHandler.errorTypes.FILE_READ,
                ...context
            });
        } else {
            console.error('FileHandler error:', error, context);
        }
    }
    
    // 获取支持的文件类型信息
    getSupportedTypes() {
        const result = {};
        
        for (const [type, config] of Object.entries(this.fileTypes)) {
            result[type] = {
                extensions: config.extensions,
                maxSize: config.maxSize,
                maxSizeFormatted: this.formatFileSize(config.maxSize)
            };
        }
        
        return result;
    }
}

// 全局暴露FileHandler
window.FileHandler = FileHandler;