// content.js  
const translations = new Map();  

async function translateText(text) {  
    // 使用翻译 API 进行翻译  
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`);  
    const data = await response.json();  
    return data.responseData.translatedText;  
}  

// 监听选定文本  
document.addEventListener('mouseup', async () => {  
    const selection = window.getSelection();  
    if (selection.rangeCount > 0) {  
        const range = selection.getRangeAt(0);  
        const selectedText = range.toString();  
        if (selectedText) {  
            const translatedText = await translateText(selectedText);  
            const newNode = document.createElement('span');  
            newNode.textContent = translatedText;  
            newNode.style.backgroundColor = '#f0f0f0';  
            newNode.style.color = '#333';  
            newNode.style.padding = '5px 10px';  
            newNode.style.borderRadius = '5px';  
            newNode.style.lineHeight = '1.5';  
            newNode.style.display = 'inline-block';  
            newNode.style.cursor = 'pointer';  
            newNode.dataset.originalText = selectedText;  
            newNode.dataset.translatedText = translatedText;  
            range.deleteContents();  
            range.insertNode(newNode);  
        }  
    }  
});  

// 点击翻译文本返回原文  
document.addEventListener('click', (event) => {  
    if (event.target.tagName === 'SPAN') {  
        const originalText = event.target.dataset.originalText;  
        const translatedText = event.target.dataset.translatedText;  
        if (event.target.textContent === translatedText) {  
            event.target.textContent = originalText;  
        } else {  
            event.target.textContent = translatedText;  
        }  
    }  
});
