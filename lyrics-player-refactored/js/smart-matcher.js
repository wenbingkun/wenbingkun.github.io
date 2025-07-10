/**
 * 智能文件匹配器 - 自动匹配音频和歌词文件
 * 基于原版本的复杂匹配算法重构
 */
class SmartMatcher {
    constructor() {
        // 匹配配置
        this.config = {
            minSimilarity: 0.6, // 最小相似度阈值
            exactMatchBonus: 0.5, // 精确匹配奖励
            lengthPenalty: 0.1, // 长度差异惩罚因子
            commonWordsBonus: 0.2, // 常见词汇匹配奖励
            sequenceBonus: 0.3 // 序列匹配奖励
        };
        
        // 常见的分隔符和标记
        this.separators = /[\s\-_\.、，()（）【】\[\]~`!@#$%^&*+=|:;'"<>?]+/g;
        this.numberPattern = /\d+/g;
        
        // 常见的歌曲标记词汇
        this.commonTags = [
            'official', 'mv', 'video', 'audio', 'hd', 'hq',
            '官方', '正式版', '完整版', '高清', '高音质',
            'feat', 'ft', 'remix', 'cover', 'live',
            '现场版', '翻唱', '伴奏', '纯音乐'
        ];
    }
    
    // 主要匹配方法：为音频文件找到最佳歌词匹配
    findBestMatch(audioName, songList) {
        if (!songList || songList.length === 0) {
            return null;
        }
        
        const normalizedAudio = this.normalizeForMatching(audioName);
        let bestMatch = null;
        let bestScore = 0;
        
        for (const song of songList) {
            const score = this.calculateMatchScore(normalizedAudio, song.name);
            
            if (score > bestScore && score >= this.config.minSimilarity) {
                bestScore = score;
                bestMatch = song;
            }
        }
        
        return bestMatch ? { song: bestMatch, score: bestScore } : null;
    }
    
    // 批量匹配：为多个音频文件找匹配
    batchMatch(audioFiles, songList) {
        const results = [];
        const availableSongs = [...songList]; // 复制列表避免修改原始数据
        
        // 先进行精确匹配
        for (const audioFile of audioFiles) {
            const audioName = audioFile.name.replace(/\.[^/.]+$/, "");
            const exactMatch = this.findExactMatch(audioName, availableSongs);
            
            if (exactMatch) {
                results.push({
                    audioFile,
                    matchedSong: exactMatch,
                    matchType: 'exact',
                    score: 1.0
                });
                
                // 从可用列表中移除已匹配的歌曲
                const index = availableSongs.indexOf(exactMatch);
                if (index > -1) {
                    availableSongs.splice(index, 1);
                }
            }
        }
        
        // 然后进行模糊匹配（只处理未精确匹配的音频文件）
        const unmatchedAudio = audioFiles.filter(file => 
            !results.some(r => r.audioFile === file)
        );
        
        const remainingSongs = availableSongs.filter(song => 
            !results.some(r => r.matchedSong === song)
        );

        for (const audioFile of unmatchedAudio) {
            const audioName = audioFile.name.replace(/\.[^/.]+$/, "");
            const fuzzyMatch = this.findBestMatch(audioName, remainingSongs);
            
            if (fuzzyMatch) {
                results.push({
                    audioFile,
                    matchedSong: fuzzyMatch.song,
                    matchType: 'fuzzy',
                    score: fuzzyMatch.score
                });
                
                // 从可用列表中移除已匹配的歌曲
                const index = remainingSongs.indexOf(fuzzyMatch.song);
                if (index > -1) {
                    remainingSongs.splice(index, 1);
                }
            } else {
                results.push({
                    audioFile,
                    matchedSong: null,
                    matchType: 'none',
                    score: 0
                });
            }
        }
        
        return results;
    }
    
    // 精确匹配
    findExactMatch(audioName, songList) {
        const normalizedAudio = this.normalizeForMatching(audioName);
        
        for (const song of songList) {
            if (song.audioFile) continue;
            
            const normalizedSong = this.normalizeForMatching(song.name);
            
            if (normalizedAudio === normalizedSong) {
                return song;
            }
        }
        
        return null;
    }
    
    // 计算匹配分数
    calculateMatchScore(audioName, songName) {
        const normalizedSong = this.normalizeForMatching(songName);
        
        // 1. 精确匹配检查
        if (audioName === normalizedSong) {
            return 1.0;
        }
        
        // 2. 计算基础相似度
        const similarity = this.calculateSimilarity(audioName, normalizedSong);
        
        // 3. 计算各种奖励和惩罚
        let score = similarity;
        
        // 长度差异惩罚
        const lengthDiff = Math.abs(audioName.length - normalizedSong.length);
        const maxLength = Math.max(audioName.length, normalizedSong.length);
        const lengthPenalty = (lengthDiff / maxLength) * this.config.lengthPenalty;
        score -= lengthPenalty;
        
        // 常见词汇匹配奖励
        const commonWordsBonus = this.calculateCommonWordsBonus(audioName, normalizedSong);
        score += commonWordsBonus;
        
        // 数字序列匹配奖励
        const numberBonus = this.calculateNumberBonus(audioName, normalizedSong);
        score += numberBonus;
        
        // 确保分数在0-1范围内
        return Math.max(0, Math.min(1, score));
    }
    
    // 计算字符串相似度（使用编辑距离）
    calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        
        if (len1 === 0) return len2 === 0 ? 1 : 0;
        if (len2 === 0) return 0;
        
        // 创建动态规划矩阵
        const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
        
        // 初始化矩阵
        for (let i = 0; i <= len1; i++) matrix[i][0] = i;
        for (let j = 0; j <= len2; j++) matrix[0][j] = j;
        
        // 填充矩阵
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,     // 删除
                    matrix[i][j - 1] + 1,     // 插入
                    matrix[i - 1][j - 1] + cost // 替换
                );
            }
        }
        
        const distance = matrix[len1][len2];
        const maxLength = Math.max(len1, len2);
        
        return 1 - (distance / maxLength);
    }
    
    // 计算常见词汇匹配奖励
    calculateCommonWordsBonus(str1, str2) {
        const words1 = str1.split(/\s+/).filter(word => word.length > 1);
        const words2 = str2.split(/\s+/).filter(word => word.length > 1);
        
        if (words1.length === 0 || words2.length === 0) return 0;
        
        let matchedWords = 0;
        
        for (const word1 of words1) {
            for (const word2 of words2) {
                if (word1 === word2 || this.calculateSimilarity(word1, word2) > 0.8) {
                    matchedWords++;
                    break;
                }
            }
        }
        
        const ratio = matchedWords / Math.max(words1.length, words2.length);
        return ratio * this.config.commonWordsBonus;
    }
    
    // 计算数字序列匹配奖励
    calculateNumberBonus(str1, str2) {
        const numbers1 = str1.match(this.numberPattern) || [];
        const numbers2 = str2.match(this.numberPattern) || [];
        
        if (numbers1.length === 0 && numbers2.length === 0) return 0;
        if (numbers1.length === 0 || numbers2.length === 0) return -0.1;
        
        let matchedNumbers = 0;
        
        for (const num1 of numbers1) {
            if (numbers2.includes(num1)) {
                matchedNumbers++;
            }
        }
        
        const ratio = matchedNumbers / Math.max(numbers1.length, numbers2.length);
        return ratio * this.config.sequenceBonus;
    }
    
    // 标准化文件名用于匹配
    normalizeForMatching(filename) {
        if (!filename) return '';
        
        // 移除文件扩展名
        let normalized = filename.replace(/\.[^/.]+$/, '');
        
        // 转换为小写
        normalized = normalized.toLowerCase();
        
        // 移除常见标记
        for (const tag of this.commonTags) {
            const regex = new RegExp(`\\b${tag}\\b`, 'gi');
            normalized = normalized.replace(regex, '');
        }
        
        // 统一分隔符为空格
        normalized = normalized.replace(this.separators, ' ');
        
        // 移除多余空格
        normalized = normalized.replace(/\s+/g, ' ').trim();
        
        return normalized;
    }
    
    // 获取匹配统计信息
    getMatchingStats(results) {
        const stats = {
            total: results.length,
            exact: 0,
            fuzzy: 0,
            unmatched: 0,
            averageScore: 0
        };
        
        let totalScore = 0;
        
        for (const result of results) {
            switch (result.matchType) {
                case 'exact':
                    stats.exact++;
                    break;
                case 'fuzzy':
                    stats.fuzzy++;
                    break;
                case 'none':
                    stats.unmatched++;
                    break;
            }
            
            totalScore += result.score;
        }
        
        stats.averageScore = results.length > 0 ? totalScore / results.length : 0;
        
        return stats;
    }
    
    // 验证匹配质量
    validateMatch(audioName, songName, threshold = null) {
        const usedThreshold = threshold || this.config.minSimilarity;
        const score = this.calculateMatchScore(
            this.normalizeForMatching(audioName),
            songName
        );
        
        return {
            isValid: score >= usedThreshold,
            score: score,
            confidence: this.getConfidenceLevel(score)
        };
    }
    
    // 获取置信度等级
    getConfidenceLevel(score) {
        if (score >= 0.9) return 'very_high';
        if (score >= 0.8) return 'high';
        if (score >= 0.7) return 'medium';
        if (score >= 0.6) return 'low';
        return 'very_low';
    }
}

// 全局暴露SmartMatcher
window.SmartMatcher = SmartMatcher;