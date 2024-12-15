// 初始化语言选择器
function initializeLanguageSelectors() {
    const sourceLang = document.getElementById('sourceLang');
    const targetLang = document.getElementById('targetLang');

    Object.entries(CONFIG.SUPPORTED_LANGUAGES).forEach(([code, name]) => {
        const sourceOption = new Option(name, code);
        const targetOption = new Option(name, code);
        
        sourceLang.add(sourceOption);
        targetLang.add(targetOption);
    });

    // 设置默认值
    sourceLang.value = CONFIG.DEFAULT_SOURCE_LANG;
    targetLang.value = CONFIG.DEFAULT_TARGET_LANG;
}

// 显示状态消息
function showStatus(message, isError = false) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.style.display = 'block';
    status.className = `status ${isError ? 'error' : 'success'}`;
    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
}

// 初始化事件监听
document.addEventListener('DOMContentLoaded', () => {
    initializeLanguageSelectors();

    document.getElementById('translateBtn').addEventListener('click', () => {
        const sourceLang = document.getElementById('sourceLang').value;
        const targetLang = document.getElementById('targetLang').value;

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                files: ['config.js', 'content.js']
            }).then(() => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updateLanguages',
                    sourceLang,
                    targetLang
                });
                showStatus('Translation settings updated!');
            }).catch(error => {
                showStatus('Failed to initialize translator', true);
                console.error(error);
            });
        });
    });
});
