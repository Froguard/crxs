// console.log("载入collector.js");
// 初始化
let markStr = "";
let $btnCopy = null;
let $inpName = null;
let time = new Date();
let curTimeStr = `${[time.getFullYear(),leftPad2(time.getMonth()+1),leftPad2(time.getDate())].join("-")}`;

// 一些常量
const ENDL = "\r\n";
const TITLE_TASK = `${ENDL}### 任务列表${ENDL}`;
const TITLE_OTHER = `${ENDL}### 学习调研及其他${ENDL}`;
const TITLE_FAQ = `${ENDL}### 问题记录${ENDL}`;
const PAGE_SPLIT = `${ENDL}&nbsp;${ENDL}`;
// 表格类型边框字符
const FRAME_TABLE_TASK1 = "| 任务描述 | jira  | 责任人 | 开始时间 | 提测时间 | 上线时间 |";
const FRAME_TABLE_TASK2 = "| :---     | :---  | :---   | :---     | :---     | :---     |";
const FRAME_TABLE_OTHER1 = "| 任务描述 | 责任人 | 开始时间 | 结束时间(预估) |";
const FRAME_TABLE_OTHER2 = "| :---     | :---   | :---     | :---           |";
const FRAME_TABLE_FAQ1 = "| 任务描述 | 责任人 |";
const FRAME_TABLE_FAQ2 = "| :---     | :---  |";

// 缩空白
function trim(str){
    return typeof(str) !== "string" ? "" : str.replace(/^(\s|\u00A0|(&nbsp)|`)+/,'').replace(/(\s|\u00A0|(&nbsp)|`)+$/,'');
}

// 去除：行尾逗号
function fmtStr(str){
    return trim(str).replace(/(\.|。|，|,)$/g,"");
}

// 去除：空格，回车，行首序号"1." "  1. " "1·"
function fmtLeft(str){
    return typeof(str) !== "string" ? "" : str.replace(/(\r)|(\n)|(^\s*\d+\s*(\.|·|、|-|(&nbsp;))*\s*)|(^\s+)|(^·)|(^-)|(^、)/g,"");
}

// 两位数补零
function leftPad2(n){
    return String(n).length==2 ? n : ("0" + n);
}

// 判断非法地址
function isMatchedUrl(){
    return !!window.location.href.match(/note.youdao.com\/group\//g);
}

// 警告提示信息
function alertErrorMsg(option){
    option = option || {};
    if(zeroModal){
        zeroModal.error({
            title: option.title || '操作非法',
            content: option.content || '请进到日报表格编辑页面后，再进行操作！',
            contentDetail: option.contentDetail || '非匹配的网址，正确示例如下：<br><p class="ellipsis" title="http://note.youdao.com/group/#/42540264/table/132431912">http://note.youdao.com/group/#/42540264/table/132431912</p>（ESC键关闭弹窗）',
            dragHandle: 'container',
            esc: true,
            ok: true,
            opacity: 0.9
        });
    }else{
        let msg = option.content || `请进到日报表格编辑页面后，再进行操作！${ENDL} Error detail:${ENDL}    非匹配的网址，正确示例如下：${ENDL}    http://note.youdao.com/group/#/42540264/table/132431912`;
        alert(msg);
    }
}

// 收集dom信息，生成中间json数据
function collect(){
    let res = {
        tasks: {
            index: 0,
            title: "",
            list: []
        },
        learnTasks: {
            index: 1,
            title: "",
            list: []
        },
        problems: {
            index: 2,
            title: "",
            list: []
        },
        curObj: null
    };
    res.curObj = res.tasks;
    let $ifCon = $("iframe.table-content");
    let $iframe = $ifCon && $ifCon.eq(0).contents();
    if($ifCon && $ifCon.length){
        let $table = $iframe.find('table.contents').eq(0);
        if($table && $table.length){
            let $trs = $table.find(">tbody>tr");
            let taskRowIndex,learnRowIndex,problemRowIndex;
            $trs && $trs.length && $trs.each(function(index,node){// jQuery的each，此处由于上下文关系，不可使用=>函数
                let $tr = $(this);
                if($tr){
                    let $firstTd = $tr.find("> td:eq(0)");
                    if($firstTd && $firstTd.length){
                        let firstTdHtml = $firstTd.html()+"";
                        // 查找主标题行
                        if(!!~firstTdHtml.indexOf("（一）")){
                            if(taskRowIndex===undefined) {
                                taskRowIndex = index + 1;
                                res.curObj = res.tasks;
                                res.curObj.title = firstTdHtml;
                            }
                        }else if(!!~firstTdHtml.indexOf("（二）")){
                            if(learnRowIndex===undefined) {
                                learnRowIndex = index + 1;
                                res.curObj = res.learnTasks;
                                res.curObj.title = firstTdHtml;
                            }
                        }else if(!!~firstTdHtml.indexOf("（三）")){
                            if(problemRowIndex===undefined) {
                                problemRowIndex = index + 1;
                                res.curObj = res.problems;
                                res.curObj.title = firstTdHtml;
                            }
                        }else{
                            // 排除副标题行
                            if((taskRowIndex!==undefined && index===taskRowIndex)
                                || (learnRowIndex!==undefined && index===learnRowIndex)
                                || (problemRowIndex!==undefined && index===problemRowIndex) ){
                                // 输出副标题行
                                // console.log(`${index+1}行是副标题，跳过`);
                            }else{
                                // 其他行
                                if(""!==trim(firstTdHtml)){//排除空行，首格为空也算空
                                    let $tds = $tr.children("td");
                                    let $description = $tds.eq(1);
                                    let desStr = $description.html();
                                    desStr += "";
                                    if(""!=trim(desStr)){//描述不为空的项才算有效
                                        let $name = $tds.eq(0);
                                        let name = $name && $name.length && $name.html();
                                        let desArr = desStr.split("<br>");
                                        if(res.curObj.index===0){// tasks
                                            let $jira = $tds.eq(2);
                                            let $startTime = $tds.eq(3);
                                            let $testTime = $tds.eq(4);
                                            let $pubTime = $tds.eq(5);
                                            let stArr = ($startTime.length && $startTime.html() || "").split("<br>");
                                            let ttArr = ($testTime.length && $testTime.html() || "").split("<br>");
                                            let ptArr = ($pubTime.length && $pubTime.html() || "").split("<br>");
                                            let jiraArr = ($jira.length && $jira.html() || "").split("<br>");
                                            desArr.forEach((item,index)=>{
                                                res.curObj.list.push({
                                                    name: fmtStr(name + ""),
                                                    description: fmtStr(item + ""),
                                                    startTime: fmtStr(stArr[index] || ""),
                                                    testTime: fmtStr(ttArr[index] || ""),
                                                    pubTime: fmtStr(ptArr[index] || ""),
                                                    jira: fmtStr(jiraArr[index] || "")
                                                });
                                            });
                                        }else if(res.curObj.index===1){// learnTasks
                                            let $startTime1 = $tds.eq(2);
                                            let $endTime1 = $tds.eq(3);
                                            let stArr1 = ($startTime1.length && $startTime1.html() || "").split("<br>");
                                            let etArr1 = ($endTime1.length && $endTime1.html() || "").split("<br>");
                                            desArr.forEach((item,index)=>{
                                                res.curObj.list.push({
                                                    name: fmtStr(name + ""),
                                                    description: fmtStr(item + ""),
                                                    startTime: fmtStr(stArr1[index] || ""),
                                                    endTime: fmtStr(etArr1[index] || "")
                                                });
                                            });
                                        }else if(res.curObj.index===2){// problems
                                            desArr.forEach((item,index)=>{
                                                res.curObj.list.push({
                                                    name: fmtStr(name + ""),
                                                    description: fmtStr(item + "")
                                                });
                                            });
                                        }
                                    }else{
                                        // console.log(`${index+1}行描述为空，判为空行`);
                                    }
                                }else{
                                    // console.log(`${index+1}行名字为空，判为空行`);
                                }
                            }
                        }
                    }
                }
            });
        }else{
            console.warn("table对象为空");
        }
    }else{
        alertErrorMsg({
            title: "非法操作",
            content: "没有找到表格!",
            contentDetail: "请进到表格编辑页在执行操作"
        });
    }

    //
    delete res.curObj;//删除多余属性
    return res;
}

// 通过惊悚。生成markdown字符串
function genMarkStr(midObj){
    midObj = midObj || {};
    // 空的直接返回
    if(!midObj.tasks.list.length && !midObj.learnTasks.list.length && !midObj.tasks.problems.length){
      return "";
    }
    //
    let res = [];
    // 总标题
    if(!$inpName){ $inpName = $(".name-input:eq(0)"); }
    let inputNameVal = ""+ (($inpName && $inpName.val()) || "");
    inputNameVal = inputNameVal.match(/\d{4}-\d{1,2}-\d{1,2}/) ? ("组日报 " + inputNameVal) : inputNameVal;
    // res.push(`${ENDL}## ${inputNameVal || ("组日报"+inputNameVal)} ${ENDL}`);

    // 任务列表
    if(midObj.tasks && midObj.tasks.list && midObj.tasks.list.length){
        // 标题头
        // res.push(PAGE_SPLIT);
        res.push(TITLE_TASK);

        //样式2：表格包起来，此处为表头
        res.push(FRAME_TABLE_TASK1);
        res.push(FRAME_TABLE_TASK2);

        midObj.tasks.list.forEach((item,index)=>{
            //去除：空格，回车，行首序号"1." "  1. " "1·"
            let des = fmtLeft(item.description);
            let jiraLink = "";
            item.jira = item.jira.replace(/&nbsp/g,"");
            if(item.jira!=="" && !item.jira.match(/(无|(没有))(jira)?/)){
                jiraLink = `[${item.jira}](http://jira.netease.com/browse/${item.jira})`;
            }
            if(des!==""){
                // 样式1：序号+内容
                // res.push(`${index+1}. ${des}，${jiraLink||"无jira"}，${item.name}，开始时间 ${item.startTime||"待定"}，提测时间 ${item.testTime||"待定"}，上线时间 ${item.pubTime||"待定"}${ENDL}`);

                // 样式2：表格包起来
                res.push(`| ${des} | ${jiraLink||"无jira"}  | ${item.name} | ${item.startTime||"待定"} | ${item.testTime||"待定"} | ${item.pubTime||"待定"} |`);
            }
        });
    }

    res.push(ENDL);

    // 调研学习
    if(midObj.learnTasks && midObj.learnTasks.list && midObj.learnTasks.list.length){
        // 标题头
        // res.push(PAGE_SPLIT);
        res.push(TITLE_OTHER);

        //样式2：表格包起来，此处为表头
        res.push(FRAME_TABLE_OTHER1);
        res.push(FRAME_TABLE_OTHER2);

        midObj.learnTasks.list.forEach((item,index)=>{
            let des = fmtLeft(item.description);
            if(des!=="") {
                // 样式1：序号+内容
                // res.push(`${index+1}. ${des}，${item.name}，开始时间 ${item.startTime||"待定"}，预计结束时间 ${item.endTime||"待定"}${ENDL}`);

                // 样式2：表格包起来
                res.push(`| ${des} | ${item.name} | ${item.startTime || "待定"} | ${item.endTime || "待定"} |`);
            }
        });
    }
    res.push(ENDL);

    // 问题
    if(midObj.problems && midObj.problems.list && midObj.problems.list.length){
        // 标题头
        // res.push(PAGE_SPLIT);
        res.push(TITLE_FAQ);

        //样式2：表格包起来，此处为表头
        res.push(FRAME_TABLE_FAQ1);
        res.push(FRAME_TABLE_FAQ2);

        midObj.problems.list.forEach((item,index)=>{
            let des = fmtLeft(item.description);
            if(des!=="") {
                // 样式1：序号+内容
                // res.push(`${index+1}. ${des}，${item.name}${ENDL}`);

                // 样式2：表格包起来
                res.push(`| ${des} | ${item.name} |`);
            }
        });
    }
    res.push(ENDL);

    // res.push(PAGE_SPLIT);

    return res.join(ENDL);
}

// 主处理函数
function safeDeal(){
    try{
        let res = collect();
        // console.log(res);
        markStr = genMarkStr(res);
    }catch(e){
        console.warn(e);
        markStr = "";
    }
}

// 标记处今天的日报表格文件
function markTodayTable(){
    let $names = $(".chat-ct .chat-main .filemeta .name");
    if($names && $names.length){
        let today = new Date;
        let tArr = [today.getFullYear(),today.getMonth()+1,today.getDate()];
        let tArr2 = [today.getFullYear(),leftPad2(today.getMonth()+1),leftPad2(today.getDate())];
        let tStr = [tArr.join("-"), tArr.join("/"),tArr2.join("-"), tArr2.join("/")];
        let res = false;
        $names.each(function(){
            let $n = $(this);
            let name = $n.text() || "";
            name = name.split(".")[0];
            // console.log(name);
            if(~tStr.indexOf(name)){
                $n.addClass("z-today");
                res = true;
            }
        });
        return res;
    }else{
        return false;
    }
}

// 初始化
$(()=>{
    console.log("执行init...");
    // btn
    $("body").append("<button id='klrt-btn-copy'>日报</button>");
    $btnCopy = $('#klrt-btn-copy');
    // 非法警告
    $btnCopy.on('click',function(e){
        if(!isMatchedUrl()) {
            alertErrorMsg();
            e.stopPropagation();
            return false;
        }
    });
    // 生成内容 & 拷贝
    if(Clipboard){
        let clipboard = new Clipboard('#klrt-btn-copy', {
            text: function() {
                if(isMatchedUrl()){
                    safeDeal();
                    markStr = markStr || "";
                }else{
                    markStr = "";//空字符传不会拷贝
                }
                if(!markStr){
                    alertErrorMsg();
                }
                return markStr;
            }
        });
        clipboard.on('success', function(e) {
            if(zeroModal){
                zeroModal.success({
                    title: '操作成功',
                    content: '内容markdown格式已拷贝至剪切板！',
                    contentDetail: 'Ctrl(Cmd)+V进行粘贴值markdown<br>（ESC键关闭弹窗）。',
                    dragHandle: 'container',
                    esc: true,
                    ok: true,
                    opacity: 0.9
                });
            }else{
                alert("内容markdown格式已经拷贝至剪切板！");
            }

            console.log("markdown内容已经拷贝至剪切板！");
        });
        clipboard.on('error', function(e) {
            if(zeroModal){
                zeroModal.success({
                    title: '操作失败',
                    content: '生成markdown内容失败，请重试',
                    dragHandle: 'container',
                    esc: true,
                    ok: true,
                    opacity: 0.9
                });
            }else{
                alert("拷贝失败！");
            }
            console.log("拷贝失败！",e);
        });
    }else{
        alert("Error to load Clipboard.js!");
        $btnCopy.hide();
    }

    // 右键处理菜单功能
    if($btnCopy.contextPopup){
        $btnCopy.contextPopup({
            // title: '合成后处理',
            items: [
                {
                    label: '合并表头单元格',
                    icon: 'https://g.hz.netease.com/hzwangfei3/klReportTool/raw/f8af58450bdb20c8dacd039cc1b54d63c67f7d72/klReportTool/icon.png',
                    action: function(e) {
                        // defined in diyMarkdown.js
                        doMergeTdInMainPage();
                        if(e){
                            e.stopPropagation && e.stopPropagation();
                            e.cancelBubble && (e.cancelBubble = true);
                            e.returnValue && (e.returnValue = false);
                        }
                        return false;
                    }
                },
                // null, // 分割线
                // {label:'Onwards',       icon:'icons/application-table.png',           action:function() { alert('clicked 7') } },
            ]
        });
    }else{
        alert("Error to load contextMenu.js!");
    }

    // 高亮标记今天的日报
    let mkCount = 50;
    let mkTodayTimer = setInterval(()=>{
        if(markTodayTable() || (mkCount--) <= 0 ){
            clearInterval(mkTodayTimer);
            mkTodayTimer = null;
        }
    },100);

});




/**
 * genMarkdown函数，主要供popup使用
 */
function genMarkdown(){
    // check
    if(!isMatchedUrl()) {
        alertErrorMsg();
        return false;
    }
    // do gen
    safeDeal();
    // set to cilpBoard
    if(markStr!=="" && markStr!==failedStr){
        $btnCopy.click();
    }else{
        console.log("空字符串");
    }
}
