// content.js  
const translations = new Map();  

// 引入防抖函数
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// 翻译缓存
class TranslationCache {
    constructor() {
        this.cache = new Map();
    }

    getKey(text, sourceLang, targetLang) {
        return `${text}:${sourceLang}-${targetLang}`;
    }

    get(text, sourceLang, targetLang) {
        const key = this.getKey(text, sourceLang, targetLang);
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
            return cached.translation;
        }
        return null;
    }

    set(text, translation, sourceLang, targetLang) {
        const key = this.getKey(text, sourceLang, targetLang);
        this.cache.set(key, {
            translation,
            timestamp: Date.now()
        });
    }
}

const translationCache = new TranslationCache();

// 语言检测函数
function detectLanguage(text) {
    // 简单的语言检测：如果包含中文字符则认为是中文
    const containsChinese = /[\u4e00-\u9fa5]/.test(text);
    return containsChinese ? 'zh' : 'en';
}

// 更新翻译函数
async function translateText(text) {
    try {
        const sourceLang = detectLanguage(text);
        const targetLang = sourceLang === 'zh' ? 'en' : 'zh';

        // 检查缓存
        const cached = translationCache.get(text, sourceLang, targetLang);
        if (cached) return cached;

        // 显示加载状态
        showLoadingIndicator();

        const response = await fetch(
            `${CONFIG.API_ENDPOINT}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const translatedText = data.responseData.translatedText;

        // 存入缓存
        translationCache.set(text, translatedText, sourceLang, targetLang);

        return translatedText;
    } catch (error) {
        console.error('Translation error:', error);
        showError('Translation failed. Please try again later.');
        return text; // 返回原文
    } finally {
        hideLoadingIndicator();
    }
}

// UI 相关函数
function showLoadingIndicator() {
    const loader = document.createElement('div');
    loader.id = 'translation-loader';
    loader.innerHTML = '翻译中...';
    loader.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(loader);
}

function hideLoadingIndicator() {
    const loader = document.getElementById('translation-loader');
    if (loader) loader.remove();
}

function showError(message) {
    const error = document.createElement('div');
    error.innerHTML = message;
    error.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #ff4444;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        z-index: 10000;
    `;
    document.body.appendChild(error);
    setTimeout(() => error.remove(), 3000);
}

// 更新创建翻译节点函数
function createTranslatedNode(originalText, translatedText) {
    const newNode = document.createElement('span');
    newNode.textContent = translatedText;
    newNode.className = 'translated-text';
    newNode.style.cssText = `
        background-color: #f0f0f0;
        color: #333;
        padding: 5px 10px;
        border-radius: 5px;
        line-height: 1.5;
        display: inline-block;
        cursor: pointer;
        position: relative;
        margin: 0 2px;
        border: 1px solid #ddd;
        user-select: none;
    `;
    
    // 存储当前文本和其翻译
    newNode.dataset.currentText = originalText;
    newNode.dataset.translation = translatedText;

    // 双击事件处理
    newNode.addEventListener('dblclick', async function(e) {
        e.stopPropagation();
        
        try {
            showLoadingIndicator();
            // 获取当前显示的文本
            const textToTranslate = this.dataset.currentText;
            // 获取新翻译
            const newTranslation = await translateText(textToTranslate);
            
            // 更新数据集和显示
            this.dataset.currentText = textToTranslate;
            this.dataset.translation = newTranslation;
            this.textContent = newTranslation;
            
            // 交换当前文本和翻译
            [this.dataset.currentText, this.dataset.translation] = 
                [this.dataset.translation, this.dataset.currentText];
            
        } catch (error) {
            console.error('Translation error:', error);
            showError('翻译失败，请重试');
        } finally {
            hideLoadingIndicator();
        }
    });

    // 添加悬停提示
    newNode.title = '双击切换语言 / Double click to switch language';

    return newNode;
}

// 更新选择文本事件处理函数
const handleSelection = debounce(async () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString().trim();
        
        // 检查是否有效的选择
        if (!selectedText || selectedText.length < 1) {
            return;
        }

        // 检查选中的文本是否已经是翻译节点
        const parentNode = range.commonAncestorContainer.parentNode;
        if (parentNode.classList && parentNode.classList.contains('translated-text')) {
            return;
        }

        try {
            showLoadingIndicator();
            const translatedText = await translateText(selectedText);
            const newNode = createTranslatedNode(selectedText, translatedText);
            
            // 替换选中的文本
            range.deleteContents();
            range.insertNode(newNode);
            
            // 清除选择
            selection.removeAllRanges();
        } catch (error) {
            console.error('Translation error:', error);
            showError('翻译失败，请重试');
        } finally {
            hideLoadingIndicator();
        }
    }
}, CONFIG.DEBOUNCE_DELAY);

// 改为监听双击事件
document.removeEventListener('mouseup', handleSelection);
document.addEventListener('dblclick', handleSelection);
