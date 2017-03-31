function safeExec(codeStr){
    // 执行content_scripts数组中的脚本，执行域独立于【目标页面】（非popup.html,而是浏览器页面），但是可以获取到【目标页面】中的dom
    try{
        chrome.tabs.executeScript(
            null,
            {
                code: codeStr
            }
        );
    }catch(e){
        console.warn("执行出错",e);
    }
}

let $btnDeal = document.getElementById('u-btn-deal');
let $btnMkdMerge = document.getElementById('u-btn-mkd-merge');
// gen
$btnDeal.addEventListener('click', function(e){
    safeExec("genMarkdown()");
});
// merge
$btnMkdMerge.addEventListener('click', function(e){
    safeExec("doMergeTd()");
});
