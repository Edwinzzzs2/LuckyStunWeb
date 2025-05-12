// PWA安装提示脚本

// 存储安装事件
let deferredPrompt;

// 创建安装按钮的HTML
function createInstallButton() {
    const installBtnContainer = document.createElement('div');
    installBtnContainer.id = 'install-app-container';
    installBtnContainer.style.position = 'fixed';
    installBtnContainer.style.bottom = '20px';
    installBtnContainer.style.right = '20px';
    installBtnContainer.style.zIndex = '9999';
    installBtnContainer.style.display = 'none';

    const installBtn = document.createElement('button');
    installBtn.id = 'install-app-btn';
    installBtn.innerText = '添加到主屏幕';
    installBtn.style.backgroundColor = '#2c2e2f';
    installBtn.style.color = 'white';
    installBtn.style.border = 'none';
    installBtn.style.borderRadius = '4px';
    installBtn.style.padding = '10px 15px';
    installBtn.style.cursor = 'pointer';
    installBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    
    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerText = '×';
    closeBtn.style.backgroundColor = 'transparent';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '-10px';
    closeBtn.style.right = '-10px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.width = '25px';
    closeBtn.style.height = '25px';
    closeBtn.style.borderRadius = '50%';
    closeBtn.style.lineHeight = '20px';
    closeBtn.style.background = '#666';
    
    closeBtn.onclick = function() {
        document.getElementById('install-app-container').style.display = 'none';
        // 记住用户选择不再显示提示
        localStorage.setItem('pwaInstallDismissed', 'true');
    };
    
    installBtnContainer.appendChild(installBtn);
    installBtnContainer.appendChild(closeBtn);
    document.body.appendChild(installBtnContainer);
    
    return installBtn;
}

// 注册PWA安装事件处理
window.addEventListener('beforeinstallprompt', (e) => {
    // 阻止Chrome 67及更早版本自动显示安装提示
    e.preventDefault();
    // 保存事件，以便稍后触发
    deferredPrompt = e;
    
    // 检查用户是否已经关闭过提示
    if (localStorage.getItem('pwaInstallDismissed') !== 'true') {
        // 延迟显示安装按钮，给用户一些时间浏览网站
        setTimeout(() => {
            const installBtn = document.getElementById('install-app-btn') || createInstallButton();
            document.getElementById('install-app-container').style.display = 'block';
            
            installBtn.addEventListener('click', (e) => {
                // 隐藏安装按钮
                document.getElementById('install-app-container').style.display = 'none';
                // 显示安装提示
                deferredPrompt.prompt();
                // 等待用户响应
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('用户已接受安装应用');
                    } else {
                        console.log('用户已拒绝安装应用');
                    }
                    // 清除保存的提示，因为它只能使用一次
                    deferredPrompt = null;
                });
            });
        }, 30000); // 30秒后显示提示
    }
});

// 检测已安装的应用
window.addEventListener('appinstalled', (evt) => {
    console.log('应用已安装到主屏幕');
    // 隐藏安装按钮
    if (document.getElementById('install-app-container')) {
        document.getElementById('install-app-container').style.display = 'none';
    }
    // 记录安装状态
    localStorage.setItem('pwaInstalled', 'true');
}); 