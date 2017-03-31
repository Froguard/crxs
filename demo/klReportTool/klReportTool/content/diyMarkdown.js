// console.log("载入diyMarkdown.js");

// 合并单元格，读取td中如果含有<code>字样，则表示其实它是一个表头
function mergeSummaryTd($tables){
    // console.log($tables);
    if($tables && $tables.length && $tables.each){
        $tables.each(function(){
            let $tableItem = $(this);
            let $trs = $tableItem.find("> tbody > tr");
            // console.log($trs);
            $trs && $trs.length && $trs.each(function(){
                let $tr = $(this);
                let $tds = $tr.children("td");
                // console.log($tds);
                if($tds && $tds.length>=2){ //2个以上才有合并意义
                    let tdCount = $tds.length;
                    let $firstTd = $tds.eq(0);
                    // console.log($firstTd);
                    if($firstTd && $firstTd.length){
                        if($firstTd.children("code").length){
                            $firstTd.attr("colspan",tdCount).addClass("u-td-hd").siblings("td").remove();
                        }
                    }
                }
            });
        });
    }else{
        return false;
    }
}

// 针对父页面包含markdown内容的iframe
function doMergeTdInMainPage(){
    let $ifMD = $("iframe.md-editor-preview-frame:eq(0)"); // 预览模式
    let isMdExisited = true;
    if(!($ifMD && $ifMD.length)){//
        $ifMD = $("iframe.md-editor-frame:eq(0)"); // 编辑模式
        isMdExisited = $ifMD && $ifMD.length;
    }
    if(!isMdExisited){
        console.log("未找到markdown对应的iframe页面！");
        return false;
    }else{
        let $iframeMdContent = $ifMD.contents();
        let $mdTables = $iframeMdContent.find("table");
        if($mdTables && $mdTables.length){
            // 合并表头td（设置colspan）
            mergeSummaryTd($mdTables);
            console.info("在主框架页合并表头！");// 在预览页，markdown也内嵌在iframe
            return true;
        }else{
            console.log("未找到iframe页面中的table！");
            return false;
        }
    }
}

// 针对markdown内容的iframe单独执行
function doMergeTdInIframePage(){
    let $tables = $("table");
    if($tables && $tables.length){
        console.info("在独立markdown页面（预览页或编辑页）合并表头！");// 在预览页，不存在iframe，可以直接更改
        mergeSummaryTd($tables);
        return true;
    }else{
        console.log("未找到页面中的table！");
        return false;
    }
}

let hasInit = false;
let url = window.location.href;
let isPreviewPage = url.match(/http(s?):\/\/note.youdao.com\/md\/preview\/preview.html\?file=/);
let isEditPage =  url.match(/http(s?):\/\/note.youdao.com\/md\//)
               || url.match(/http(s?):\/\/note.youdao.com\/group\/#\/md\//);
let isMainPage = !isPreviewPage && !isEditPage;

let initCount = 0;
const maxInitCount = 10;
// 循环刷
function loopInit(){
    window.__klr_mergeTdTimer = setInterval(function(){
        if(!hasInit && initCount++ < maxInitCount){
            let $mkdView = $(".markdown-body");
            // let $aceEditor = $(".ace_editor");
            if(isPreviewPage || isEditPage || ($mkdView && $mkdView.length)){
                hasInit = doMergeTdInIframePage();
            }else{
                // 具体初始化在iframe里面自己做，父页面就不重复刷新了
                // hasInit = doMergeTdInMainPage();
            }
        }else{
            console.log("clearInterval...");
            window.clearInterval(window.__klr_mergeTdTimer);
            window.__mergeTdTimer = null;
        }
    },400);
}

// init

$(()=>{
    console.log("执行init...");
    // start do mergeTd
    loopInit();
    // let $mkdView = $(".markdown-body");
    // let $aceEditor = $(".ace_editor");
    // add listener
    // if(isEditPage || ($mkdView && $mkdView.length && $aceEditor && $aceEditor.length)){
        $(document).on("keydown keyup input change blur",".ace_text-input",function(e){
            window.__klr_inputTimer && window.clearTimeout(window.__klr_inputTimer);
            window.__klr_inputTimer = setTimeout(function(){
                doMergeTdInIframePage();
            },500);
        });
    // }
});




/**
 * doMergeTd函数，主要供popup使用
 */
function doMergeTd(){
    if(isMainPage){
        doMergeTdInMainPage();
    }else{
        doMergeTdInIframePage();
    }
}