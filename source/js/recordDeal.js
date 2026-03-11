function eventInit(){
    try{
        LOADED_VERSION = versionInfo.latest_version;
        printLog("当前版本：",LOADED_VERSION);
        $("title").text(PROJECT_NAME);
        $("#navTitle #pageTopTitle").html(PROJECT_NAME);
        initDarkMode();
        //获取用户偏好 - 主题色
        let userThemeColorPrefer = getUserPreferance("system_theme_color_prefer");
        //弹窗中回显用户当前主题色选择（默认为蓝色BLUE）
        if(!notNull(userThemeColorPrefer)
            || typeof userThemeColorPrefer !== "string" 
            || userThemeColorPrefer.trim() === ""
            || !THEME_COLOR_OPTION.some(item => item.value === userThemeColorPrefer)
          ){
                userThemeColorPrefer = "blueTheme";
        }else{
            const sysColorItem = THEME_COLOR_OPTION.find(item => item.value === userThemeColorPrefer);
            if(sysColorItem){
                $("html").css("--themeColor",sysColorItem.color);
            }
        }

        listenPageBack();
        let crtData = getLocalRecordData();
        let crtDataExist = checkRecordData(1,crtData);
        
        updateUploadFileMethod();
        $("#nodataUploadFileBtn").off("click").on("click",function(){$("#txtFileUpload").click();});
        $("#reUploadBtn").click(function(){$("#txtFileUpload").click();});


        $(".winActionBtnItem.action1Btn.cancelBtn, #IKCloseBtn, .closeWinIcon").off("click").on("click",function(){closeAllWin();});
        $("#searchClose").click(function(){cancelSearch();});
        $("#searchBtn").click(function(){showSearchPage();});
        $("#addRecordBtn").click(function(){showEditWin(0,null,null,1);});
        $("#saveRecordBtn").click(function(){downloadFileConfirm();});
        $(".radioLabel").click(function(){selectStyle($(this).attr("id"));});
        $("#navTitle").click(function(){$("html,body").animate({scrollTop:0},200);});
        $("#addContentBar").click(function(){addAddInput();});
        $("#toCreateNewRecord").click(function(){showEditWin(0,null,null,1);});
        $("#page_scroll").click(function(){$("html,body").animate({scrollTop:0},300)});
        $("#keySearchBtn").click(function(){switchSearchType(1);});
        $("#dateSearchBtn").click(function(){switchSearchType(2);});
        $("#preMonthBtn").click(function(){searchDateMonth(-1)});
        $("#thisMonthBtn").click(function(){searchDateMonth(0)});
        $("#nextMonthBtn").click(function(){searchDateMonth(1)});
        $(".singleInput").show(function(){
            $(".singleInput .clearInputIcon").click(function(e){
                let outInput = $(this).parent(".singleInput")[0];
                clearSingleInput(outInput);
            });
        });
        loadingFlag = true;
        //弹窗定时按钮的定时器
        window.winActionBtnInterval = null;
        $("#searchKey").keydown(function(event){
            if(event.keyCode==13){
                //printLog("按下回车键，触发搜索");
                keySearch();
            }
        });

        $("#downloadFileNameInput").keydown(function(event){
            if(event.keyCode==13){
                //printLog("按下回车键，触发下载文件");
                fileNameCheckandSave();
            }
        });

        autoShowContentByQueryParams();

        $(window).scroll(function(){
            ifShowToTop();
            autoLoadNextPage();
        });

        $(window).resize(function(){
            alertWinPositionAdjust();
            menuPanlePositonAdjust();
        });
        $("html,body").animate({scrollTop:0},300)
        textareaHeightAutoShow();
        textareaHeightAutoInput();
        recordInputDragInit();
        listenSystemColorMode();
        listenPageFocus();
        datePickerInit();

        initThemeSwitch();

    }catch(e){
        console.log("pageInit",e.message,e.stack);
        printLog("pageInit",e.message,e.stack);
        showTip("页面初始化异常，无法正常使用。","请检查源文件是否被修改或联系开发者修复。",-1,6);
        return;
    }
}

/**
 * 获取本地存储中的完整记录数据
 * **/
function getLocalRecordData(){
    const thisFucName = arguments.callee.name.toString();

    let resultData = null;

    let latestData = localGet(LATEST_DATA_KEY);
    // let oldData = localGet(old_key_name);

    //用最新的key获取到的是空
    if(!notNull(latestData)){
        /*//尝试获取用旧的key获取
        if(notNull(oldData)){
            // printLog(thisFucName,"获取到旧版本数据：",oldData);
            // printLog(thisFucName,"检测旧版本数据格式是否需要升级");
            resultData = upgradeDataFormat(oldData);

        }else{
            printLog(thisFucName,"未获取到任何本地数据");
            return null;
        }*/

        printLog(thisFucName,"未获取到任何本地数据");
        return null;   
    }else{
        resultData = latestData;
        // printLog(thisFucName,"获取到本地数据：",resultData);
    }

    if(!notNull(resultData)){
        printLog(thisFucName,"本地数据为空");
        return null;
    }

    if(!notNull(resultData.recordData)){
        printLog(thisFucName,"本地数据异常，缺失recordData数据",resultData);
        return null;
    }


    return resultData;

}


/**更新本地记录数据**/
function updateLocalRecordData(data){
    // const old_key_name = "local_storage_record_data";
    const thisFucName = arguments.callee.name.toString();

    let localData = getLocalRecordData();

    if(JSON.stringify(data) == JSON.stringify(localData)){
        printLog(thisFucName,"本地数据未发生变化，无需更新");
        return;
    }

    /*if(null!=localStorage.getItem(old_key_name)){
        localStorage.removeItem(old_key_name);
        showToast("本地数据已升级为最新格式",5000);
        // showTip("本地记录数据已升级为最新格式！","最新数据格式无法被旧版本识别（v6.0之前的版本）；若在同一浏览器下再次使用旧版本，仅可通过上传数据文件查看历史记录。",-1,11);
        printLog(thisFucName,"已清除本地存储中旧版本的数据(local_storage_record_data)");
    }*/

    data.contentUpdateTime = (new Date()).getTime();

    localSave(LATEST_DATA_KEY,data);

    printLog(thisFucName,"本地存储数据更新成功",data);

}

/**检查记录数据格式是否完整
 * @param type==1表示完整数据结构；type==2表示搜素结果**/
function checkRecordData(type,data){

    const thisFucName = arguments.callee.name.toString();

    if(!notNull(data)){
        printLog(thisFucName,"data参数异常：",data);
        return false;
    }

    /**type==1,验证完整的本地记录格式
    *需要判断
    * .recordData存在且不为null且长度不等于0
    * .recordData[themeId].recordsList存在且不为null 
    **/
    if(type == 1){
        
        if(!data.hasOwnProperty("recordData") || !notNull(data.recordData)){
            printLog(thisFucName,"记录数据中不存在.recordData:",data);
            return false;
        }

        if(getJsonLength(data.recordData) == 0){
            printLog(thisFucName,"记录数据中的.recordData为空:",data);
            return false;
        }

        let dataErrorThemeNum = 0;
        let allThemeNum = getJsonLength(data.recordData);

        $.each(data.recordData,function(index,item){
            if(typeof(item.recordList) == "undefined" || item.recordList == null){
                printLog(thisFucName,index+" "+item.themeName+"主题数据异常，不存在.recordList:",item);
                dataErrorThemeNum++;
            }
        });

        if(dataErrorThemeNum == allThemeNum){
            printLog(thisFucName,"当前数据内全部主题数据异常",data);
            return false;
        }

        // printLog(thisFucName,"非搜索结果数据检测通过");
        return true;

    /**type==1,验证搜索结果的
    *需要判断
    * .recordData存在且不为null且长度不等于0(item里存在。dayContentDetail)
    * .themeInfo存在且不为null，id和name都要有
    **/
    }else if(type == 2){
        if(!data.hasOwnProperty("recordData") || !notNull(data.recordData)){
            printLog(thisFucName,"搜索结果记录数据异常，不存在recordData",data);
            return false;
        }

        let recordDataNum = getJsonLength(data.recordData);
        let recordDataErrorNum = 0;

        $.each(data.recordData,function(index,item){
            if(!item.hasOwnProperty("dayContentDetail")){
                printLog(thisFucName,"index对应的记录异常，缺失dayContengDetail",item);
                recordDataErrorNum++;
            }
        });

        if(recordDataNum == recordDataErrorNum){
            printLog(thisFucName,"搜索结果中全部记录数据异常，不存在recordData",data);
            return false; 
        }

        if(!data.hasOwnProperty("themeInfo") || !notNull(data.themeInfo)){
            printLog(thisFucName,"搜索结果记录数据异常，不存在themeInfo",data);
            return false;
        }

        if(!data.themeInfo.hasOwnProperty("id") || !data.themeInfo.hasOwnProperty("name")){
            printLog(thisFucName,"搜索结果主题数据异常，id或name缺失",data);
            return false;
        }

        // printLog(thisFucName,"搜索结果数据检测通过");
        return true;

    }else{
        printLog(thisFucName,"无法识别的判断类型：",type);
        return false;
    }

}


/**读取文件内容**/
function readFile(themeId){
    printLog(arguments.callee.name.toString(),"开始读取文件内容");

    let file = document.getElementById("txtFileUpload").files[0];

    if(null == file){
        showTip("未获取到数据文件。","请上传文件重试。",0,2,{"themeId":themeId});
        return;
    }

    if(file.type!="text/plain"){
        //上传的文件不是txt格式
        showTip("不支持的文件格式，无法解析内容。","请上传txt文件重试。",0,1,{"themeId":themeId});
        $("#txtFileUpload").val("");
        return;
    }

    if(0 == file.size){
        showTip("数据文件内容为空。","请上传正确文件重试。",0,1,{"themeId":themeId});
        $("#txtFileUpload").val("");
        return;
    }

    let reader = new FileReader();
    let content;
    reader.onload = function(e){
        content = e.target.result;
        if(content!=""){
            //文件不是空白
            printLog("readFile.reader","文件字符长度 " + content.length);
            try{
                //将文件内容转成JSON
                fileData = $.parseJSON(content);
                printLog("readFile.reader","读取到文件内容：",fileData);

                //将文件内容升级为最新格式
                let newFormatFileData = upgradeDataFormat(fileData,themeId);
                // printLog("readFile.reader","文件内容数据格式升级完毕：",newFormatFileData);


                //将升级后的文件数据，连同主题id传入importRecord函数 执行导入
                if(!notNull(themeId)){
                    printLog("readFile.reader","文件内容读取完毕，即将执行导入，无指定主题",themeId);
                }else{
                    printLog("readFile.reader","文件内容读取完毕，即将执行导入，指定主题为：",themeId);
                    //上传文件中寻在当前指定主题且有其他主题数据
                    if(getJsonLength(fileData.recordData) > 1 && fileData.recordData.hasOwnProperty(themeId)){

                        let localFullData = getLocalRecordData();
                        let localDataExist = checkRecordData(1,localFullData);
                        let themeName = localFullData.recordData[themeId].themeName;

                        if(!localDataExist){
                            printLog(thisFucName,"本地数据丢失或存在异常，无法完成指定主题的导入。");
                            showTip("本地数据丢失或存在异常，无法完成当前主题的导入。","建议刷新页面后重新尝试",0,6);
                            return;
                        }

                        if(!localFullData.recordData.hasOwnProperty(themeId)){
                            printLog(thisFucName,"本地数据丢失或存在异常，无法完成指定主题的导入。");
                            showTip("主题已被删除，无法完成导入操作。","",-1,11);
                            return;
                        }

                        showTip("文件内包含多个主题数据，本次仅导入「 "+themeName+" 」主题的数据","操作完成后，其他主题数据不会有任何变化。",4,12,{"fileData":fileData,"themeId":themeId});
                        return;
                    }
                }
                importRecord(fileData,themeId);

            }catch(e){
                printLog(arguments.callee.name.toString(),e);
                showTip("数据文件内容格式异常，解析失败。","请检查文件内容后重新上传。",0,1,{"themeId":themeId});
                $("#txtFileUpload").val("");
            }
        }
    }
    reader.readAsText(file,"UTF-8");
}

/**导入记录
 * @param data 要导入的完整数据（升级后的最新格式）
 * @param themeId 【覆盖】的目标主题**/
function importRecord(data,themeId){

    const thisFucName = arguments.callee.name.toString();

    $("#txtFileUpload").val("");

    if(!notNull(data) || !data.hasOwnProperty("recordData")){
        printLog(thisFucName,"导入数据为空或异常：",data);
        return;
    }

    let localRecordData = getLocalRecordData();
    let localRecordDataExist = checkRecordData(1,localRecordData);

    let afterImportLocalData = copyJson(localRecordData);

    //导入的主题总数量
    let importThemeNum = getJsonLength(afterImportLocalData.recordData);

    
    if(!notNull(localRecordData) || !notNull(localRecordData.recordData) || getJsonLength(localRecordData.recordData)==0){
        if(notNull(themeId)){
            //如果本地没数据但有指定主题，说明本地数据异常，报错并return
            showTip("本地数据丢失或存在异常，无法完成导入操作。","",-1,11);
            return;
        }else{
            //如果本地没数据且无指定主题，构造本地空数据结构用于后续处理
            localRecordData = {};
            localRecordData.recordData = {}; 
        }
    }

    //没有指定导入的主题时，将以本次上传文件覆盖本地全部主题数据⚠️
    if(!notNull(themeId)){
        printLog(thisFucName,"无指定主题，将覆盖本地所有数据");
        afterImportLocalData = copyJson(data);
        $.each(afterImportLocalData,function(index,item){
            if(notNull(item.searchHistory) && item.searchHistory.length!=0){
                importSearHistoryNum += item.searchHistory.length;
                printLog("importSearHistoryNum+:",importSearHistoryNum);
            }
        });

    }else{
    //有指定导入的主题

        afterImportLocalData = copyJson(localRecordData);
        //本地找不到指定主题id，报错
        let localThemeObj = localRecordData.recordData[themeId];
        if(!notNull(localThemeObj)){
            printLog(thisFucName,"导入失败，本地找不到指定的主题："+themeId,localRecordData.recordData);
            showTip("未在本地找到目标主题，无法完成导入操作。","目标主题可能已被删除。",-1,11);
            return;
        }
        
        //要导入的数据找不到指定主题id，报错
        let importThemeObj = data.recordData[themeId];
        //let themeName = localThemeObj.themeName;
        if(!notNull(importThemeObj)){
            printLog(thisFucName,"导入失败，导入数据找不到指定的主题："+themeId,data.recordData);
            // showTip("导入失败，未在文件中找到主题ID为："+themeId+" 的数据。","为避免造成数据错乱或丢失，仅可导入相同主题ID的数据。",-1,11);
            showTip("未在文件中找到与目标主题相同的主题唯一标识，无法完成导入操作。","为避免造成数据错乱或丢失，仅可导入相同唯一标识的主题数据。",-1,11);
            return;
        }

        //搜索记录的处理
        let importThemeSearHistory = importThemeObj.searchHistory;
        let localThemeSearHistory = localThemeObj.searchHistory;


        afterImportLocalData.recordData[themeId] = importThemeObj;

    }
    //本地数据不为空时，进行备份
    if(getJsonLength(localRecordData.recordData)!=0){
        let recordBackUpData = localGet("record_backup_data");
        if(!notNull(recordBackUpData)){
            recordBackUpData = {};
        }
        let backupTime = getCrtTime().crtTimeNum;
        recordBackUpData[backupTime] = {};
        recordBackUpData[backupTime].backupTime = getTimeText().fullText;
        recordBackUpData[backupTime].backupContent = [];
        recordBackUpData[backupTime].backupContent.push(localRecordData);
        localSave("record_backup_data",recordBackUpData);
        printLog(thisFucName,"本地当前数据已备份：",recordBackUpData);
    }

    delete afterImportLocalData.fileSaveTime;
    delete afterImportLocalData.fileInfo;

    ////导入执行
    updateLocalRecordData(afterImportLocalData);
    printLog(thisFucName,"导入完成，本地数据已更新,",afterImportLocalData);

   
    //导入成功的提示信心
    let toastInfo = "导入成功";


    if(notNull(themeId)){
        
        //被导入的主题名称
        let aimThemeName = afterImportLocalData.recordData[themeId].themeName;

        if(aimThemeName.length > 10){
            aimThemeName = aimThemeName.substring(0,10) + "..."
        }
        // let maxshowName = aimThemeName.substring();

        toastInfo = "已成功向「 "+aimThemeName+" 」导入 ";

        //导入的记录数量
        let importRecordNum = getJsonLength(afterImportLocalData.recordData[themeId].recordList);
        

        //导入的搜索记录数量
        let serHisLength = 0;
        if(afterImportLocalData.recordData[themeId]?.searchHistory 
            && afterImportLocalData.recordData[themeId].searchHistory.length!=0){
           serHisLength = afterImportLocalData.recordData[themeId].searchHistory.length;

            toastInfo += importRecordNum + " 条记录，含 "+ serHisLength + " 条搜索记录。";

        }else{
            toastInfo += importRecordNum + " 条记录。";
        }

        //showToast("已成功向「"+aimThemeName+"」导入 "+getJsonLength(afterImportLocalData.recordData[themeId].recordList) + " 条记录、"+ serHisLength +" 条搜索记录",5000);
    }else{
        
        
        toastInfo = "已成功导入 "+importThemeNum+" 个主题：共 ";

        //导入的记录总数量
        let importRecordNum = 0;

        //导入的搜索记录总数量
        let importSearHistoryNum = 0;
        $.each(afterImportLocalData.recordData,function(index,item){
            importRecordNum += getJsonLength(item.recordList);
            importSearHistoryNum += getJsonLength(item.searchHistory);
        });

        if(importSearHistoryNum > 0){
            
            toastInfo += importRecordNum + " 条记录，含" + importSearHistoryNum +" 条搜索记录。";
            
        }else{

            toastInfo += importRecordNum + " 条记录。";

        }

        // showToast("已成功导入 "+importThemeNum+" 个主题，共 " + importRecordNum + " 条记录、"+ importSearHistoryNum +" 条搜索记录",5000);
    }

    printLog(thisFucName,"导入成功：",toastInfo);

    showToast(toastInfo,6000);

    if(localRecordDataExist){
        showRecords(0,0,0,0,themeId);
    }else{
        if(getJsonLength(afterImportLocalData.recordData) == 1){
            let onlyThemeId = Object.keys(afterImportLocalData.recordData)[0];
            printLog(thisFucName,"唯一的一个themeid:",onlyThemeId);
            showRecords(0,0,0,0,onlyThemeId);
        }else{
            showThemeList();
            closeAllWin();
        }
    }

}

/**下载文件确认弹窗 */
function downloadFileConfirm(themeIdAry){
    const thisFucName = arguments.callee.name.toString();

    printLog(thisFucName,"themeIdAry:",themeIdAry);

    let fullData = getLocalRecordData();
    let fullDataExist = checkRecordData(1,fullData);
    if(fullDataExist){
        let themeNameList = "";
        //没有指定主题id时，默认下载全部主题数据
        if(!notNull(themeIdAry) || themeIdAry.length==0){
            themeIdAry = [];
            $.each(fullData.recordData,function(themeId,item){
                themeIdAry.push(themeId);
            });
        }

        if(themeIdAry.length == 1 && (!notNull(fullData.recordData[themeIdAry[0]].recordList) || getJsonLength(fullData.recordData[themeIdAry[0]].recordList)==0) ){
            printLog(thisFucName,"当前主题下没有任何记录:",themeIdAry[0]);
            showTip("当前主题没有记录需要下载，要开始记录吗？","添加记录后，可将其下载为txt文件进行保存。",2,9);
            return;
        }

        $.each(themeIdAry,function(index,item){
            if(!fullData.recordData.hasOwnProperty(item)){
                showTip("数据异常，无法生成下载文件","建议刷新页面或重新选择要下载的主题",0,6);
                return;
            }
            let indexHideClassName = themeIdAry.length > 1 ? "" : "hidden";
            let hoverableClassName = themeIdAry.length > 1 ? "hoverable" : "";
            themeNameList += "<div class='downloadThemeItem "+hoverableClassName+"'><p class='downloadThemeObj'><span class='downloadThemeIndex "+indexHideClassName+"'>"+(index+1)+".</span><span class='downloadThemeName'>"+fullData.recordData[item].themeName + "</p><p class='downloadThemeNum'>"+ getJsonLength(fullData.recordData[item].recordList).toLocaleString()+" 条记录</p></div>";

            //themeNameList += "<div class='downloadThemeItem'>"+fullData.recordData[item].themeName + "<span class='downloadThemeConn'>-</span><span class='downloadThemeNum'>"+ getJsonLength(fullData.recordData[item].recordList)+" 条记录</span></div>";
            /*if(index != themeIdAry.length-1){
                themeNameList += "<br/>";
            }*/
        });

        closeAllWin();
        $("#alertBgWin,#downloadFileWin").show();
        $("#downloadThemeInfo").html(themeNameList);
        WinDragInit($("#downloadFileWin .winTitle")[0],$("#downloadFileWin")[0]);

        //生成默认文件名称
        let nowDate = new Date();
        let nowTimeText = getTimeText(nowDate.getTime(),null,null,0).fullText;
        let fileDefaultName = "";

        if(themeIdAry.length == 1){
            let dldThemeObj = fullData.recordData[themeIdAry[0]];

            let dldThemeName = dldThemeObj.themeName;

            //文件名称不能包含特殊字符
            const specialChars = /[<>:"/\\|?*]/;
            if(specialChars.test(htmlDecode(dldThemeName))){
                // dldThemeName = dldThemeName.replace(new RegExp(escapeRegExp(specialChars),"g"),"·");
                htmlName = htmlDecode(dldThemeName);
                const specialCharsRegx = /[<>:"/\\|?*]/g;
                removeSpecialChars = htmlName.replace(new RegExp(specialChars.source, "g"),"·");
                dldThemeName = htmlEncode(removeSpecialChars);
            }

            if(dldThemeName.length == 0){
                dldThemeName = "主题" + dldThemeObj.themeId;
            }

            fileDefaultName = dldThemeName + "-记录数据-"+ nowTimeText.replace(/[^0-9]/ig,"");

            //限制了主题名称不超过30字，加上后缀不会超过100字
            if(fileDefaultName.length > 100){
                //后缀和方括号共21位
                let maxThemeNameLength = 100 - 21;
                let themeTextMax = dldThemeName.substring(0,maxThemeNameLength-3) + "...";
                
                fileDefaultName = themeTextMax +"-记录数据-"+ nowTimeText.replace(/[^0-9]/ig,"");
            }
        }else{
            let fileNamePrefix = PROJECT_NAME + "记录数据-";
            if(themeIdAry.length == getJsonLength(fullData.recordData)){
                fileNamePrefix = PROJECT_NAME + "全部记录数据-";
            }
            
            fileDefaultName =  fileNamePrefix + nowTimeText.replace(/[^0-9]/ig,"");
        }



        $("#downloadFileNameInput").val(htmlDecode(fileDefaultName));
        // $("#downloadFileNameInput").focus().select();
        $("#cancelDownloadBtn").off("click").on("click",function(){
            printLog("downloadFileConfirm","取消下载");
            closeAllWin();
        });

        $("#confirmDownloadBtn").off("click").on("click",function(){
            fileNameCheckandSave(themeIdAry);
        });

        $("body").addClass("noScroll");
    }else{
        showTip("当前还没有任何记录可以下载，要开始记录吗？","添加记录后，可将其下载为txt文件进行保存。",2,3);
    }

}

/*
*检查下载确认弹窗中文件名称是否合法，若合法则直接下载文件
*/
function fileNameCheckandSave(themeIdAry){
    const fileName = $("#downloadFileNameInput").val();
    if(fileName.length == 0){
        showToast("文件名称不能为空，请填写后重试。",3000);
        return;
    }
    //const specialChars = /[<>:"/\\|?*]/g;
    let specialCharsAry = getUniqueFileNameSpecialChars(fileName);
    if(specialCharsAry.length > 0){
    // if(specialChars.test(fileName)){
        //let fullChars = "";

        showToast("文件名称不可包含以下特殊符号"+ specialCharsAry.join(" ") +" ，请修改后重试。",5000);
    }else{
        closeAllWin();
        printLog("downloadFileConfirm","确认下载数据文件，文件名称：",fileName+".txt");
        downloadFile(themeIdAry,fileName); 
    }
    
}


/**
*生成文件并下载
* @param fileName 文件名称
* @themeIdAry 主题Id数组,为空时下载所有主题数据
*/
function downloadFile(themeIdAry,fileName) {
    const fullData = getLocalRecordData();
    const fullDataExist = checkRecordData(1,fullData);

    if(fullDataExist){
        
        //文件最终要保存的所有数据
        let saveData = {};

        //文件最终要保存的记录数据
        let saveRecordData = {};


        //遍历指定的主题id，获取对应的记录数据
        if(notNull(themeIdAry)&&themeIdAry.length!=0){
            $.each(themeIdAry,function(index,item){
                if(notNull(item)&&fullData.recordData.hasOwnProperty(item)){
                    saveRecordData[item] = fullData.recordData[item];

                }else{
                    printLog(arguments.callee.name.toString(),"未找到对应的主题数据，themeid:",item);
                }
            });
        }else{
            //没有指定主题时，保存所有主题的数据
            saveRecordData = fullData.recordData;
        }

        if(null == saveRecordData){
            showTip("没有找到任何记录数据，无法下载文件。","记录后再尝试下载功能吧",-1,11);
            return;
        }

        //把记录按时间倒序排序
        $.each(saveRecordData,function(themeId,themeItem){

            let themeRecordListAry = [];
            $.each(themeItem.recordList,function(index,item){
                item.dataId = index;
                themeRecordListAry.push(item);
            });

            if(themeRecordListAry.length > 0){
                themeItem.recordList = {};
                themeRecordListAry.sort(function(a,b){return b.dayContentDate - a.dayContentDate});

                $.each(themeRecordListAry,function(i,t){
                    themeItem.recordList[t.dataId] = {};
                    themeItem.recordList[t.dataId].dayContentDate = t.dayContentDate;
                    themeItem.recordList[t.dataId].dayContentDetail = t.dayContentDetail;
                });
            }

        });

        //获取当前时间记录为文件保存时间
        let nowDate = new Date();
        let nowTimeText = getTimeText(nowDate.getTime(),null,null,0).fullText;

        //拼接所有主题信息说明文本
        let themeInfoText = "";
        let dealIndex = 0;
        $.each(saveRecordData,function(index,item){
            themeInfoText += item.themeName + "（" +item.themeId+ "）";
            dealIndex++;
            if(dealIndex < getJsonLength(saveRecordData)){
                themeInfoText += "、";
            }

        });

        //文件信息说明文本
        saveData.fileInfo = "文件下载于：" + nowTimeText + "；包含 " +getJsonLength(saveRecordData) +" 个主题："+ themeInfoText;    

        //文件保存时间 - 时间戳
        saveData.fileSaveTime = nowDate.getTime();

        //文件中的记录数据
        saveData.recordData = saveRecordData;


        if(notNull(fileName)){
            if(fileName.length>100){//文件名最大100个字符
                fileName = fileName.substring(0,100);
            }
            printLog(arguments.callee.name.toString(),"已指定数据文件名称：",fileName); 
        }else{
            if(themeIdAry.length == 1){
                fileName = "「" + saveRecordData[themeIdAry[0]].themeName +"」记录数据_"+ nowTimeText.replace(/[^0-9]/ig,"");
            }else{
                fileName =  PROJECT_NAME + "记录数据_" + nowTimeText.replace(/[^0-9]/ig,"");
            }
            printLog(arguments.callee.name.toString(),"未指定文件名称，将使用默认文件名称：",fileName);   
        }


        let fileFinalText = JSON.stringify(saveData);
        
        //下载文件
        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileFinalText));
        element.setAttribute('download', fileName+".txt");
        element.style.display = 'none';
        document.body.appendChild(element); 
        showToast("下载成功",2500);
        element.click();
        document.body.removeChild(element); 
        printLog(arguments.callee.name.toString(),"文件下载成功",fileName+".txt");
        
        let clearUndownloadThemeAry = [];
        let undownloadInfo = localGet("undownload_changed_info");
        $.each(saveRecordData,function(index,item){
            if(undownloadInfo.hasOwnProperty(index)){
                delete undownloadInfo[index];
                clearUndownloadThemeAry.push({"themeId:":index,"name":item.themeName});
            }
        });
        localSave("undownload_changed_info",undownloadInfo);
        printLog("downloadFile.updateUndownloadInfo",clearUndownloadThemeAry,"的未下载标记已清除。");

        checkIfDownload();
    }else{
        showTip("当前还没有任何记录可以下载，要开始记录吗？","添加记录后，可将全部记录下载成txt文件进行保存。",4,3);
    }
}

/**
 * 将旧的数据格式升级为最新格式
 * @param data JSON格式的数据
 * @param themeId 目标主题id**/
function upgradeDataFormat(data,themeId){

    const thisFucName = arguments.callee.name.toString();

    let originalData = copyJson(data);
    let changeFlag = false;
    let changedThemeIdList = [];

    if(!notNull(data)){
        printLog(thisFucName,"数据为空或未定义，升级失败",data);
        showTip("数据格式升级失败，无法完成后续操作。","失败原因：未指定要升级的具体数据",-1,11);
        return;
    }
    
    try{
        //data中没有data或recordData说明是很久的数据格式，需要升级
        if(typeof(data.data)!="undefined" || typeof(data.recordData)!="undefined"){

            let dataUpdateTime = null;
            
            //文件中的updatedTime为【最新】的小写开头，直接用小写c开头的值，并删除大写C开头的
            if(data.hasOwnProperty("contentUpdateTime")&&notNull(data.contentUpdateTime)){
                dataUpdateTime = data.contentUpdateTime;

                //若存在旧格式大写开头的ContentUpdateTime，删掉
                if(data.hasOwnProperty("ContentUpdateTime")){
                    delete data["ContentUpdateTime"];
                    changeFlag = true;
                }
            
            //文件中的updatedTime为旧的大写C开头、替换为小写c并删除大写C开头的
            }else if(data.hasOwnProperty("ContentUpdateTime")&&notNull(data.ContentUpdateTime)){
                dataUpdateTime = data.ContentUpdateTime;
                //将文件中大写C的contentUpdateTime替换为小写c
                data.contentUpdateTime = data.ContentUpdateTime;
                delete data["ContentUpdateTime"];
                changeFlag = true;
            }else{
                //若文件中缺失updateTime字段，直接按当前时间处理
                dataUpdateTime = (new Date()).getTime();
                data.contentUpdateTime = dataUpdateTime;
            }

            //更新数据格式 - dataUpdateTime,把“/”连接改成用“-”连接
            if(dataUpdateTime.toString().indexOf("/") != -1 ){
                dataUpdateTime = new Date(dataUpdateTime.replace(/\//g,"-"));
                data.contentUpdateTime = dataUpdateTime.getTime();
                changeFlag = true;
                printLog(thisFucName,"文件更新时间数据格式已升级完成");
            }

            //文件中记录的「文件保存时间」，将作为备份数据的id
            let fileSaveTime = data.fileSaveTime;
            
            //更新数据格式 - fileSaveTime，把“/”连接改成用“-”连接
            if(notNull(fileSaveTime) && fileSaveTime.toString().indexOf("/") != -1){
                fileSaveTime = new Date(fileSaveTime.replace(/\//g,"-"));
                data.fileSaveTime = fileSaveTime.getTime();
                changeFlag = true;
                printLog(thisFucName,"文件保存时间数据格式已升级完成");
            }
            

            //文件中的记录内容
            let recordData = data.recordData;

            //用于控制台输出的升级前data数据
            let oldFormatData = JSON.stringify(data);

            //文件内存在data数据，说明为旧格式，需要更新为最新格式recordData
            if(typeof(data.data)!="undefined"){
                printLog(thisFucName,"读取到旧格式记录数据",$.parseJSON(oldFormatData));

                //过滤文件中空数据
                data.data = fliterNullData(data.data);

                //将旧数据格式中的“记录时间”更新为时间戳
                $.each(data.data,function(index,item){
                    let recordDate = item.dayContentDate;
                    if(recordDate.toString().indexOf("/") != -1){
                        //文件中保存的时间为yyyy/mm/dd格式
                        let dateFormatDate = new Date(recordDate.replace(/\//g,"-"));
                        recordDate = dateFormatDate;
                        item.dayContentDate = dateFormatDate.getTime();
                        if(index==data.data.length-1) 
                            printLog(thisFucName,"文件中日记录数据日期格式已升级完成");
                    }
                });

                //为旧数据格式中的data增加ID
                let recordList = {};//新格式下，主题内的recordList对象(记录内容)

                $.each(data.data,function(index,item){
                    let randomNum = getRandomNumber(null,null,4).toString();
                    let recordItemId;
                    //用 记录日期时间戳+4位随机数作为记录ID，并且不能重复
                    do{
                        recordItemId = item.dayContentDate + randomNum;
                    }while(recordList.hasOwnProperty(recordItemId));

                    recordList[recordItemId] = {};
                    recordList[recordItemId].dayContentDate = item.dayContentDate;
                    recordList[recordItemId].dayContentDetail = item.dayContentDetail;
                });
                data.recordData = recordList;//在data下增加recordData，此时还缺少主题层
                delete data.data;
                changeFlag = true;
            }

            let recordDataArray = [];
            $.each(fliterNullData(data.recordData),function(index,item){
                recordDataArray.push(item);
            });



            //recordData中不存在recordList说明不是以主题为维度的最新格式数据，需要进行升级
            if(!recordDataArray[0].hasOwnProperty("recordList")){

                //按记录日期倒序排序
                recordDataArray.sort(function(a,b){return b.dayContentDate - a.dayContentDate;});

                //构建主题信息
                let themeObject = {};
                let firstRecordTime = recordDataArray[recordDataArray.length -1].dayContentDate;
                let lastRecordTime = recordDataArray[0].dayContentDate;

                //生成的主题名称为：未命名+4位随机数，并且需要判断不能与本地已有主题名称重复
                let saveThemeName = "";
                let localAllThemeName = [];

                //获取本地完整数据，用于对比新生成的主题名称，防止重复
                let localFullData = getLocalRecordData();
                let localFullDataExist = checkRecordData(1,localFullData);

                if(localFullDataExist && getJsonLength(localFullData.recordData)!=0){
                    $.each(localFullData.recordData,function(index,item){
                        if(!notNull(item.themeName)){
                            printLog(thisFucName,"检测到缺失主题名称的数据",item);
                        }else{
                            localAllThemeName.push(item.themeName);
                        }
                    });
                }

                if(notNull(themeId)){
                    saveThemeName = localFullData.recordData[themeId].themeName;
                }else{
                   do{
                        saveThemeName = "未命名" + getRandomNumber(null,null,6);
                    }while(localAllThemeName.indexOf(saveThemeName)!= -1); 
                }


                //搜索记录的处理
                if(notNull(data.searchHistory) && data.searchHistory.length>0){
                    themeObject.searchHistory = data.searchHistory;
                }

                //如果当前指定了导入的目标主题id,则使用指定主题id为升级后的主题id
                themeObject.themeId = notNull(themeId)?themeId:createThemeId();
                themeObject.themeName = saveThemeName;
                themeObject.createTime = firstRecordTime;
                themeObject.updateTime = lastRecordTime;
                themeObject.recordList = data.recordData;

                //将data.recordData替换为增加了主题层的数组
                data.recordData = {};
                data.recordData[themeObject.themeId] = themeObject;

                //记录发生变动的themeId
                if(changedThemeIdList.lastIndexOf(themeObject.themeId) != -1){
                    changedThemeIdList.push(themeObject.themeId);
                }

                changeFlag = true;
                printLog(thisFucName,"已将数据结构升级为最新格式",data);
            }
        }

        if(changeFlag){
            let localBackupData = localGet("ungrade_backup_data");
            let localBackupDataUpdate = false;

            //本地已有备份文件
            if(typeof(localBackupData)!="undefined"&&localBackupData!=null){

                //本地不存在文件对应日期的备份文件
                if(!localBackupData.hasOwnProperty(data.fileSaveTime)){
                    localBackupData[data.fileSaveTime] = {}
                    localBackupData[data.fileSaveTime].backupFileSaveDate = data.fileSaveTime;
                    localBackupData[data.fileSaveTime].backupFileContent = []
                    localBackupData[data.fileSaveTime].backupFileContent.push(originalData);
                    localBackupDataUpdate = true;
                }else{//本地已存在文件对应日期的文件，追加本次内容
                    localBackupData[data.fileSaveTime].backupFileContent.push(originalData);
                    localBackupDataUpdate = true;
                }
            }else{//本地没有备份文件，需要创建并备份
                localBackupData = {};
                localBackupData[data.fileSaveTime] = {}
                localBackupData[data.fileSaveTime].backupFileSaveDate = data.fileSaveTime;
                localBackupData[data.fileSaveTime].backupFileContent = []
                localBackupData[data.fileSaveTime].backupFileContent.push(originalData);
                localBackupDataUpdate = true;
            }

            if(localBackupDataUpdate){
                localSave("ungrade_backup_data",localBackupData);
                printLog(thisFucName,"被升级内容已备份至本地：",localBackupData);
            }

            printLog(thisFucName,"全部数据内容已升级为最新格式：",data);

            $.each(changedThemeIdList,function(i,t){
               updateUndownloadInfo(t);//记录未下载的变动信息 
            })

            return data;

        }else{
            // printLog(arguments.callee.name.toString(),"数据已是最新格式，无需升级。");
            return originalData;
        }

    }catch(e){
        printLog(thisFucName,"数据格式异常",e);
        return originalData;
    }
    
}

/**
* 首次使用，生成新的本地数据
* */
function createNewRecord(){
    closeAllWin();
    showEditWin(0,null,null,1);
}

function addAddInput(){
    let crtInputNum = $("[class='editRecordInput']").length;
    let newNum = crtInputNum + 1;
    if(crtInputNum < 20){
        let inputHtml = "<div class='editInputDiv newAdd'><p class='inputNum'>"+newNum+".</p><textarea  rows='1' class='editRecordInput' name='editRecordInput'></textarea></div>";
        $("#editInputList").append(inputHtml);
        //<div class="editInputDiv"><p class="inputNum">3.</p><input type="text"  class="editRecordInput"></div>
        let nowHeight = $("#editRecordWin .winMainContent").prop("scrollHeight");
        //$("#editRecordWin .winMainContent").scrollTop(nowHeight + 40);

        let all_input = $("[class='editRecordInput']");
        
        textareaHeightAutoInput();

        if(newNum == 20){
            showToast("每条记录最多可添加 20 项内容",3000);
            $("#addContentBar").hide();
        }

        recordInputDragInit();

    }
}


/**
 *生成不重复的记录ID 
 **/
function createRecordId(prefix,themeId){
    if(!notNull(prefix) || !notNull(themeId)){
        showToast("出现未知异常，请联系开发者修复。",3000);
        printLog(arguments.callee.name.toString(),"缺失必要参数，无法生成记录ID");
        return;
    }else{
        let id;
        let fullData = getLocalRecordData();
        if(notNull(fullData)){
          let recordData = fullData.recordData[themeId];
            if(notNull(recordData)){
                do{
                    id = prefix + getRandomNumber(null,null,4);
                }while (recordData.length>0 && fullData.recordData.hasOwnProperty(id)); // 确保ID是唯一的
                    printLog(arguments.callee.name.toString(),"记录ID已生成：",id);
                    return id; 
            }else{
                showToast("出现未知异常，请联系开发者修复。",3000);
                printLog(arguments.callee.name.toString(),"缺失必要参数，无法生成记录ID");
                return;
            }  
        }else{
           id = prefix + getRandomNumber(null,null,4);
           // id = prefix + (Math.floor(Math.random() * 8999) + 1000).toString();
            printLog(arguments.callee.name.toString(),"记录ID已生成：",id);
            return id; 
        }
          
    }
    
}

/**
 *生成不重复的主题ID 
 **/
 function createThemeId(){
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const length = 6;
    // const numbers = ["0","1","2","3","4","5","6","7","8","9"];
    // const lettersStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    // const letters = lettersStr.split("");

    const localFullData = getLocalRecordData();
    const localFullDataExist =  checkRecordData(1,localFullData);
    
    let recordData = {};
    if(localFullDataExist){
        recordData = localFullData.recordData;
    }
    let themeId = "";
    do{
        themeId = "";
        for(let i=0; i<length; i++){
            themeId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        /*let preThemeId = numbers[Math.floor(Math.random() * numbers.length)] + letters[Math.floor(Math.random() * letters.length)];
        let midThemeId = numbers[Math.floor(Math.random() * numbers.length)] + letters[Math.floor(Math.random() * letters.length)];
        let endThemeId = numbers[Math.floor(Math.random() * numbers.length)] + letters[Math.floor(Math.random() * letters.length)];
        themeId = preThemeId + midThemeId + endThemeId;*/
    }while(recordData.hasOwnProperty(themeId));

    printLog(arguments.callee.name.toString(),"主题ID已生成：",themeId);
    return themeId;
 }


/**
*添加日记录
* @param themeId 目标主题id
* @param firstAdd 是否首次添加记录
*/
function addRecord(themeId,firstAdd){

    const thisFucName = arguments.callee.name.toString();

    if(!notNull(themeId) && !firstAdd){
        printLog(thisFucName,"必要参数不全，无法添加记录",{"themeId":themeId,"firstAdd":firstAdd});
        return;
    }

    let fullData = getLocalRecordData();
    let nowDate = new Date();
    let today0Date = new Date(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate(),0,0,0);
    let thisTime = nowDate.getTime();
    //fullData.contentUpdateTime = thisTime;

    //非首次添加（指定主题添加时），若主题id不存在 直接报错
    if(!firstAdd && notNull(themeId) && !notNull(fullData.recordData[themeId])){
        showTip("获取历史数据失败，无法添加。","请重新上传数据文件后再进行添加操作。",0,1);
        return;
    }

    if(firstAdd){
        themeId = createThemeId();
    }

    let inputThemeName = $("#editWinThemeInput").length>0? $("#editWinThemeInput")[0].value.trim() : true;

    if(!notNull(inputThemeName)){
        showToast("请填写主题名称",3000);
        $("#editWinThemeInput").focus();
        return;
    }

    let allInput = [];
    $("[class='editRecordInput']").each(function(){
        if($(this).val().trim() != ""){
            let saveInputValue = innerHtmlTransform($(this).val()).replace(/\<br>/g,"&#10;");;
            // saveInputValue = filterMultipleStr(saveInputValue,"&#10;");
            allInput.push(saveInputValue);
        }
    });

    if(allInput.length == 0){
        showToast("请填写需要记录的内容",3000);
        $("[class='editRecordInput']")[0].focus();
        return;
    }

    let newDayRecordDate = 0;
    let selectDateVal = $("input[name=editRecordDate]:checked").val();
    let targetSaveDate = null;
    let targetSaveDateInfo = null;
    if(selectDateVal==-2){//日期为自定义选择日期
        let inputSelectDate = new Date($("#otherDayInput").val());
        if(inputSelectDate < today0Date){//日期选择器日期早于今天，按照对应日期的23:59:59保存
             targetSaveDate = new Date(inputSelectDate.getFullYear(),inputSelectDate.getMonth(),inputSelectDate.getDate(), 23, 59, 59);
             targetSaveDateInfo = "日期选择器日期早于今天，按照选择日期的23:59:59保存";
        }else if(inputSelectDate > today0Date){//日期选择器晚于今天，按照对应日期的00:00:00保存
             targetSaveDate = new Date(inputSelectDate.getFullYear(),inputSelectDate.getMonth(),inputSelectDate.getDate(),0,0,0);
             targetSaveDateInfo = "日期选择器晚于今天，按照对应日期的00:00:00保存";
        }else{
             targetSaveDate = today0Date;//日期选择器日期等于今天，按照当前时间保存
             targetSaveDateInfo = "日期选择器日期等于今天，按照当前时间保存";
        }
    //选中“今天”    
    }else if(selectDateVal==0){
        targetSaveDate = nowDate;
        targetSaveDateInfo = "日期标签选择为「今天」，按照当前时间保存";
    //选中“明天”，日期记录为明天0点
    }else if(selectDateVal==-1){
        targetSaveDate = new Date(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate()+1,0, 0, 0);
        targetSaveDateInfo = "日期标签选择为「明天」，按照明天的00:00:00保存";
    //选中昨天或前天，记录为对应日期的23:59:59
    }else if(selectDateVal==1||selectDateVal==2){
        targetSaveDate = new Date(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate()-selectDateVal,23,59,59);
        targetSaveDateInfo = "日期标签选择为「昨天」或「前天」，按照对应日期的23:59:59保存";
    }

    printLog(thisFucName,targetSaveDateInfo,targetSaveDate);
    newDayRecordDate = targetSaveDate.getTime();
    
    let dayRecordId = createRecordId(newDayRecordDate,themeId);
    let newDayRecord = {"dayContentDate":newDayRecordDate,"dayContentDetail":allInput};

    //是首次添加时，创建基础数据结构
    if(firstAdd){
        /*let inputThemeName = $("#editWinThemeInput")[0].value.trim();

        if(!notNull(inputThemeName)){
            showToast("请填写主题名称",3000);
            $("#editWinThemeInput").focus();
            return;
        }*/

        if(inputThemeName.length > 30){
            showToast("主题名称不能超过30字符",3000);
            $("#editWinThemeInput").focus();
            return;
        }

        inputThemeName = innerHtmlTransform(inputThemeName);
        

        fullData = {};
        fullData.recordData = {};
        fullData.recordData[themeId] = {};
        fullData.recordData[themeId].themeId = themeId;
        fullData.recordData[themeId].themeName = inputThemeName;
        fullData.recordData[themeId].createTime = thisTime;
        fullData.recordData[themeId].updateTime = thisTime;
        fullData.recordData[themeId].recordList = {};
    }

        
    fullData.recordData[themeId].recordList[dayRecordId] = {};
    fullData.recordData[themeId].recordList[dayRecordId].dayContentDate = newDayRecordDate;
    fullData.recordData[themeId].recordList[dayRecordId].dayContentDetail = allInput;
    fullData.recordData[themeId].updateTime = thisTime;

    updateLocalRecordData(fullData);
    updateUndownloadInfo(themeId);
    printLog(thisFucName,"记录添加成功", {"dataid":dayRecordId,"recordData":fullData.recordData[themeId].recordList[dayRecordId]});
    showRecords(0,0,null,0,themeId);
    recordDownloadRemind();
    showToast("记录添加成功",1500);
 
}

/**
 * 未保存改动数量标记
 */
function updateUndownloadInfo(themeId){
    const thisFucName = arguments.callee.name.toString();
    const localFullData = getLocalRecordData();
    const localFullDataExist = checkRecordData(1,localFullData);

    if(!localFullDataExist){
        printLog(thisFucName,"本地数据异常，无法更新未保存信息",localFullData);
        return;
    }

    if(!notNull(themeId)){
        printLog(thisFucName,"未指定themeId，无法更新未保存信息");
        return;
    }

    let undownloadInfo = localGet("undownload_changed_info");
    if(!notNull(undownloadInfo)){
        undownloadInfo = {};
        undownloadInfo[themeId] = {};
        undownloadInfo[themeId].themeId = themeId;
        undownloadInfo[themeId].number = 1;
    }

    const themeName = localFullData.recordData[themeId].themeName;

    if(!undownloadInfo.hasOwnProperty(themeId)){
        let newChangedTheme = {};
        newChangedTheme.themeId = themeId;
        newChangedTheme.number = 1;
        newChangedTheme.name = themeName;
        undownloadInfo[themeId] = newChangedTheme;

    }else{
        let thisUndownloadNum = undownloadInfo[themeId].number;
        undownloadInfo[themeId].name = themeName;
        undownloadInfo[themeId].number = thisUndownloadNum + 1;
    }

    localSave("undownload_changed_info",undownloadInfo);
    printLog(thisFucName,"已记录未下载的变动:",themeId,themeName);
}

function recordDownloadRemind(){
    let localDownloadReminder = localGet("record_download_reminder_confirm");
    if(localDownloadReminder==null || !localDownloadReminder.status){
        printLog(arguments.callee.name.toString(),"本次操作为首次添加记录，显示「下载提醒」弹窗");
        showTip("记录成功，记得用「下载」功能永久保留数据。",
            "由于数据仅在当前浏览器本地存储，使用「下载」功能可将已记录的内容下载为txt文件永久保存；<br/>在更换设备或浏览器后，可上传已下载的数据文件完成导入并继续记录。<br/><br/>‼️ 请注意，在部分浏览器的隐私管理政策下，使用“无痕窗口”时可能会出现“数据保存失败”或“关闭页面后数据被自动清除”等异常情况，因此请避免在浏览器的“无痕窗口”下使用当前工具。",
            6,7);
    }
    
}


function downloadReminderConfirm(){
    let downloadReminderConfirm = {};
    downloadReminderConfirm.status = true;
    downloadReminderConfirm.time = new Date().getTime();
    downloadReminderConfirm.timeText = getTimeText(null,null,null,0).fullText;
    localSave("record_download_reminder_confirm",downloadReminderConfirm);
    printLog(arguments.callee.name.toString(),"已记录「下载提示」为已读");
}

/**
*显示日记录操作按钮
*@param id 
*@param show 1显示 0隐藏
*/
function isShowRecordAcitons(id,themeId,show){
    const thisFucName = arguments.callee.name.toString();

    if(!notNull(id)||!notNull(themeId)){
        printLog(arguments.callee.name.toString(),"未知的操作目标，无法显示日记录操作按钮！")
    }else{
        if(show){
            let fullData = getLocalRecordData();

            const pageShowedActions = $("[dataid="+id+"] .recordActionArea").html();
            if(pageShowedActions==""){
                //展示记录item的操作按钮（编辑、更多）
                const editBtnHTML = "<p class='recordActionBtn editBtn'><em class='recordActionBtnIcon iconfont icon-edit'></em><span class='recordBtnText editBtnText'>编辑</span></p>";
                const moreBtnHTML = "<p class='recordActionBtn moreBtn'><em class='recordActionBtnIcon iconfont icon-more'></em><span class='recordBtnText moreBtnText'>更多</span></p>";
                $("[dataid="+id+"] .recordActionArea").html(editBtnHTML + moreBtnHTML);
            }
           
            //鼠标hover增加文字提示
            $(".recordActionBtn.editBtn").off("mouseenter").on("mouseenter",function(){$(this).addClass("hover");});
            $(".recordActionBtn.editBtn").off("mouseleave").on("mouseleave",function(){$(this).removeClass("hover");});

            $(".recordActionBtn.moreBtn").off("mouseenter").on("mouseenter",function(){$(this).addClass("hover");});
            $(".recordActionBtn.moreBtn").off("mouseleave").on("mouseleave",function(){
                if($(".recordActionPanel").length==0){
                   $(this).removeClass("hover");
                }
            });

            //绑定“编辑”按钮点击事件
            $("[dataid="+id+"] .recordActionBtn.editBtn").off("click").on("click",function(){
                showEditWin(1,id,themeId);
                $(this).closest(".recordActionArea").html("");
            });

            //绑定“更多”按钮点击事件
            $("[dataid="+id+"] .recordActionBtn.moreBtn").off("click").on("click",function(){

                //组装排序面板内容
                let menuPanelHTML = "<div class='menuPanel recordActionPanel' dataid='"+id+"'>";

                //放大查看
                menuPanelHTML += "<p class='panelActionItem zoomInRcd'>放大查看</p>";

                //删除
                menuPanelHTML += "<p class='panelActionItem deleteRcd'>删除</p></div>";

                //如果页面中有其他【记录操作】菜单面板 移除
                let otherRrdMenuPanel = $(".recordActionPanel[dataid!="+id+"]");
                let thisRcdMenuPanel = $(".recordActionPanel[dataid="+id+"]");
                if(otherRrdMenuPanel.length > 0){
                    //otherRrdMenuPanel.closest('.recordList').find(".dayRecordDate .recordActionArea").html("");
                    $(otherRrdMenuPanel).trigger("removeMenuPanel");
                    //return;
                }
                if(thisRcdMenuPanel.length > 0){
                    thisRcdMenuPanel.trigger("removeMenuPanel");
                    return;
                }

                //给当前点击按钮增加hover样式
                if(!$(this).hasClass("hover")){
                    $(this).addClass("hover");
                }

                //展示当前面板
                $(this).append(menuPanelHTML);

                const thisMenuPanel = $(".recordActionPanel");
                const thisMenuPanelBtn = $(this);

                //面板位置定位矫正
                $(thisMenuPanel).off("ajustPositon").on("ajustPositon",function(){

                    let panelParent = $(this).parent(".recordActionBtn.moreBtn");

                    let offset = panelParent.offset();
                    let btnWidth = panelParent.width();

                    let thisPanelWidth = $(this).width();
                    $(this).css({
                        // 'min-height': '40px',
                        'max-height': 'calc(100vh - 100px)',
                        position: "absolute",
                        left: offset.left - (thisPanelWidth - btnWidth) + 12,
                        top: offset.top + 30
                    });

                });

                $(thisMenuPanel).trigger("ajustPositon");

                //给面板配置“点击其他地方关闭“效果
                hidePanelByClick(thisMenuPanel,$(this));

                //给面板配置remove事件
                $(thisMenuPanel).off("removeMenuPanel").on("removeMenuPanel",function(){

                    const rcdMoreBtn = $(this).parent(".recordActionBtn.moreBtn");
                    if($(rcdMoreBtn).hasClass("hover")){
                        $(rcdMoreBtn).removeClass("hover");
                    }
                    $(this).remove();

                    $("body").removeClass("noScroll");

                    // $(this).closest(".recordActionArea").html("");
                });

                //配置菜单面板中的点击事件 - 放大展示
                $(".recordActionPanel .panelActionItem.zoomInRcd").off("click").on("click",function(){
                    
                    
                    const zoominRecord = $(this).closest(".recordList");
                    $(thisMenuPanel).trigger("removeMenuPanel");

                    zoominRecord.addClass("zoomIn");
                    $(".recordList").off("mouseenter");
                    $(".recordList").off("mouseleave")
                    $("body").addClass("noScroll");

                    //添加关闭放大按钮
                    const zoomoutHTML = "<em class='iconfont icon-guanbi zoomoutRcd'></em>";
                    zoominRecord.find(".dayRecordDate .recordActionArea").html(zoomoutHTML);
                    
                    //给放大后的记录绑定“关闭放大”事件
                    zoominRecord.find(".zoomoutRcd").off("click").on("click",function(){
                        zoominRecord.removeClass("zoomIn");
                        zoominRecord.find(".dayRecordDate .recordActionArea").html("");

                        //重新绑定鼠标移入recordList时展示操作按钮
                        $(".recordList").off("mouseenter").on("mouseenter",function(){isShowRecordAcitons($(this).attr("dataid"),$(this).attr("themeid"),1)});
        
                        $(".recordList").off("mouseleave").on("mouseleave",function(){
                                isShowRecordAcitons($(this).attr("dataid"),$(this).attr("themeid"),0)
                        });

                        $("body").removeClass("noScroll");

                    });

                });

                //配置菜单面板中的点击事件 - 删除
                $(".recordActionPanel .panelActionItem.deleteRcd").off("click").on("click",function(){
                    try{
                        let deleteRecord = fullData.recordData[themeId].recordList[id];
                        if(typeof(deleteRecord)!="undefined"&&deleteRecord!=null){
                            let deleteTargetDate = new Date(deleteRecord.dayContentDate);
                            let deleteTargetDateText = deleteTargetDate.getFullYear() + "/" + (zeroFormat(deleteTargetDate.getMonth()+1)) +"/" + zeroFormat(deleteTargetDate.getDate());
                            let deleteTargetContentText = fullData.recordData[themeId].recordList[id].dayContentDetail.toString().substring(0,20);
                            if(fullData.recordData[themeId].recordList[id].dayContentDetail.toString().length>20){
                              deleteTargetContentText += "...";
                            }
                            showTip("确认删除「"+deleteTargetDateText+"」关于「"+deleteTargetContentText+"」的记录吗？","删除后无法恢复,请谨慎操作。",4,4,{"dataId":id,"themeId":themeId});
                        }else{
                            showTip("记录已经被删除了","页面当前展示内容发生变动，刷新看看吧。",0,6);
                        }

                        

                    }catch(e){
                        showTip("数据异常，无法完成删除操作。","请刷新页面后重试","",0,6);
                        printLog("deleteDayRecord",e);
                        return;
                    }

                });

            });

        }else{
            $("[dataid="+id+"] .recordActionArea").html("");
        }
    }
}

/**
*打开编辑日记录弹窗
*@param editType  0:添加   1:编辑
*@param dataId 要编辑的记录Id
*@param themeId 要编辑的记录对应的主题Id
*@param firstAdd 是否首次添加记录
*/
function showEditWin(editType,dataId,themeId,firstAdd){

    const thisFucName = arguments.callee.name.toString();

    if(!notNull(editType)){
        printLog(thisFucName,"缺失editType参数，无法打开记录编辑弹窗");
        showToast("操作失败");
        return;
    }

    if(editType!=0&&editType!=1){
        printLog(thisFucName,"无法识别的editType，无法打开记录编辑弹窗");
        showToast("操作失败");
        return;
    }

    let winTitleText = "";
    let editThemeName = "";
    let fullData = getLocalRecordData();
        
    //editType==1 编辑记录
    if(editType == 1){
        if(notNull(dataId)&&notNull(themeId)){

            let beforeEditData = fullData.recordData[themeId].recordList[dataId];
            if (typeof(beforeEditData)!="undefined"&&beforeEditData!=null){
                winTitleText = "编辑记录";

                editThemeName = fullData.recordData[themeId].themeName;

                //获取今天0点时间戳
                let crtTime = getCrtTime();
                let todayDate = new Date(crtTime.year+"/"+crtTime.month+"/"+crtTime.day+" 00:00:00");
                let todayTime = todayDate.getTime();
                //获取昨天及前天0点时间戳
                let yesterdayTime = todayTime - 24*60*60*1000;
                let bfYesterdayTime = yesterdayTime - 24*60*60*1000;
                //获取编辑对象日期0点时间戳
                let editDayDate = new Date(beforeEditData.dayContentDate);
                let editDayTime = editDayDate.getTime();
                let editDayText = editDayDate.getFullYear()+"/"+(editDayDate.getMonth()+1)+"/"+editDayDate.getDate()+" 00:00:00";
                let editDayZeroTime = new Date(editDayText).getTime();
                //计算编辑对象日期与今天相差几天,小于0说明编辑对象日期晚于今天(将来的时间)
                let dayDifference = (todayTime - editDayZeroTime) / (24*60*60*1000);
                let daySelectIndex = 0;
                printLog(arguments.callee.name.toString(),"编辑对象日期与当前日期相差天数：",dayDifference);
                if(dayDifference >= -1 && dayDifference < 0){//编辑对象日期晚于今天且不晚于明天
                    daySelectIndex = 0;
                }else if (dayDifference>=0 && dayDifference<3){//编辑对象日期早于今天且不早于前天
                    daySelectIndex = dayDifference + 1;
                }else{//编辑对象日期晚于明天，显示“其它 - 具体日期”
                    daySelectIndex = 4;
                }
                let targets = new Array("labelTomorrow","labelToday","labelYesterday","labelBfyesterday","labelOtherDay");
                if(daySelectIndex < 4){
                    selectStyle(targets[daySelectIndex]);
                }else{
                    selectStyle(targets[4]);
                    let dayText = editDayDate.getFullYear() + "/" + zeroFormat(editDayDate.getMonth()+1) + "/" +zeroFormat(editDayDate.getDate());
                    $("#otherDayText").html(dayText);
                    $("#otherDayInput").val(dayText);
                }

                let dayRecordNum = beforeEditData.dayContentDetail.length;
                if(dayRecordNum > 2){
                    let addInputNum = dayRecordNum - 2;
                    for(let i=0; i<addInputNum-1; i++){
                        addAddInput();
                    }
                }
                $(".editInputDiv").each(function(index,item){
                    let record_input = "";
                    if(beforeEditData.dayContentDetail[index] != null){ 
                        record_input = "<p class='inputNum'>"+(index+1)+".</p><textarea rows='1' name='editRecordInput' class='editRecordInput' >"+ beforeEditData.dayContentDetail[index] +"</textarea>";

                    }else{
                        record_input = "<p class='inputNum'>"+(index+1)+".</p><textarea rows='1' name='editRecordInput' class='editRecordInput' ></textarea>";
                    }
                    $(this).html(record_input);
                });

                $("#saveEditBtn").off("click").on("click",function(){editDayRecord(dataId,themeId);});

            }else{
                showTip("记录已被删除，无法进行编辑。","页面当前展示内容发生变动，刷新看看吧。",0,6);
                return;
            }
            
        }else{
            showTip("记录已被删除，无法进行编辑。","页面当前展示内容发生变动，刷新看看吧。",0,6);
            return;
        }
    //editType==0，添加新纪录
    }else if(editType == 0){
        //是首次创建记录
        if(notNull(firstAdd)&&firstAdd){
            winTitleText = "添加记录";
            editThemeName = "<input type='text' name='editWinThemeInput' id='editWinThemeInput' placeholder='输入主题名称' maxlength='30' autocomplete='off'/> ";
            // $("#editTheme").html(themeInputHTML);
            $("#saveEditBtn").off("click").on("click",function(){addRecord(null,1);});
            
        //不是首次创建记录
        }else{
            let thisThemeId = null;

            if(notNull(themeId)){
                thisThemeId = themeId;
            }else{
                let requestParams = getQueryParams();
                if(notNull(requestParams) && requestParams.hasOwnProperty("themeId")){
                    thisThemeId = requestParams.themeId;
                }
            }
            
            if(notNull(thisThemeId)){
                if(fullData!=null&&fullData.recordData!=null&&fullData.recordData[thisThemeId]!=null){
                    winTitleText = "添加记录";
                    editThemeName = fullData.recordData[thisThemeId].themeName;
                    $("#saveEditBtn").off("click").on("click",function(){addRecord(thisThemeId);});
                }else{
                    printLog(arguments.callee.name.toString(),"dataId:"+dataId+"或themeId:"+thisThemeId+"异常");
                }
            }else{
                printLog(arguments.callee.name.toString(),"主题id获取异常，themeId:"+thisThemeId);
                return;
            }
        }
        
    }

    WinDragInit($(".winTitle")[0],$("#editRecordWin")[0]);
    $("body").addClass("noScroll");
    $("#editWinTitle").html(winTitleText);
    $("#editRecordWin #editTheme").html(editThemeName);
    $("#alertBgWin,#editRecordWin").show();
    textareaHeightAutoShow();
    textareaHeightAutoInput();
    recordInputDragInit();
    $(".winMainContent").scrollTop(0);
    if(editType == 0){//添加
        if(notNull(firstAdd)&&firstAdd){
            $("#editWinThemeInput").focus();
        }else{
            let recordInputs = $(".editRecordInput");
            $(recordInputs[0]).focus();
        }
        
    }
    
}

/**
*编辑弹窗 日期选择状态显示
*@param targetId 要设置为选中状态的元素id
*/
function selectStyle(targetId){
    $(".radioLabel").removeClass("radioLabelChecked");
    $("input[name='editRecordDate']").removeAttr("checked");

    if("labelOtherDay" == targetId){//其它日期
        //$("#otherDayInput").focus();
        $("#otherDayRadio").prop("checked",true);
        //$("#otherDayInput").blur();
    }else{//明天、今天、昨天或前天
        let targetRadioId = "todayRadio";//默认今天
        if(targetId == "labelYesterday"){
            targetRadioId = "yesterdayRadio";
        }else if(targetId == "labelBfyesterday"){
            targetRadioId = "beforeyesterdayRadio";
        }else if(targetId == "labelTomorrow"){
            targetRadioId = "tomorrowRadio";
        }
        $("#"+targetRadioId).prop("checked",true);
        let selectBtnText = $("#labelOtherDay span").html();
        if(selectBtnText!="其它")
        $("#labelOtherDay span").html("其它");
    }

    $("#"+targetId).addClass("radioLabelChecked");
}

/**
*编辑日记录
*@param dataId 要编辑的日记录id
*@param themeId 要编辑的日记录对应的主题id
*/
function editDayRecord(dataId,themeId){
    const thisFucName = arguments.callee.name.toString();
    let pageRequestParams = getQueryParams();

    if(!notNull(dataId)||!notNull(themeId)){
        printLog(thisFucName,"必要参数缺失：",{"dataId":dataId,"themeId":themeId});
        showToast("操作失败");
        return;
    }

    let fullData = getLocalRecordData();
    let fullDataExist = checkRecordData(1,fullData);

    if(!fullDataExist){
        printLog(thisFucName,"本地存储数据异常",fullData);
        showTip("本地存储数据异常或已丢失，无法进行编辑。","页面当前展示内容发生变动，刷新看看吧。", 0 ,6);
        return;
    }

    if(!fullData.recordData?.[themeId]){
        printLog(thisFucName,"主题不存在",fullDat.recordData);
        showTip("当前主题已被删除，无法进行编辑。","页面当前展示内容发生变动，刷新看看吧。", 0 ,6);
        return;
    }

    if(!fullData.recordData[themeId]?.recordList 
        || getJsonLength(fullData.recordData[themeId].recordList)==0
        || !fullData.recordData[themeId].recordList?.[dataId]){
        printLog(thisFucName,"主题内记录为空",fullDat.recordData[themeId].recordList);
        showTip("记录已被删除，无法进行编辑。","页面当前展示内容发生变动，刷新看看吧。", 0 ,6);
        return;
    }

    printLog(thisFucName,"修改前记录内容：",$.parseJSON(JSON.stringify(fullData.recordData[themeId].recordList[dataId])));
    
    let afterEditRecord = [];//记录当前输入内容
    $("[class='editRecordInput']").each(function(){//把输入框内容转义
        if($(this).val().trim() != ""){
            let saveInputValue = innerHtmlTransform($(this).val()).replace(/\<br>/g,"&#10;");
            // saveInputValue = filterMultipleStr(saveInputValue,"&#10;");//.replace(/\<br>/g,"&lt;br&gt;");
            afterEditRecord.push(saveInputValue);
        }
    });

    if(afterEditRecord.length == 0){
        showToast("请填写需要记录的内容",3000);
        $("[class='editRecordInput']")[0].focus();
        return;
    }

    let changeFlag = false;
    let beforeEditData = fullData.recordData[themeId].recordList[dataId];//编辑前的记录总数据
    let beforeEditDate = new Date(beforeEditData.dayContentDate);//编辑前的日期
    let beforeEditDateTime = beforeEditDate.getTime();//编辑前的时间戳
    // let beforeEditDay0Date = ;
    let beforeEditDay0Time = new Date(beforeEditDate.getFullYear()+"/"+(beforeEditDate.getMonth()+1)+"/"+beforeEditDate.getDate()+" 00:00:00").getTime();//编辑前日期0点时间戳

    let nowDate = new Date();//当前时间
    let today0Date = new Date(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate(),0,0,0);  
    let thisTime = nowDate.getTime();//当前时刻时间戳
    
    let afterEditData = {};//编辑后的记录总数据,默认与修改前相同
    afterEditData.dataId = dataId;
    afterEditData.dayContentDate = beforeEditData.dayContentDate;
    afterEditData.dayContentDetail = beforeEditData.dayContentDetail;
    let afterEditDateText = "";
    let selectDateVal = $("input[name=editRecordDate]:checked").val();//编辑后选中的日期
    // let selectDateInputDate = new Date(selectDateText);
    //let afterEditDate = new Date().getTime();//编辑后选中日期的时间戳，默认为当前时刻
    let afterEditDay0Time = 0;//编辑后选中日期的0点时间戳(默认为0)
    
    //如果当前选中的是今天/昨天/前天/明天
    if(selectDateVal!=-2){
        let crtTime = getCrtTime();
        let dayDate = new Date(new Date().getTime() - selectDateVal*24*60*60*1000);
        afterEditDay0Time = new Date(dayDate.getFullYear(),dayDate.getMonth(),dayDate.getDate(),0,0,0).getTime();//当前选中日期0点的时间戳
    }else{
        afterEditDay0Time = new Date($("#otherDayInput").val()).getTime();
    }

    //日期发生了变动
    if(afterEditDay0Time!=beforeEditDay0Time){
        changeFlag = true;
        afterEditData.dayContentDate = afterEditDay0Time;
        //如果是今天，保存当前时刻，不是保存对应日期的0点
        if(selectDateVal==0) afterEditData.dayContentDate = thisTime;
        printLog(thisFucName,"日期发生改变");

        //更新dataId
        // let afterEditDataId = afterEditData.dayContentDate.toString() + (Math.floor(Math.random()*8999)+1000).toString();;
        let afterEditDataId = createRecordId(afterEditData.dayContentDate,themeId);
        afterEditData.dataId = afterEditDataId
        printLog(thisFucName,"记录id已更新：",afterEditDataId);


        let afterEditDate = new Date(afterEditData.dayContentDate);
        afterEditDateText = (afterEditDate.getFullYear() + "/" + zeroFormat(afterEditDate.getMonth()+1) + "/" + zeroFormat(afterEditDate.getDate())).toString();
        if(getCrtTime().year == afterEditDateText.substring(0,4)){
            afterEditDateText = afterEditDateText.substring(5,10);
        }
        afterEditDateText = EnWeek[afterEditDate.getDay()] + " " + afterEditDateText;
    }else{
         //printLog(thisFucName,"日期未发生改变，记录ID不变：",afterEditData.dataId);
    }

    //记录内容发生了变动
    if(beforeEditData.dayContentDetail.toString() != afterEditRecord.toString()){

        printLog(thisFucName,"记录内容发生改变");
        changeFlag = true;
        afterEditData.dayContentDetail = afterEditRecord;
    }

    if(changeFlag){
        //更新本地数据  localData 和 searchResult
        let localFullData = getLocalRecordData();
        delete localFullData.recordData[themeId].recordList[dataId];
        localFullData.contentUpdateTime = thisTime;
        localFullData.recordData[themeId].updateTime = thisTime;
        localFullData.recordData[themeId].recordList[afterEditData.dataId] = {};
        localFullData.recordData[themeId].recordList[afterEditData.dataId].dayContentDate = afterEditData.dayContentDate;
        localFullData.recordData[themeId].recordList[afterEditData.dataId].dayContentDetail = afterEditData.dayContentDetail;

        updateLocalRecordData(localFullData);
        printLog(thisFucName,"日记录修改完成，修改后记录内容：",afterEditData);
        updateUndownloadInfo(themeId);
        checkIfDownload();
        
        //被修改记录如果当前显示在页面中，需要更新页面展示内容
        if($("div.recordList[dataid='"+dataId+"']").length > 0){
            
            let searchFlag = (pageRequestParams?.searchType&&pageRequestParams?.searchKey) ? true : false;

            let srhHighLightKey = searchFlag ? pageRequestParams.searchKey : null;
           
            let ignoreHighLight = (searchFlag&&pageRequestParams.searchType==2) ? true : false;

            let pageIndexType = $(".recordListSortAction").attr("indextype");

            afterEditData.themeId = themeId;
            let newRecordHtml = recordTrans2Html(afterEditData,decodeURIComponent(srhHighLightKey),ignoreHighLight,pageIndexType);
            
            $("div.recordList[dataid="+dataId+"]").html(newRecordHtml);
            $("div[dataid="+dataId+"]").replaceWith(newRecordHtml);
            $(".recordList").off("mouseenter").on("mouseenter",function(){isShowRecordAcitons($(this).attr("dataid"),$(this).attr("themeid"),1)});
        
            $(".recordList").off("mouseleave").on("mouseleave",function(){
                const thisRcdMenuPanel = $(".recordActionPanel[dataid="+$(this).attr("dataid")+"]");
                    isShowRecordAcitons($(this).attr("dataid"),$(this).attr("themeid"),0)
            });
            contentLinksInit(ignoreHighLight);
        }

        showToast("记录编辑成功",2500);
    }else{
        showToast("记录内容无任何变动",2000);
        printLog(thisFucName,"日记录内容未产生任何变动");
    }
    
    closeAllWin();
    recordDownloadRemind();
    checkShowingRecordUpdate();

}

/**
*删除日记录
*@param themeId 要删除的记录的主题id
*@param dataId 要删除的日记录id
*/
function deleteDayRecord(dataId,themeId){
    const thisFucName = arguments.callee.name.toString();

    if(!notNull(themeId)||!notNull(dataId)){
        printLog(thisFucName,"缺少必要参数：",{"dataId":dataId,"themeId":themeId});
        showToast("操作失败");
        return;
    }

    let fullData = getLocalRecordData();
    let fullDataExist = checkRecordData(1,fullData);

    if(!fullDataExist){
        showTip("本地存储数据存在异常或已经丢失，请检查后刷新重试。", "", 0, 6);
        printLog(thisFucName,"本地存储数据异常：",fullData);
        return;
    }

    if(!fullData.recordData?.[themeId]){
        showTip("找不到要删除的记录，当前主题已经被删除了。","页面当前展示内容发生变动，刷新看看吧。",0,6);
        printLog(thisFucName,"主题不存在：",fullData);
        return;
    }

    if(!fullData.recordData[themeId]?.recordList
        || getJsonLength(fullData.recordData[themeId].recordList)==0 
        || !fullData.recordData[themeId].recordList?.[dataId])
    {
        showTip("当前记录已经被删除了","页面当前展示内容发生变动，刷新看看吧。",0,6);
        printLog(thisFucName,"找不到要删除的数据：",fullData.recordData[themeId]);
        return;

    }

    delete fullData.recordData[themeId].recordList[dataId];

    //把删除对象从页面移除
    $("div.recordList[dataid='"+dataId+"']").remove();
    
    
    //更新本地数据及列表标题的updateTime
    let updateDate = new Date();
    fullData.contentUpdateTime = updateDate.getTime();
    fullData.recordData[themeId].updateTime = updateDate.getTime();
    updateLocalRecordData(fullData);

    closeAllWin();

    showToast("记录删除成功",2500);
    printLog(thisFucName,"删除成功,dataId：",dataId);

    updateUndownloadInfo(themeId);
    checkIfDownload();

    checkShowingRecordUpdate();

    if(getJsonLength(fullData.recordData[themeId].recordList)==0){
        printLog(thisFucName,"【"+fullData.recordData[themeId].themeName+"】主题下记录数据已全部删除");

        const unsaveChangedInfo = localGet("undownload_changed_info");
        if(!notNull(unsaveChangedInfo) || getJsonLength(unsaveChangedInfo) == 0){
            $("#saveRecordBtn .dotReminder").hide();
            return;
        }

        if(unsaveChangedInfo.hasOwnProperty(themeId)){
            delete unsaveChangedInfo[themeId];
            localSave("undownload_changed_info",unsaveChangedInfo);
            $("#saveRecordBtn .dotReminder").hide();
        }
    }

    if($("div[class='recordList'").length == 0){
        autoLoadNextPage(1);
        printLog(thisFucName,"页面当前显示dayRecord全部删除，已请求下一页内容");
    }

}

/**
 * 
 * 将记录转换为页面展示的HTML
 * @param item：需要转换的记录（最内层，recordData[index]）
 * @param highLightKeyWord：需要高亮处理的字符串
 * @param ignoreHighLight：是否需要忽略高亮处理，为true时忽略
 * @param indexType:记录内容序号的类型
 * 
 **/
function recordTrans2Html(item,highLightKeyWord,ignoreHighLight,indexType){
    let recordHTML = "";
    if(typeof(item)!="undefined"&&item!=null&&item!=""){
        //let isDarkMode = $("body").hasClass("dark-mode")?" dark-mode":"";

        let recordDate = new Date(item.dayContentDate);
        let recordWeek = "";
        recordDate = new Date(recordDate);
        EnWeek = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
        ChWeek = ["周日","周一","周二","周三","周四","周五","周六"];
        recordWeek = ChWeek[recordDate.getDay()];
        
        let recordDateText = getTimeText(item.dayContentDate,1,0,1,1).dateText;
        let todayDate = new Date();
        let todayTag = "";
        let mondayTag = "";
        if(todayDate.getFullYear() == recordDate.getFullYear()
            && todayDate.getMonth() == recordDate.getMonth()
            && todayDate.getDate() == recordDate.getDate()){
            todayTag = "<em class='todayTag'>今天 · </em>";
        }
        if(recordDate.getDay()==1) mondayTag = " recordListMon";

        recordHTML += "<div class='recordList"+ mondayTag + "' themeid='" + item.themeId + "' dataid='" + item.dataId + "'>"
                        +"<div class='dayRecordDate'>"
                            +"<p class='recordDate' datetime='"+item.dayContentDate+"'>" + todayTag + recordDateText + " " + recordWeek +"</p>"
                            +"<div class='recordActionArea'>"
                                //+"<p class='recordActionBtn editBtn'><em class='iconfont icon-edit'></em><span class='recordBtnText editBtnText'>编辑</span></p>"
                                //+"<p class='recordActionBtn moreBtn'><em class='iconfont icon-more'></em><span class='recordBtnText moreBtnText'>更多</span></p>"
                            +"</div>"
                        +"</div>";

        //当前日记录的内容条数
        let maxListItem = 0;
        if(notNull(item.dayContentDetail)){
            maxListItem  =  item.dayContentDetail.length;
        }

        recordHTML += "<div class='dayRecordItems'>";
        if(maxListItem != 0){
            $.each(item.dayContentDetail,function(dayContentDetailIndex,dayContentDetailItem){

                let contentLinks = extractLinks(dayContentDetailItem);
                let showDayRecordContent =  dayRecordHighlightDeal(dayContentDetailItem,highLightKeyWord,item.dataId,ignoreHighLight);

                let contentIndex = "";//内容序号
                let recordItemNoIndexClass = "";

                switch(indexType){
                    case "number":
                        contentIndex = "<span class='itemNum number'>" + (dayContentDetailIndex+1) + ".</span>";
                        break;

                    case "dot":
                        contentIndex = "<span class='itemNum dot'>•</span>";
                        break;

                    case "hide":
                        contentIndex = "<span class='itemNum hidden'></span>";
                        recordItemNoIndexClass = "noIndex";
                        break;

                    default:
                        contentIndex = "<span class='itemNum number'>" + (dayContentDetailIndex+1) + ".</span>";
                        break;

                }


                recordHTML = recordHTML + '<div class="dayRecordItem">'+contentIndex+'<p class="recordItem '+recordItemNoIndexClass+'">' + showDayRecordContent.replace(/\&#10;/g,"<br>") + '</p></div>';
                
            }); 
        }
       
        // let regex = /(?:https?:\/\/|www\.|\/\/)[^\s\/$?#]*\.[^\s\/$?#]*(?:\/[^\s\/$?]+)*(?:\?[^?\s\/]*)?(?:#[^#\s\/]*)?/g;

        // //let regex = /(?:https?:\/\/|www\.|\/\/)[^\s/$.?#].[^\s]*/g;
        

        recordHTML += "</div></div>";
    }
    return recordHTML;
}

/**
*展示记录
*@param startIndex  展示记录开始序号
*@param pageSize   每页展示条数
*@param data   指定展示数据，没有默认为全部数据
*@param forceShowAsSearchResult 强制以搜索结果样式展示，默认为false
*@Param themeId  指定的主题名称数组
*@Param displayRule  指定的展示规则
*/
function showRecords(startIndex,pageSize,data,forceShowAsSearchResult,themeId,displayRule){

    //隐藏顶部「设置菜单」
    $('#navMenu li:has(#configBtn)').hide();

    const thisFucName = arguments.callee.name.toString();
    const pageRequestParams = getQueryParams();
    let pageTitle = PROJECT_NAME;
    

    //用于拼接展示内容的数据对象
    let fullData = {};

    //最终是否要以搜索结果样式展示
    let finalShowAsSearchResult = notNull(forceShowAsSearchResult) ? forceShowAsSearchResult : false;
    let dateSearch = false;
    let showTheme = {};//当前展示的主题信息

    //let isSearch = false;//最终是否以搜索结果样式展示

    //本地全部数据
    let localStorageData = getLocalRecordData();
    let localDataExist = checkRecordData(1,localStorageData);
    
    //本次展示记录的起始序号-如果没有指定起始序号默认为0
    let unknownStartIndex = false;
    if(!notNull(startIndex)){
        startIndex = 0;
        unknownStartIndex = true;
    }

    //本次展示记录的数量
    if(!notNull(pageSize) || pageSize==0){ pageSize = 10; }


    //本次的展示规则
    let finalRule = {};
    finalRule.sortType = "desc";//默认排序规则为时间降序
    finalRule.indexType = "number";//默认序号类型为数字

    //用户上次使用的展示规则
    let recordListPreferance = getUserPreferance("record_list_display");

    //页面当前排序类型
    //let pageSortingType = $(".recordListSortAction").attr("sorttype");

    //页面当前序号类型
    //let pageIndexType = $(".recordListSortAction").attr("indextype");

    //确定最终排序规则
    if(displayRule?.sortType){

        finalRule.sortType = displayRule.sortType;

    }else if(recordListPreferance?.sortType){

        finalRule.sortType = recordListPreferance.sortType;

    }

    if(displayRule?.indexType){

        finalRule.indexType = displayRule.indexType;

    }else if(recordListPreferance?.indexType){

        finalRule.indexType = recordListPreferance.indexType;

    }

    printLog(thisFucName,"本次展示规则：",finalRule);



    //判断是否有指定展示数据，组装本次展示数据(保证组装后的数据有recordData和themeInfo)
    if(notNull(data) && data?.recordData){
        fullData = data;
        showTheme = data.themeInfo;
        printLog(thisFucName,"本次将展示指定数据",fullData);

        
    //没有指定要展示的数据
    }else{
        
        //当前需展示搜索结果，但未指定搜索结果数据，则从本地存储中获取搜索结果进行展示
        if(finalShowAsSearchResult){
            //在这里
            //let searchResult = localGet("search_result");
            //let searchResultLegal = checkRecordData(2,searchResult);
            
            printLog(thisFucName,"未提供搜索结果数据，无法展示搜索结果",data);
            showToast("数据异常");
            $(".loadingTip").remove();
            showTip("出错了：未找到相关数据...","建议刷新页面后重新尝试",0,6);
            return;

        //没有指定data，并且不是搜索结果展示，展示指定主题的记录
        }else{
            let recordsData = {};

            //有指定主题
            if(notNull(themeId)){
               
                recordsData = getRecordsByTheme(1,themeId);
                if(!notNull(recordsData)){
                    printLog(thisFucName,"未获取到指定主题id的数据",themeId);
                    // showToast("获取主题数据异常 ("+themeId+")");
                    showToast("主题已被删除，无法查看");
                    return;
                }else{
                    printLog(thisFucName,"有指定主题，本次将展示id为「"+themeId+"」的主题数据");
                }
            //没有指定主题,展示上次展示的主题
            }else{
                let lastShowedTheme = getUserPreferance("last_showed_theme");
                if(notNull(lastShowedTheme)&&lastShowedTheme.hasOwnProperty("id")){
                    recordsData = getRecordsByTheme(1,lastShowedTheme.id);
                    printLog(thisFucName,"无指定展示主题，将展示上次展示的主题数据",lastShowedTheme);
                    if(!notNull(recordsData)){
                        printLog(thisFucName,"无法获取上次展示的主题数据，将展示最晚创建主题(默认主题)的记录数据");
                        recordsData = getRecordsByTheme();
                    }
                }else{
                    let defaultTheme = getRecordsByTheme();
                    if(notNull(defaultTheme)){
                        recordsData = defaultTheme;
                        printLog(thisFucName,"无指定展示主题，本次将展示最晚创建主题(默认主题)的记录数据",defaultTheme);
                    }else{
                        //默认主题获取结果为空，说明本地没有任何数据
                        //showToast("未获取到可展示的数据");
                        printLog(thisFucName,"无指定展示主题，最晚创建主题(默认主题)获取失败");
                        $(".loadingTip").remove();
                        $("#nodataDiv").show();
                        $("#contentAll").hide();
                        //展示除【设置】外的其他菜单
                        $('#navMenu li').not(':has(#configBtn)').show();
                        return; 
                    }
                }
            }

            //如果用getRecoresByTheme获取到要展示的数据结构有问题，认为没有可展示的数据
            if(!notNull(recordsData) || !recordsData?.recordList || !recordsData?.themeInfo){
                printLog(thisFucName,"记录展示失败，获取展示数据异常:",recordsData);
                $(".loadingTip").remove();
                $("#nodataDiv").show();
                $("#contentAll").hide();
                //展示除【设置】外的其他菜单
                $('#navMenu li').not(':has(#configBtn)').show();
                removeQueryParam("themeId");
                return;
            }

            fullData.recordData = recordsData.recordList;
            showTheme = recordsData.themeInfo;

            printLog(thisFucName,"本次展示数据已组装完成：",fullData);
        }
        
    }

    //将组装好的数据进行显示逻辑处理
    stopLoadingNextFlag = false;
    let arrayData = [];//用于排序和页码处理的数组

    //若目标展示数据不为空,把recordData的数据push到数组
    if(getJsonLength(fullData.recordData) != 0){
        $.each(fullData.recordData,function(index,item){
            item.dataId = index;
            arrayData.push(item);
        });
        //将arrayData转成json，增强在控制台输出的美观性
        let jsonData = {};
        jsonData.arrayData = arrayData;

        //过滤空数据
        arrayData= fliterNullData(arrayData);

    }

    printLog(thisFucName,"数据数组已生成，共"+arrayData.length+"条",{"arrayData":arrayData});

    //标题行展示的排序按钮文案
    let sortBtnText = "";
    let sortBtnIconClassName = "icon-sort";

    //按照finalRule进行排序
    if(finalRule.sortType == "desc"){
        sortBtnText = "最新"
        arrayData.sort(function(a,b){return b.dayContentDate - a.dayContentDate;});

    }else if(finalRule.sortType == "asc"){
        sortBtnText = "最早"
        arrayData.sort(function(a,b){return a.dayContentDate - b.dayContentDate;});

    }

    //列表容器展示内容处理
    let contentTitle = "";//列表标题
    let contentListHtml = "";//列表内容
    let list_btm_info = "";//列表底部提示语

    //当前为搜索结果展示，展示搜索关键词标题、搜索结果数、回到首页按钮
    if(finalShowAsSearchResult){
        $("#navMenu").hide();
        let searchTypeText = "";
        let showKeyText =  "<span class='searchResultTitleKey' title='"+fullData.key+"'>"+fullData.key+"</span>";
        if(fullData.searchType == 1){//1表示内容搜索
            searchTypeText = "内容含";
        }else if(fullData.searchType == 2){
            dateSearch = true;
            searchTypeText = "日期为";
        }
        /*if(innerTextTransform(showKeyText).length > 10){
            showKeyText = showKeyText.substring(0,10) + "...";
        }*/

        //组装搜索结果标题
        contentTitle = "<div id='contentTitle'><p id='contentTitleSearch'><span class='searchResultTitleLeft'>" + searchTypeText+ "</span> 「"+ showKeyText +"<span class='searchResultTitleRight'>」的搜索结果</span></p>";

        //组装记录总数说明文字
        if(data.resultNum > 0){

            contentTitle += "<div class='recordListTitleRight' sorttype='"+finalRule.sortType+"' indextype='"+finalRule.indexType+"'><p class='recordTotalNumText'>"+"从 "+(data.totalNum).toLocaleString()+" 条记录中找到 "+(data.resultNum).toLocaleString()+" 条</p>"
            
            //分割线
            contentTitle += "<span class='splitText'>|</span>";

            //组装排序按钮
            contentTitle += "<p class='recordListSortAction' sorttype='"+finalRule.sortType+"' indextype='"+finalRule.indexType+"'><span class='recordSortText'>"+sortBtnText+"</span><em class='recordSortIcon iconfont "+sortBtnIconClassName+"'></em></p></div></div>";
        

        }else{

            // contentTitle += "<div class='recordListTitleRight' sorttype='"+finalRule.sortType+"'><p class='recordTotalNumText'>"+"未在 "+data.totalNum+" 条记录中找到匹配结果</p></div></div>"
            contentTitle += "<div class='recordListTitleRight'><p class='recordTotalNumText'>"+"未在 "+(data.totalNum).toLocaleString()+" 条记录中找到匹配结果</p></div></div>"
        }

        

    //不是搜索结果展示
    }else{
        //当前为全部数据展示，展示对应主题的主题名称和总记录数*/
        $("#navMenu").show();

        //组装标题
        contentTitle = "<div id='contentTitle'><div id='contentThemeTitle' themeId='"+showTheme.id+"'><p id='themeTitleText'>"+ showTheme.name +"</p><span class='switchThemeBtn iconfont icon-to-down'><span></div>";

        if(arrayData.length > 0){
            //组装记录总数说明文字
            contentTitle += "<div class='recordListTitleRight' sorttype='"+finalRule.sortType+"' indextype='"+finalRule.indexType+"'><p class='recordTotalNumText'>"+"共 "+ (arrayData.length).toLocaleString()+" 条记录</p>";

            //分割线
            contentTitle += "<span class='splitText'>|</span>";

            //组装排序按钮
            contentTitle += "<p class='recordListSortAction' sorttype='"+finalRule.sortType+"' indextype='"+finalRule.indexType+"'><span class='recordSortText'>"+sortBtnText+"</span><em class='recordSortIcon iconfont "+sortBtnIconClassName+"'></em></p></div></div>";
        
        }else{
            // contentTitle += "<div class='recordListTitleRight' sorttype='"+finalRule.sortType+"'></div></div>";
            contentTitle += "</div>";
        }
        
    }

    

    //列表具体数据展示处理

    //分页逻辑处理
    let endIndex = startIndex + pageSize -1;//当前页展示的最后一条记录的序号
    // let dataMax = arrayData.length;//本次展示的全部记录总数
    // let maxIndex = arrayData.length - 1;
    let maxIndex = arrayData.length>0 ? arrayData.length-1 : 0;

    //最终本次一页展示的数据数组
    let finalThisPageData = new Array(pageSize);

    //存在下一页数据
    let nextPageExist = false;

    //本页展示记录序号不能超过最后一个
    if(endIndex >= maxIndex){
        //本页最末位序号大于全部记录最大序号，即为当前为最后一页
        list_btm_info = "<p class='listBtmTip'>没有更多了</p>";                     

        endIndex = maxIndex;
        if(startIndex > maxIndex || arrayData.length == 0) {
            //开始序号超过数据最大序号 或 可展示数据为空，本次展示内容为空
            finalThisPageData = null;

        }else{

            //展示内容为从startIndex开始往后所有的数据
            finalThisPageData.length = maxIndex - startIndex + 1;
                
            $.each(finalThisPageData,function(index,item){

                let thisPageDataIndex = startIndex + index;
                //再次确保本次将展示的记录不超过记录的最大序号
                if(thisPageDataIndex <= maxIndex){
                    //获取上次展示的最后一个记录 之后的全部
                    finalThisPageData[index] = arrayData[thisPageDataIndex];
                }
            });

            
        }

    }else{//本页展示数据不超过全部记录

        $.each(finalThisPageData,function(index,item){

                finalThisPageData[index] = arrayData[startIndex + index];

        });

        nextPageExist = true;
    }

    //打印本次展示序号
    printLog(thisFucName,{"startIndex":startIndex,"endIndex":endIndex,"maxIndex":maxIndex},{"finalThisPageData":finalThisPageData});

    //本页展示数据不为空
    if(notNull(finalThisPageData)&&finalThisPageData.length>0){
        printLog(thisFucName,"本页展示"+pageSize+"条数据："+startIndex+" - "+endIndex,finalThisPageData);
        $.each(finalThisPageData,function(index,item){
            if(item!=""&&item!=null){
                item.themeId = showTheme.id;
                contentListHtml += recordTrans2Html(item,fullData.key,dateSearch,finalRule.indexType);
            }else{
                printLog(thisFucName,index,"为空");
            }
        });

    }else{//本页展示数据为空
        stopLoadingNextFlag = true;//页面滚动到底部时不再自动加载下一页
        printLog(thisFucName,"本页展示数据为空 [ "+startIndex+" - "+endIndex+" ] ");
        if(finalShowAsSearchResult && startIndex==0){
            list_btm_info = "<p class='listBtmTip nodata'>没有符合搜索条件的记录</p>";
            $("#searchPage").fadeOut(300);
        }else if(!finalShowAsSearchResult && startIndex==0){

            list_btm_info = "<p class='listBtmTip nodata'>还没有记录任何内容</p>";
        }
    }
        
    contentListHtml += list_btm_info;

    //按照本次展示规则 更新本地theme_list_display规则
    updateUserPreferance("record_list_display",finalRule);

    //如果是第一页需要填充页面
    if(0 == $(".recordList").length || 0 == startIndex){
        $("#mainContent").html("");
        //printLog("当前展示第一页，页面数据清空");
        $("#mainContent").html(contentTitle + contentListHtml);
    }else{
        //不是第一页，在当前页面基础上追加内容
        //$(".loadingTip").remove();
        $("#mainContent").append(contentListHtml);
    }

    closeAllWin();
    $("#contentAll").show();
    if(nextPageExist){
        if($("#mainContent .loadingTip").length > 0){
            $("#mainContent .loadingTip").remove();
        }
        $("#mainContent").append("<p class='loadingTip'>点击加载更多数据</p>");

        $(".loadingTip:not(.loading)").off("click").on("click",function(){
            autoLoadNextPage(1);
        });
      
       //定义当前主题列表的翻页事件
       $("#mainContent").off("loadNextPage").on("loadNextPage",function(){

            const pageShowedRecords = $(".recordList[dataid][themeid="+showTheme.id+"]");
            let nextpageStartIndex = pageShowedRecords.length;

            if(pageShowedRecords.length > 0){
                const lastRecordId = pageShowedRecords.last().attr("dataid");

                if(unknownStartIndex){

                    //页面当前展示的最后一条记录在全部记录中对应的序号
                    const pageLastIndex = arrayData.findIndex(item => item.dataId == lastRecordId);
                    
                    //页面当前展示的最后一条记录没被删除，则本次从下一条开始展示
                    if(pageLastIndex != -1){

                        nextpageStartIndex = pageLastIndex + 1;

                    //页面当前展示的最后一条记录已被删除，则获取页面中已展示的记录总数量，从下一条开始往后展示
                    }else{
                        nextpageStartIndex = pageShowedRecords.length; 
                    }
                    
                    printLog(thisFucName,"本次从页面已展示的最后一条记录开始");
                }
            }

            printLog(thisFucName,"即将加载下一页");
            $("#mainContent .loadingTip").text("正在加载更多数据...");
            $("#mainContent .loadingTip").addClass("loading");

            let loadingTime = 0;
            const maxLoadingTime = 500;
            const minLoadingTime = 100;
            loadingTime = getRandomNumber(minLoadingTime,maxLoadingTime,3);

            setTimeout(function(){ 
                showRecords(nextpageStartIndex,0,data,finalShowAsSearchResult,showTheme.id,finalRule);
                loadingFlag = false;//标记为非处理状态
            },loadingTime);
        
       });

    }else{
        if($("#mainContent .loadingTip").length > 0){
            $("#mainContent .loadingTip").remove();
        }
        $("#mainContent").off("loadNextPage");
    }

    //$("#mainContent").attr("themeid",showTheme.id); 

    if(startIndex == 0) $(window).scrollTop(0);
    
    printLog(thisFucName,"页面展示记录已更新");

    //顶部导航栏标题的内容
    let searchResultTitleHTML = "";

    //最终是搜索结果展示
    if(finalShowAsSearchResult){
        searchResultTitleHTML = "<em class='topBackBtn iconfont icon-to-left'></em><p  id='pageTopTitle_search' class='topNavTitle themeName' title='"+showTheme.name+"'>"+showTheme.name+"</p>";
        $("#navTitle").html(searchResultTitleHTML);
        $(".topBackBtn").off("click").on("click",function(){cancelSearch();});
        
        let reSearchBtnHTML = "<div id='continueSearchTextBtn'><em class='iconfont icon-search'></em><p>重新搜索</p></div>";
        if($("#continueSearchTextBtn").length > 0){
            $("#continueSearchTextBtn").remove();
        }
        $("#topNavContent").append(reSearchBtnHTML);

        $("#continueSearchTextBtn").off("click").on("click",function(){
            showSearchPage();
            let aimSearchType = pageRequestParams?.searchType ? pageRequestParams.searchType : 1;
            switchSearchType(aimSearchType);
        });


        $("#searchPage").fadeOut(300);
        if(fullData.searchType == 2){
            printLog("showRecords","日期搜索成功，搜索页已隐藏");
        }else{
            if(getJsonLength(fullData.recordData)!=0){
                printLog("showRecords","关键词搜索成功，搜索关键词已高亮处理，搜索页已隐藏");
            }else{
                printLog("showRecords","关键词搜索成功，无匹配关键词的记录，搜索页已隐藏");
            }
        }

        pageTitle = "“"+fullData.key+"”的搜索结果 - "+showTheme.name+" - "+PROJECT_NAME;

        updateQueryParam("searchType",fullData.searchType);
        updateQueryParam("searchKey",innerTextTransform(fullData.key));


    //不是搜索结果展示
    }else{
        //searchResultTitleHTML = "<p class='topNavTitle' id='pageTopTitle'>"+PROJECT_NAME+"</p>";
        //$("#navTitle").html(searchResultTitleHTML);

        if($("#continueSearchTextBtn").length>0){
            $("#continueSearchTextBtn").remove();
        }

        
        //展示除【设置】外的其他菜单
        $('#navMenu li').not(':has(#configBtn)').show();

        //防止菜单被隐藏
        if(!$("#navMenu").is(":visible")){
            $("#navMenu").show();
        }

        pageTitle = showTheme.name + " - " + PROJECT_NAME;

        removeQueryParam("searchKey");
        removeQueryParam("searchType");
    }

    $("title").html(pageTitle);
    $("#nodataDiv").hide();
    $("#txtFileUpload").val("");
    $(".recordList").off("mouseenter").on("mouseenter",function(){
        isShowRecordAcitons($(this).attr("dataid"),$(this).attr("themeid"),1)
        $(".recordList").off("mouseleave").on("mouseleave",function(){
                isShowRecordAcitons($(this).attr("dataid"),$(this).attr("themeid"),0)
        });
    });
    
    updateQueryParam("showType","recordList");
    updateQueryParam("themeId",showTheme.id);
    removeQueryParam("fromThemeId");

    showTheme.showTime = getTimeText(null,null,null,0,0).fullText;
    updateUserPreferance("last_showed_theme",showTheme);

    // printLog(thisFucName,"准备配置contentLinksInit，finalShowAsSearchResult：",finalShowAsSearchResult);
    let ignoreLinkHighLight = (finalShowAsSearchResult&&fullData?.searchType!=1) ? true : false;
    contentLinksInit(ignoreLinkHighLight);

    initThemeSwitch();

    checkIfDownload();

    //清除actionBar及其计时器
    if(typeof actionBarTimer!=="undefined" && actionBarTimer) clearTimeout(actionBarTimer);
    $(".toastActionBar").remove();

    loadingFlag = false;
    if($(".loadingTip.loading").length > 0){
        $(".loadingTip.loading").text("点击加载更多数据");
        $(".loadingTip.loading").removeClass("loading");
    }
    
    //定义排序按钮的点击事件
    $(".recordListSortAction").off("click").on("click",function(){

        //若页面当前展示的有记录排序面板 移除
        const recordSortPanel = $(".menuPanel.recordListSortPanel");
        if(recordSortPanel.length > 0){
            $(recordSortPanel).trigger("removeMenuPanel");
            return;
        }

        //给当前点击按钮增加hover样式
        if(!$(this).hasClass("hover")){
            $(this).addClass("hover");
        }

        let pageSortType = "";//页面当前排序规则

        let descSortClassName = "";//最新纪录类名
        let ascSortClassName = "";//最早记录类名

        let numIndexClassName = "";//数字序号类名
        let dotIndexClassName = "";//圆点序号类名
        let noIndexClassName = "";//隐藏序号类名

        const pageShowingSortType = $(this).attr("sorttype");
        const pageShowingIndexType = $(this).attr("indextype");

        printLog("pageShowingSortType:",pageShowingSortType);
        printLog("pageShowingIndexType:",pageShowingIndexType);

        switch(pageShowingSortType){
            case "desc":
                descSortClassName = "showing";
                ascSortClassName = "unshown";
                break;

            case "asc":
                descSortClassName = "unshown";
                ascSortClassName = "showing";
                break;

            default:
                descSortClassName = "showing";
                ascSortClassName = "unshown";
                break;
        }

        switch(pageShowingIndexType){
            case "number":
                numIndexClassName = "showing";
                dotIndexClassName = "unshown";
                noIndexClassName = "unshown";
                break;

            case "dot":
                numIndexClassName = "unshown";
                dotIndexClassName = "showing";
                noIndexClassName = "unshown";
                break;

            case "hide":
                dotIndexClassName = "unshown";
                numIndexClassName = "unshown";
                noIndexClassName = "showing";
                break;


            default:
                numIndexClassName = "showing";
                dotIndexClassName = "unshown";
                noIndexClassName = "unshown";
                break;
        }


        //组装排序面板内容
        let menuPanelHTML = "<div class='menuPanel recordListSortPanel'><p class='panelActionItem menuTypeTitle'>记录排序</p>";

        //最新纪录
        menuPanelHTML += "<p class='panelActionItem "+descSortClassName+"' sortType='desc'>最新纪录</p>";

        //最早记录
        menuPanelHTML += "<p class='panelActionItem "+ascSortClassName+"' sortType='asc'>最早纪录</p>";

        //分割线+内容序号标题
        menuPanelHTML += "<hr><p class='panelActionItem menuTypeTitle'>内容序号</p>";

        //数字序号
        menuPanelHTML += "<p class='panelActionItem "+numIndexClassName+"' indextype='number'>数字</p>";


        //圆点序号
        menuPanelHTML += "<p class='panelActionItem "+dotIndexClassName+"' indextype='dot'>圆点</p>";

        //不展示
        menuPanelHTML += "<p class='panelActionItem "+noIndexClassName+"' indextype='hide'>无</p></div>";

        //如果页面中有其他菜单面板 移除
        let otherMunuPanel = $(".menuPanel");
        if(otherMunuPanel.length > 0){
            $(otherMunuPanel).trigger("removeMenuPanel");
        }

        //展示当前面板
        $(this).closest(".recordListTitleRight").append(menuPanelHTML);

        const thisMenuPanel = $(".recordListSortPanel");
        const thisMenuPanelBtn = $(this);

        //面板位置定位矫正
        $(thisMenuPanel).off("ajustPositon").on("ajustPositon",function(){

            let panelParent = thisMenuPanel.closest(".recordListTitleRight");

            let offset = panelParent.offset();
            let btnWidth = panelParent.width();

            let thisPanelWidth = $(this).width();
            $(this).css({
                // 'min-height': '70px',
                'max-height': 'calc(100vh - 100px)',
                // transform: 'scaleY(1)',
                position: "absolute",
                left: offset.left + btnWidth - thisPanelWidth,
                top: offset.top + 42
            });

        });

        $(thisMenuPanel).trigger("ajustPositon");

        //给面板配置“点击其他地方关闭“效果
        hidePanelByClick(thisMenuPanel,$(this));

        //给面板配置remove事件
        $(thisMenuPanel).off("removeMenuPanel").on("removeMenuPanel",function(){

            const sortBtn = $(".recordListTitleRight .recordListSortAction");
            if($(sortBtn).hasClass("hover")){
                $(sortBtn).removeClass("hover");
            }
            $(this).remove();

        });
        

        //配置排序菜单面板中的点击事件
        $(".recordListSortPanel .panelActionItem:not(.menuTypeTitle)").off("click").on("click",function(e){
            if($(this).hasClass("shown") || $(this).hasClass("menuTypeTitle")){
                return;
            }

            const thisPanel = $(this).parent(".recordListSortPanel");

            if($(this).hasClass("showing")){
                $(thisPanel).trigger("removeMenuPanel");
                return;
            }



            if($(this).hasClass("unshown")){

                let thisDisplayRule = getUserPreferance("record_list_display");
                if(!notNull(thisDisplayRule)){
                    thisDisplayRule = {};
                }

                if($(this).attr("sorttype")!=""){
                    thisDisplayRule.sortType = $(this).attr("sorttype");
                }

                if($(this).attr("indextype")!=""){
                    thisDisplayRule.indexType = $(this).attr("indextype");
                }

                /*if(finalShowAsSearchResult){
                    showRecords(0,0,data,1,showTheme.id,thisDisplayRule);
                }else{
                    showRecords(0,0,0,0,showTheme.id,thisDisplayRule);
                }*/

                //按照本次展示规则 更新本地theme_list_display规则
                    updateUserPreferance("record_list_display",thisDisplayRule);
                    autoShowContentByQueryParams();

                //updateUserPreferance("record_list_display",thisDisplayRule);
            }

        });

    });

    //更新顶部「记录」按钮的点击事件
    $("#addRecordBtn").off("click").on("click",function(){
        showEditWin(0,0,showTheme.id);
    });

    //更新顶部「搜索」按钮的点击事件
    $("#searchBtn").off("click").on("click",function(){
        showSearchPage(showTheme.id);
    });

    //更新顶部「下载」按钮的点击事件
    $("#saveRecordBtn").off("click").on("click",function(){
        downloadFileConfirm([showTheme.id]);
    });

    //更新文件上传输入框的themeid
    $("#reUploadBtn").off("click").on("click",function(){
        uploadFileConfirm(showTheme.id);
        updateUploadFileMethod(showTheme.id);
    });
}


/**
 * 检查当前是否有未保存的变动**/
function checkIfDownload(){

    const thisFucName = arguments.callee.name.toString();
    const pageRequestParams = getQueryParams();

    let unsaveChangeExist = false;

    if(!notNull(pageRequestParams) || !pageRequestParams.hasOwnProperty("showType")){
        printLog(thisFucName,"页面查询参数异常，无法判断是否有未下载变动",pageRequestParams);
        return;
    }

    if(pageRequestParams.showType=="recordList" && !pageRequestParams.hasOwnProperty("themeId")){
        printLog(thisFucName,"页面查询参数异常，缺失themeid，无法判断是否有未下载变动",pageRequestParams);
        return;
    }

    const unsaveChangedInfo = localGet("undownload_changed_info");

    if(!notNull(unsaveChangedInfo) || getJsonLength(unsaveChangedInfo) == 0){
        //printLog(thisFucName,"未获取到未下载变动数据",unsaveChangedInfo);
        $("#saveRecordBtn .dotReminder").hide();
        return;
    }

    if(pageRequestParams.showType == "recordList"){
        let themeId = pageRequestParams.themeId;
        if(!unsaveChangedInfo.hasOwnProperty(themeId) || unsaveChangedInfo[themeId].number == 0){
            //printLog(thisFucName,"当前主题没有未下载的变动：",themeId);
            $("#saveRecordBtn .dotReminder").hide();
            return;  
        }
        unsaveChangeExist = true;
    }else if(pageRequestParams.showType == "themeList"){
        let unsaveThemeAry = []; 
        $.each(unsaveChangedInfo,function(index,item){
            if(item.number > 0){
                let  themeInfo = getRecordsByTheme(1,index);
                unsaveThemeAry.push({"themeId":themeInfo.themeInfo.id,"name":htmlDecode(themeInfo.themeInfo.name)});
                // unsaveThemeText += "\n["+themeInfo.themeInfo.id+"] "+htmlDecode(themeInfo.themeInfo.name);
                unsaveChangeExist = true;
            }
        });

        if(unsaveChangeExist){
            printLog(thisFucName,unsaveThemeAry.length,"个编辑后未下载保存的主题：",unsaveThemeAry);
        }
    }else{
        printLog(thisFucName,"页面查询参数中的showType异常，无法判断是否有未保存变动",pageRequestParams);
        return;
    }

    if(unsaveChangeExist && !$("#saveRecordBtn .dotReminder:visible").length){
        $("#saveRecordBtn .dotReminder").show();
    }

}



function extractLinks(str){
    //该正则（无法排除&#10;）
    //let regex = /(?:https?:\/\/|www\.|\/\/)(?:(?!\p{Script=Han})[\w.])*?(?:\.[\p{L}\d](?:(?!\p{Script=Han})[\w.])*?(?:\?[^\s]*)?(?:#[^\s]*)?)(?:[^\p{Script=Han}\s]|\/)+/gu;
    const regex =/(?:https?:\/\/|www\.|\/\/)(?:(?!\p{Script=Han})[a-zA-Z0-9-]+\.)+(?!\p{Script=Han})[a-zA-Z0-9-]+(?:\/[^\p{Script=Han}\s]*)*(?:\?[^\s#]*)?(?:#[^\s]*)?(?<![^\p{ASCII}])/gu;

    let links = str.match(regex);
    let noBreakLineLinks = [];
    if(links!=null){
        $.each(links,function(index,item){
            //把提取到的链接用&#10;分割
            let itemNoBreakLine = item.split("&#10;");
            //若分割后得到了超过1个值，说明链接中有&#10; 
            if(itemNoBreakLine.length>1){
                $.each(itemNoBreakLine,function(i,t){
                    if(t!=""&&t.match(regex)!=null){
                        //分割后的值不为空，则将提取到的链接删除并插入去掉了&#10;的链接
                        // links.filter(item);
                        noBreakLineLinks.push(t);
                    }
                });
            }else{
                noBreakLineLinks.push(item);
            }
        });
    }
    //printLog("extractLinks",noBreakLineLinks);
    return noBreakLineLinks;
}


 
function getShortLinkName(link){
     let shortLinkName = link;
     let showLength = 35;
     if(link.length>showLength){
         shortLinkName = link.substring(0,showLength) + "...";
     }
     return shortLinkName;
}

function highLightKeyWord(str,keyWord){

    const thisFucName = arguments.callee.name.toString();

    if(!notNull(str)){
        return "";
    }

    if(!notNull(keyWord)){
        return str;
    }

    // printLog(thisFucName,"传入的key:",keyWord);


    let afterHighLight = str;

    if(notNull(keyWord)){
        let strText = innerTextTransform(str);
        let strHtml = str;
        let keyWordText = innerTextTransform(keyWord);
        let keyWordHtml = keyWord;
        let highLightKeyWordTEXT = '<span class="searchKeyHighlight">'+keyWord+'</span>';
        let highLightKeyWordHTML = '&lt;span class="searchKeyHighlight"&gt;'+keyWord+'&lt;/span&gt;';
        if(keyWordText == keyWordHtml){
            // let replacedKeyText = strText.replace(new RegExp(keyWordText.replace(/\\/g, "\\\\"),"g","g"),highLightKeyWordTEXT);
            let replacedKeyText = strText.replace(new RegExp(escapeRegExp(keyWordText), "g"), highLightKeyWordTEXT);
            let replacedKeyHTML = innerHtmlTransform(replacedKeyText);
            let replacedKeyShowHtml = replacedKeyHTML.replace(new RegExp(escapeRegExp(highLightKeyWordHTML),"g"),highLightKeyWordTEXT);
            afterHighLight =  replacedKeyShowHtml;
        }else{
            afterHighLight =  strHtml.replace(new RegExp(keyWordHtml,"g"),highLightKeyWordTEXT);
        }  
    }

    return afterHighLight;
    
}

/*
*高亮搜索结果中的搜索关键词,如果不是搜索结果展示，仅转换链接展示
*dayRecord:需要处理的记录内容
*searchKey:需要高亮展示的词
*dataId:需要处理的记录id
*isIgnore: 是否忽略高亮处理
*
*/
function dayRecordHighlightDeal(dayRecord,searchKey,dataId,isIgnore){
    let afterDealRecord = "";
    let links = extractLinks(dayRecord);
    let dealedIndex = 0;
    if(links!=null&&links.length!=0){
        $.each(links,function(linkIndex,linkItem){
            //上次处理过剩下的字符串
            let lastDealLeftStr = dayRecord.substring(dealedIndex);
            //当前链接在整体字符串中开始的位置
            let thisLinkBegin = dealedIndex + lastDealLeftStr.indexOf(linkItem);
            //当前链接在整体字符串中结束的位置
            let thisLinkEnd = thisLinkBegin + linkItem.length;
            //当前处理链接前面的字符串
            let thisDealBeforeLinkStr = dayRecord.substring(dealedIndex,thisLinkBegin);
            //当前处理链接转化成超链接之后的字符串
            let thisDealLinkStr = "";

            //如果是搜索结果展示（searchKey有值）则需要处理高亮
            if(typeof(searchKey)!="undefined"&&searchKey!=null&&searchKey!=""){
                if(typeof(isIgnore)=="undefined"||!isIgnore){
                    thisDealBeforeLinkStr_highlight = highLightKeyWord(thisDealBeforeLinkStr,searchKey);
                }else{
                    thisDealBeforeLinkStr_highlight = thisDealBeforeLinkStr;
                }
                //如果链接中包含搜索关键字，展示全部链接内容并高亮关键字
                if(linkItem.indexOf(searchKey)!=-1&&!isIgnore){
                    thisDealLinkStr = '<span class="recordInnerLink"><a href="'+ linkItem +'" target="_blank" class="recordContentLink" itemid="' + dataId + linkIndex + '">'+ highLightKeyWord(linkItem,searchKey) +'</a></span>';
                }else{//如果链接不包含关键字，展示链接短名称
                    thisDealLinkStr = '<span class="recordInnerLink"><a href="'+ linkItem +'" target="_blank" class="recordContentLink" itemid="' + dataId + linkIndex + '">'+ getShortLinkName(linkItem) +'</a></span>';
                }
                afterDealRecord += thisDealBeforeLinkStr_highlight + thisDealLinkStr;
                if(linkIndex+1 == links.length && highLightKeyWord(dayRecord.substring(thisLinkEnd),searchKey)){
                    afterDealRecord += highLightKeyWord(dayRecord.substring(thisLinkEnd),searchKey);
                }

            }else{//不是搜索结果页 不需要高亮 只需要处理链接
               thisDealLinkStr = '<span class="recordInnerLink"><a href="'+ linkItem +'" target="_blank" class="recordContentLink" itemid="' + dataId + linkIndex + '">'+ getShortLinkName(linkItem) +'</a></span>';
               afterDealRecord += thisDealBeforeLinkStr + thisDealLinkStr;
               if(linkIndex+1 == links.length){
                   afterDealRecord += dayRecord.substring(thisLinkEnd);
               }
            }
            
            dealedIndex += thisDealBeforeLinkStr.length + linkItem.length;                  
        });
    }else{//如果没有链接
        // if($("#contentTitleSearch").is(":visible") || $("#searchPage").is(":visible")){
        if(typeof(searchKey)!="undefined"&&searchKey!=null&&searchKey!=""){
            if(isIgnore){
                afterDealRecord = dayRecord;
            }else{
                afterDealRecord = highLightKeyWord(dayRecord,searchKey);
            }
        }else{
            afterDealRecord = dayRecord;
        }
    }
    
    return afterDealRecord;
}

function showDeleteSearchHistory(themeId){
    if(!notNull(themeId)){
        printLog(arguments.callee.name.toString(),"缺失themeId，无法编辑历史搜索记录");
        return;
    }
    let localFullData = getLocalRecordData();
    let localFullDataExist = checkRecordData(1,localFullData);
    if(!localFullDataExist){
        printLog(arguments.callee.name.toString(),"本地存储数据缺失，无法编辑历史搜索记录");
        return;
    }

    let localThemeObj = localFullData.recordData[themeId];
    if(!notNull(localThemeObj)){
        printLog(arguments.callee.name.toString(),"找不到对应的主题，无法编辑历史搜索记录");
        return;
    }

    let searchHistory = localThemeObj.searchHistory;
    if(searchHistory!=null&&searchHistory.length!=0){
        let deleteSearchHistoryItems = "";
        $.each(searchHistory,function(index,item){
            if(item!=null&&item!=""&&typeof(item)!="undefined"){
                deleteSearchHistoryItems+= "<p class='deletingHistoryItem' itemdata='"+innerHtmlTransform(item)+"'><span class='searchHistoryItemText'>" + item + "</span><em class='iconfont icon-guanbi deleteHistoryIcon'></em></p>"
                /*if($("#searchPage").hasClass("dark-mode")){
                    deleteSearchHistoryItems+= "<span class='deletingHistoryItem dark-mode' itemdata='"+innerHtmlTransform(item)+"'><span>" + item + "</span><em class='iconfont icon-guanbi deleteHistoryIcon dark-mode'></em></span>"
                }else{
                    deleteSearchHistoryItems+= "<span class='deletingHistoryItem' itemdata='"+innerHtmlTransform(item)+"'><span>" + item + "</span><em class='iconfont icon-guanbi deleteHistoryIcon'></em></span>"
                }*/
            }
        });
        $("#searchHistoryItems").html(deleteSearchHistoryItems);

        //给每个历史记录绑定点击删除事件
        $(".deleteHistoryIcon").off("click").on("click",function(){
            let deleteKey = $(this).parent(".deletingHistoryItem").attr("itemdata");
            deleteKeySearchHistory($(this),themeId,deleteKey);
        });
    }else{
       $("#searchHistoryItems").html("<p style='color:#999'>暂时没有搜索记录...</p>");
    }   
}

/*删除主题下的搜索记录*/
function deleteKeySearchHistory(keyObj,themeId,deleteKey,forceAll){

    if(!notNull(themeId)){
        printLog("删除历史搜索记录异常，主题id缺失");
        return;
    }

    let localRemainData = getLocalRecordData();
    let localRemainDataExist = checkRecordData(1,localRemainData);
    if(!localRemainDataExist){
        printLog("删除历史搜索记录异常，本地数据缺失");
        return;
    }

    let localThemeData = localRemainData.recordData[themeId];
    if(!notNull(localThemeData)){
        printLog("删除历史搜索记录异常，找不到主题数据");
        return;
    }

    let searchHistoryRemain = localThemeData.searchHistory;

    //删除主题下全部搜索记录
    if(forceAll){
        searchHistoryRemain = [];

    //删除主题下指定搜索记录
    }else if(!forceAll && notNull(deleteKey)){
        if(!notNull(keyObj)){
            printLog("删除历史搜索记录异常，页面key对象缺失");
            return;
        }

        if(searchHistoryRemain.indexOf(deleteKey)!=-1){
            $(keyObj).parent(".deletingHistoryItem").remove();
            searchHistoryRemain.splice(searchHistoryRemain.indexOf(deleteKey),1);
        }else{
            printLog("删除历史搜索记录异常，不存在的搜索记录");
            return;
        } 

    }else{
        printLog("删除历史搜索记录异常，参数异常",forceAll,deleteKey);
        return;
    }
  
    localRemainData.recordData[themeId].searchHistory = searchHistoryRemain;
    updateLocalRecordData(localRemainData);

    if(searchHistoryRemain.length == 0){
        $("#searchHistoryItems").html("<p style='color:#999'>暂时没有搜索记录...</p>"); 
        $("#startDeleteHistoryBtn").addClass("hidden");
        $("#deletingHistoryBtns").addClass("hidden");
    }
}

/*
*展示当前主题的关键词搜索记录
*/
function showKeySearchHistory(themeId){

    if(!notNull(themeId)){
        printLog(arguments.callee.name.toString(),"缺失themeId，无法获取历史搜索记录");
        return;
    }

    let localFullData = getLocalRecordData();
    let localFullDataExist = checkRecordData(1,localFullData);
    if(!localFullDataExist){
        printLog(arguments.callee.name.toString(),"本地存储数据缺失，无法获取历史搜索记录");
        return;
    }

    let localThemeObj = localFullData.recordData[themeId];
    if(!notNull(localThemeObj)){
        printLog(arguments.callee.name.toString(),"找不到对应的主题，无法获取历史搜索记录");
        return;
    }

    let searchHistory = localThemeObj.searchHistory;
    //如果历史搜索记录不为空
    if(notNull(searchHistory)&&searchHistory.length!=0){
        printLog(arguments.callee.name.toString(),"获取到最近搜索记录" + searchHistory.length + "条：",searchHistory);
        let searchHistoryItems = "";
        // let deleteSearchHistoryItems = "";
        $.each(searchHistory,function(index,item){
            if(item!=null&&item!=""&&typeof(item)!="undefined"){
                searchHistoryItems += "<p class='searchHistoryItem'><span class='searchHistoryItemText'>" + item + "</span></p>"
            }
        });

        //展示历史搜索记录
        $("#searchHistoryItems").html(searchHistoryItems);

        //展示“删除”按钮
        $("#startDeleteHistoryBtn").removeClass("hidden");
        $("#deletingHistoryBtns").addClass("hidden");

        //给“删除”按钮绑定点击事件
        $("#startDeleteHistoryBtn").off("click").on("click",function(){
            //点击“删除”按钮时，隐藏删除按钮，展示“全部删除”和“完成”按钮
            $("#startDeleteHistoryBtn").addClass("hidden");
            $("#deletingHistoryBtns").removeClass("hidden");
             //历史搜索记录展示删除图标
             showDeleteSearchHistory(themeId);
            // $("#searchHistoryItems").html(deleteSearchHistoryItems);
            
            //给“全部删除”按钮绑定点击事件
            $("#deleteAllHistoryBtn").off("click").on("click",function(){
                showTip("确认删除「"+localThemeObj.themeName+"」主题下的全部搜索记录吗？","删除后无法恢复，请谨慎操作。",4,8,{"themeId":themeId});
            });
             //给“完成”按钮绑定点击事件
            $("#doneDeleteHistoryBtn").off("click").on("click",function(){
                $("#startDeleteHistoryBtn").removeClass("hidden");
                $("#deletingHistoryBtns").addClass("hidden");
                showKeySearchHistory(themeId);
            });

        });

        //历史搜索记录的点击事件
        $(".searchHistoryItem").off("click").on("click",function(){
            keySearch(innerTextTransform($(this).html()));
        });

        $("#keySearchHistory").off("mouseover").on("mouseover",function(e){
            $("#deleteSarchHistoryBtn").show();
        });
        $("#keySearchHistory").off("mouseout").on("mouseout",function(){
            $("#deleteSarchHistoryBtn").hide();
        });
        printLog(arguments.callee.name.toString(),"最近搜索记录已展示");
    }else{
        $("#startDeleteHistoryBtn").addClass("hidden");
        $("#deletingHistoryBtns").addClass("hidden");
        printLog(arguments.callee.name.toString(),"未获取到最近搜索记录");
        $("#searchHistoryItems").html("<p style='color:#999'>暂时没有搜索记录...</p>");
    }
}

/*展示搜索页面（全屏弹窗）*/
function showSearchPage(themeId){
    let crtData = getLocalRecordData();
    let crtDataExist = checkRecordData(1,crtData);
    if(!crtDataExist){
        showTip("当前还没有任何记录，要开始记录吗？","若有过往下载的txt数据文件可上传后继续记录。",2,3);
        return;
    }

    if(!notNull(themeId)){
        let requestParams = getQueryParams();
        if(!notNull(requestParams) || !requestParams.hasOwnProperty("themeId")){
            printLog(arguments.callee.name.toString(),"无法展示搜索页面，页面请求参数缺失themeId",requestParams);
            showToast("参数异常，请刷新页面后重试",3000);
            return;
        }

        if(!notNull(requestParams.themeId)){
            printLog(arguments.callee.name.toString(),"无法展示搜索页面，页面请求参数缺失themeId",requestParams);
            showToast("参数异常，请刷新页面后重试",3000);
            return;
        }

        themeId = requestParams.themeId;
    }

    if(!notNull(crtData.recordData[themeId])){
        printLog(arguments.callee.name.toString(),"无法展示搜索页面，不存在的themeId",themeId);
        showToast("参数异常，请刷新页面后重试",3000);
        return;
    }

    let themeObj = crtData.recordData[themeId];

    if(getJsonLength(themeObj.recordList) == 0){
        showTip("当前主题下还没有任何记录，要开始记录吗？","若有过往下载的txt数据文件可上传后继续记录。",2,9,{"themeId":themeId});
        return;
    }

    closeAllWin();
    
    $("body").addClass("noScroll");
    $("#searchLogo").html("搜索 · " + themeObj.themeName);
    $("#searchLogo").attr("title",themeObj.themeName);
    
    //默认选中“内容搜索”
    if($("#keySearchBtn").hasClass("searchTabSelected")){
        $("#searchPage").fadeIn(200);
        $("#searchPage").scroll(0,0);
        printLog(arguments.callee.name.toString(),"searchPage已展示,当前为内容搜索");
        $("#searchKey").val("");
        $("#searchKey").focus();
        showKeySearchHistory(themeObj.themeId);
    //日期搜索
    }else if($("#dateSearchBtn").hasClass("searchTabSelected")){
        searchDateMonth(-9999);
        $("#searchPage").fadeIn(200);
        $("#searchPage").scroll(0,0);
        printLog(arguments.callee.name.toString(),"searchPage已展示,当前为日期搜索");
    }else{
       return; 
    }
}


/*关闭搜索页面（全屏弹窗）*/
function cancelSearch(){
    //在搜索输入页面点击关闭按钮
    if($("#searchPage").is(":visible")){
        $("#searchPage").fadeOut(200);
        $("#searchKey").val("");
        printLog(arguments.callee.name.toString(),"searchPage已隐藏");

    //在搜索结果展示页面点击“返回首页”图标
    }else{
        let localFullData = getLocalRecordData();

        let requestParams = getQueryParams();
        if(!notNull(requestParams)|| !requestParams.hasOwnProperty("themeId")){
            showRecords();
        }

        $("#navTitle").html("<p class='topNavTitle' id='pageTopTitle'>"+PROJECT_NAME+"</p>");
        showRecords(null,null,null,null,requestParams.themeId);
        printLog(arguments.callee.name.toString(),"搜索结果页已关闭");
    }
    removeQueryParam("searchType");
    removeQueryParam("searchKey");
    $("body").removeClass("noScroll");
}



/**
 * 通过关键词搜索日记录
 * @param key为搜索关键词 string类型 
 * @param themeId为主题id
 * @param autoShowResult 默认为true  自动展示搜索结果页面
 * @param updateKeyHistory
 * */
function keySearch(key,themeId,autoShowResult,updateKeyHistory){

    const thisFucName = arguments.callee.name.toString();

    let requestParams = getQueryParams();

    if(!notNull(themeId)){
        if(notNull(requestParams)&&requestParams.hasOwnProperty("themeId")){
            themeId = requestParams.themeId;
        }else{
            printLog(thisFucName,"主题id缺失，无法完成搜索");
            return;
        } 
    }

    //如果传入的key为空，获取输入框内的数据
    let keyWord = notNull(key)?key:$("#searchKey").val().trim();

    //是否更新关键词搜索记录
    let updateSearchKeyHistory = (notNull(updateKeyHistory)&&!updateKeyHistory) ? false : true;

    if(!notNull(keyWord)){
        printLog(thisFucName,"搜索关键词为空");
        return;
    }else{
        printLog(thisFucName,"开始搜索，关键词：",keyWord);
    }

    autoShowResult = notNull(autoShowResult) ? autoShowResult : true;

    //本地没有已存储任何数据或本地不存在主题id对应的数据
    let localFullData = getLocalRecordData();
    let localFullDataExist = checkRecordData(1,localFullData);

    if(!notNull(localFullData) && autoShowResult){
        showTip("当前还没有任何记录，要开始记录吗？","也可上传数据文件后继续记录。",2,3);
        return;
    }

    if(!notNull(localFullData.recordData[themeId])){
        printLog(thisFucName,"本地不存在对应主题，无法搜索",localFullData.recordData[themeId]);
        return;
    }

   
    //将搜索关键词进行反转义
    let htmlkeyWord = innerHtmlTransform(keyWord);
    let textKeyWord = innerTextTransform(keyWord);

    if(updateSearchKeyHistory){
        //处理历史搜索记录
        let searchHistory = localFullData.recordData[themeId].searchHistory;

        //历史搜索记录不为空
        if(notNull(searchHistory)&&searchHistory.length!=0){
            let keyHistory = searchHistory.indexOf(htmlkeyWord);
            if(keyHistory == -1){//历史搜索记录不存在当前搜索关键词
                if(searchHistory.length<=29){//历史搜索记录不超过30，直接记录当前关键词
                    searchHistory.unshift(htmlkeyWord);
                }else{//历史搜索记录等于30，删除最末一个，并记录当前关键词为第一个
                    searchHistory.splice(29,1);
                    searchHistory.unshift(htmlkeyWord);  
                }
            }else{//历史搜索记录已存在当前搜索关键词，移到最前面（删除历史记录，并将当前关键词记录为第一个）
                searchHistory.splice(keyHistory,1);
                searchHistory.unshift(htmlkeyWord);
            }
        }else{//历史搜索记录为空
            searchHistory = [htmlkeyWord];
        }
        let noNullDataAry = [];//转义且滤空后用于存储的搜索记录数组
        noNullDataAry = searchHistory.filter(function(val){return val && val.trim();});
        localFullData.recordData[themeId].searchHistory = noNullDataAry;
        updateLocalRecordData(localFullData);
        printLog(thisFucName,innerTextTransform(localFullData.recordData[themeId].themeName)+"的搜索历史记录已更新，本次插入：",textKeyWord,);
        //历史搜索记录处理完毕
    }
    

    //搜索结果处理-开始    
    let searchResult = {};
    searchResult.searchType = 1;//1表示内容搜索
    searchResult.recordData = {};

    let localTotalNum = getJsonLength(localFullData.recordData[themeId].recordList);
    if(localTotalNum == 0){
        showTip("「" + localFullData.recordData[themeId].themeName + "」主题下还没有任何记录，要开始记录吗？","也可上传数据文件后继续记录。",2,9,{"themeId":themeId});
        return false;
    }
    printLog(thisFucName,"获取到本地数据" + localTotalNum + "条");
    //获取搜索结果（遍历记录判断是否有关键词）
    $.each(localFullData.recordData[themeId].recordList,function(index,item){
        $.each(item.dayContentDetail,function(i,t){
            let itemText = innerTextTransform(t);
            let itemHtml = t;
            if(textKeyWord == htmlkeyWord){
                if(textKeyWord!=""&&itemText.indexOf(textKeyWord)!= -1){
                    searchResult.recordData[index] = item;
                }
            }else{
               if(htmlkeyWord!=""&&itemHtml.indexOf(htmlkeyWord)!= -1){
                    searchResult.recordData[index] = item;
                } 
            }
        });
        
    });
    //let searchResultNum = getJsonLength(searchResult.recordData);
    searchResult.key = htmlkeyWord;//本次搜索关键词(未转义)
    searchResult.totalNum = localTotalNum;//本次搜索时，当前主题下的记录总数
    searchResult.resultNum = getJsonLength(searchResult.recordData);//本次搜索结果总数
    searchResult.themeInfo = {};
    searchResult.themeInfo.id = themeId;
    searchResult.themeInfo.name = localFullData.recordData[themeId].themeName;
    printLog(thisFucName,"搜索到匹配结果数："+getJsonLength(searchResult.recordData),searchResult);
    
    if(autoShowResult){
        showRecords(0,0,searchResult,1);
    }

    return searchResult;
}

/**
 * 是否将超链接展示为完整内容
 * link:超链接对象
 * showFLag:true表示展示完整内容
 * isIgnore:true表示忽略查询关键字的高亮处理
 * */
function shortLinkAutoFull(link,showFlag,isIgnore){

    const thisFucName = arguments.callee.name.toString();
    const pageRequestParams = getQueryParams();

    let ignoreHighLight = notNull(isIgnore) ? isIgnore : false;

    let thisLink = link.attr("href"); 
    let shortNameLink = getShortLinkName(thisLink);
    let thisShowLinkHTML = link[0].outerHTML;
    let hoverHtml = thisLink;
    let leaveHtml = shortNameLink;

    if(!ignoreHighLight){
        //在这里  改为通过页面查询参数获取key进行高亮处理
        //let searchResult = localGet("search_result");
        //if(typeof(searchResult)!="undefined"&&searchResult!=null&&!ignore){

        if(pageRequestParams?.searchKey){
            let key = decodeURIComponent(pageRequestParams.searchKey);
            //printLog(thisFucName,"decodeURIComponent key:",key);
            if(thisLink.indexOf(key)!=-1){
                leaveHtml = highLightKeyWord(thisLink,key,ignoreHighLight);
            }
        }
    }

    if(showFlag){
        link.html(hoverHtml);
    }else{
        link.html(leaveHtml);
    }
}

/**
 * 给记录中的超链接绑定复制链接、自动展示完整链接等事件
 * @pamram ifIgnore 是否忽略链接中的高亮字段处理
 * */
function contentLinksInit(ifIgnore){
    // printLog("contentLinksInit配置开始，ifIgnore：",ifIgnore);
    $(".recordContentLink").off("mouseover").on("mouseover",
        function(e){
            //printLog("mouse over link",new Date());
            let linkOuterSpan = $(this).parent(".recordInnerLink");
            copyLinkPop(e,1,linkOuterSpan);
            shortLinkAutoFull($(this),1,ifIgnore);
        }
    );

    $(".recordContentLink").off("mouseout").on("mouseout",
        function(e){
            // printLog("mouse out link",new Date());
            let linkOuterSpan = $(this).parent(".recordInnerLink");
            copyLinkPop(e,0,linkOuterSpan);
            shortLinkAutoFull($(this),0,ifIgnore);
            $(".recordContentLink").removeAttr("style");
        }
    );

    $(".recordContentLink").off("click").on("click",function(e){
        $(".copyLinkPop").remove();
        shortLinkAutoFull($(this),0,ifIgnore);
        $(this).blur();
    });
    
}

/*复制超链接气泡提示*/
function copyLinkPop(e,showFlag,linkBox){
    if(showFlag){
        let nowPopup = $(linkBox).children(".copyLinkPop");
        // printLog("nowPopup：",nowPopup.length);
        if(nowPopup.length != 0){
            $.each(nowPopup,function(i,t){
                t.remove();
            });   
        }

        let popup = "<div class='copyLinkPop'>复制链接</div>";
        $(linkBox).append(popup);
        
        let mouseX = e.clientX;
        let mouseY = e.clientY;
        //let popLeft = mouseX;
        //let popTop = mouseY + 20;
        let copyLinkPop = $(linkBox).children(".copyLinkPop");
        //let fullLink = $(link).children(".recordContentLink");
        let linkOffset = $(linkBox).offset();
        let linkWidth = $(linkBox).width();
        let popupWidth = $(copyLinkPop).width();
        let popupHeight = $(copyLinkPop).height();

        //let popupLeft = linkOffset.left + (linkWidth-popupWidth)/2;
        let popupLeft = mouseX - 10;
        let popupTop = linkOffset.top - popupHeight - 8;
        copyLinkPop.css("left",popupLeft);
        copyLinkPop.css("top",popupTop);
        $(copyLinkPop).mouseover(function(){
            //printLog("mouse over popup");
            clearTimeout(removeCopyPop);
            let link = $(this).siblings(".recordContentLink");
            link.css("color","var(--themeColor)");
        });
        $(copyLinkPop).mouseout(function(){
            //printLog("mouse out popup");
            // removeCopyPop = setTimeout(function(){copyLinkPop.remove();printLog("popup removed");},200);
            let link = $(this).siblings(".recordContentLink");
            link.removeAttr("style");
            copyLinkPop.remove();
        });
        $(copyLinkPop).off("click").on("click",function(e){
            let linkValue = $(this).siblings(".recordContentLink").attr("href");
            copyText(linkValue);
            copyLinkPop.remove();
        });
        // if($("body").hasClass("dark-mode")){
        //    $(copyLinkPop).addClass("dark-mode"); 
        // }
        $(copyLinkPop).show();
    }else{
        let copyLinkPop = $(linkBox).children(".copyLinkPop");
        removeCopyPop = setTimeout(function(){copyLinkPop.remove();},200); 
    }

}


/*复制超链接内容*/
function copyText(str){
    let tempElement = $("<textarea>");
    tempElement.val(str);

    $(document.body).append(tempElement);
    tempElement.css({
        //display: "none"
        position: "fixed",
        top: "-9999px"
    });

    tempElement.select();
    document.execCommand("copy");
    printLog("链接复制成功：",str)
    tempElement.remove();
    showToast("链接已复制");
}

/**
 * 切换搜索类型（内容/日期)
 * searchType == 1 内容搜索
 * searchType == 2 内容搜索
 */
function switchSearchType(searchType,themeId){

    if(!notNull(themeId)){
        printLog(arguments.callee.name.toString(),"缺失themeid,将从页面请求参数获取");
        let requestParams = getQueryParams();
        if(notNull(requestParams) && requestParams.hasOwnProperty("themeId")){
            themeId = requestParams.themeId;
        }else{
            printLog(arguments.callee.name.toString(),"从页面请求参数获取themeid失败");
            return;
        }
    }

    if(!notNull(searchType)){
        printLog(arguments.callee.name.toString(),"缺失searchType");
        searchType = 1;
    }
   
    if(searchType == 1){
        if(!$("#keySearchContent:visible").length){
            printLog(arguments.callee.name.toString(),"切换为「内容搜索」");
            $("#dateSearchContent").hide();
            $("#keySearchContent").show();
            showKeySearchHistory(themeId);
            $("#searchKey").focus()
            $("#keySearchBtn").addClass("searchTabSelected");
            $("#dateSearchBtn").removeClass("searchTabSelected");   
        }
    }else if(searchType == 2){
        if(!$("#dateSearchContent:visible").length){
            printLog(arguments.callee.name.toString(),"切换为「日期搜索」");
            $("#keySearchContent").hide();
            $("#dateSearchContent").show();
            $("#dateSearchBtn").addClass("searchTabSelected");
            $("#keySearchBtn").removeClass("searchTabSelected");
            searchDateMonth(null,themeId);
        }
    }else{
        printLog(arguments.callee.name.toString(),"未知的搜索类型");
        return;
    }  
} 

/** 
 * 判断指定主题下是否存在指定日期的记录
 * @param dayTime 日期时间戳
 * @param themeId 主题id
 */
function dateSearch(dayTime,themeId){

    if(!notNull(dayTime)||isNaN(new Date(dayTime))){ 
        printLog(arguments.callee.name.toString(),"日期搜索失败，dayTime参数异常",dayTime);
        return;
    }

    if(!notNull(themeId)){
        let requestParams = getQueryParams();
        if(notNull(requestParams) && requestParams.hasOwnProperty("themeId")){
            themeId = requestParams.themeId;
        }else{
            printLog(arguments.callee.name.toString(),"日期搜索失败，themeId参数缺失",themeId);
            return;
        }
        
    }

    let fullData = getLocalRecordData();
    let fullDataExist = checkRecordData(1,fullData);
    if(!fullDataExist){
        printLog(arguments.callee.name.toString(),"日期搜索失败，本地数据获取异常",fullData);
        return;
    }

    let themeObj = fullData.recordData[themeId];
    if(!notNull(themeObj)){
        printLog(arguments.callee.name.toString(),"日期搜索失败，获取主题数据异常",fullData);
        return;
    }

    let themeRecordList = themeObj.recordList;
    if(!notNull(themeObj)){
        printLog(arguments.callee.name.toString(),"日期搜索失败，主题内记录数据异常",themeObj);
        return;
    }

    let result = {};
    result.exist = false;

    let searchDate = new Date(dayTime);
    result.key = searchDate.getFullYear()+"/"+zeroFormat(searchDate.getMonth()+1)+"/"+zeroFormat(searchDate.getDate());
    
    result.searchType = 2;//日期搜索
    result.recordData = {};
    $.each(themeRecordList,function(index,item){
        let recordDate = new Date(Number(item.dayContentDate));
        if(searchDate.getFullYear()==recordDate.getFullYear()&&
            searchDate.getMonth()==recordDate.getMonth()&&
            searchDate.getDate()==recordDate.getDate()){
            //result.resultNum ++;
            result.exist = true;
            result.recordData[index] = {};
            result.recordData[index] = item;
        }
    });
    result.resultNum = getJsonLength(result.recordData);

    result.totalNum = getJsonLength(themeRecordList);

    result.themeInfo = {};
    result.themeInfo.id = themeObj.themeId;
    result.themeInfo.name = themeObj.themeName;

    return result;
    printLog("dateSearch搜索结果：",result);

}

/**
 * 切换日期搜索的展示月份
 * @param num:0表示当前月；-9999表示当前显示月;其他数字从当前显示月调整
 * @param themeId 主题id
*/
function searchDateMonth(num,themeId){
    const thisFucName = arguments.callee.name.toString();

    let loadingDays = '<p style="text-align:center;line-height:400px;color:grey">加载中...</p>';
    $("#calendarDays").html(loadingDays);

    let nowDate = new Date();
    let crtMonthDate = new Date(nowDate.getFullYear(),nowDate.getMonth(),1); 
    let crtMonthTime = crtMonthDate.getTime();
    let targetMonthTime = crtMonthTime;
    let targetDate = null;
    let fullMonthDays = "";
    let crtShowMonthTime = Number($("#calendarTitle").attr("dateData"));
    if(typeof(crtShowMonthTime)=="undefined"||crtShowMonthTime == null || isNaN(crtShowMonthTime)){
        crtShowMonthTime = crtMonthTime;
    }

    if(typeof(num)=="undefined"){
        targetDate = new Date(crtShowMonthTime); 
        printLog(thisFucName,"未指定月份，将展示当前月："+ targetDate.getFullYear()+"-"+zeroFormat(targetDate.getMonth()+1));
    }else if(num == 0){
        targetDate = crtMonthDate;
        printLog(thisFucName,"展示当前月份："+ targetDate.getFullYear()+"-"+zeroFormat(targetDate.getMonth()+1));
    }else if(num == -9999){
        targetDate = new Date(crtShowMonthTime); 
        printLog(thisFucName,"展示月份不变："+ targetDate.getFullYear()+"-"+zeroFormat(targetDate.getMonth()+1));

    }else{
        targetDate = new Date(crtShowMonthTime); 
        targetDate.setMonth(targetDate.getMonth() + num);
        let direction = num>0?"后":"前";
        printLog(thisFucName,"月份向"+direction+"调整"+Math.abs(num)+"月："+targetDate.getFullYear()+"-"+zeroFormat(targetDate.getMonth()+1));
    }

    targetDate.setDate(1);
    let firstDayWeek = targetDate.getDay()>0?targetDate.getDay():7;
    let targertNextDate = new Date(targetDate);
    targertNextDate.setMonth(targertNextDate.getMonth() + 1);
    targertNextDate.setDate(targertNextDate.getDate() - 1);
    let lastDay = targertNextDate.getDate();
    let lastDayWeek = targertNextDate.getDay()>0?targertNextDate.getDay():7;
    let endNum = lastDay + 7-lastDayWeek;  

    let maxDayNum = 42;

    //let isDarkMode = $("#searchPage").hasClass("dark-mode")?" dark-mode":"";
    for(let i=1;i<maxDayNum+1;i++){
        let dayNum = i-firstDayWeek+1;
        let dayDate = new Date(targetDate.getFullYear(),targetDate.getMonth(),dayNum);
        
        if(i%7==1&&dayNum<=lastDay){
            fullMonthDays = fullMonthDays + "<div class='calendarWeeks'>";
        }
        
        if(dayNum<1 || dayNum>lastDay){
            if(dayNum<=endNum){
                fullMonthDays += "<div class='calendarDay notThisMonth' dateDate='"+dayDate.getTime()+"'></div>";
            }
        }else if(dayNum<=lastDay){
            let existResult = dateSearch(dayDate.getTime(),themeId);
            //let dateId = existResult.dataId;
            let dayRecordNum = 0;

            //对今天的文案和样式特殊处理
            let datePreText = "这";
            let dateTodayClassName = "";
            if(targetDate.getFullYear()==nowDate.getFullYear()&&targetDate.getMonth()==nowDate.getMonth()&&dayNum==nowDate.getDate()){
                datePreText  = "今";
                dateTodayClassName = "calendarDayToday";

            }

            if(existResult?.exist == true){
                //let dayRecordNum = getJsonLength(existResult.data[dateId].dayContentDetail);
                // let dayRecordLength = existResult.data[dateId].dayContentDetail.toString().length;
                $.each(existResult.recordData,function(index,item){
                    dayRecordNum += getJsonLength(item.dayContentDetail);
                });
                if(existResult.resultNum>1){
                    fullMonthDays += "<div title='"+datePreText+"天记录了 "+ existResult.resultNum +" 条，共 "+ dayRecordNum +" 项内容。' class='calendarDay "+dateTodayClassName+"' dateData='"+dayDate.getTime()+"'>"+dayNum+"</div>";  
                }else{
                    fullMonthDays += "<div title='"+datePreText+"天记录了 "+ dayRecordNum +" 项内容' class='calendarDay "+dateTodayClassName+"' dateData='"+dayDate.getTime()+"'>"+dayNum+"</div>";  
                }
             }else{
                fullMonthDays += "<div title='"+datePreText+"天还没有记录任何内容' class='calendarDay nodataDay' dateData='"+dayDate.getTime()+"'>"+dayNum+"</div>";  
             }
            
        }
        if(i%7==0 && dayNum<=endNum){
            fullMonthDays += "</div>";
        }
    }
        
    $("#calendarTitle").attr("datedata",targetDate.getTime());
    $("#calendarTitleText").html(targetDate.getFullYear()+" 年 "+zeroFormat(targetDate.getMonth()+1) + " 月");

    $("#calendarDays").html(fullMonthDays);
    if($(".menuPanel.searchMonthSelectPanel").length!=0){
        $(".menuPanel.searchMonthSelectPanel").trigger("ajustPositon");
    }
    $(".calendarDay").off("click").on("click",function(){
        let existResult = dateSearch(Number($(this).attr("datedata")));
        showDateSearchResult(existResult);
    }); 

    //配置月份选择面板展示事件
    $("#calendarTitle").off("click").on("click",function(){
        const searchMonthSelectPanel = $(".menuPanel.searchMonthSelectPanel");
        if(searchMonthSelectPanel.length > 0){
            searchMonthSelectPanel.trigger("removeMenuPanel");
            return;
        }
        // $("#searchPage").css("overflow","");
        if(!$(this).hasClass("hover")){
            $(this).addClass("hover");
        }
        const nowDate = new Date();
        const crtShowMonthDate =  new Date(Number($(this).attr("datedata")));
        const crtShowYear = crtShowMonthDate.getFullYear();
        const crtShowMonth = crtShowMonthDate.getMonth()+1;
        const yearOptinNum = nowDate.getFullYear()+LATEST_YEAR_OPTION_AFTER_NOW-EARLIEST_YEAR_OPTION+1;
        let yearOptionArray = new Array(yearOptinNum);
        

        //组装面板内容
        let searchMonthSelectPanelHTML = "<div class='menuPanel searchMonthSelectPanel'>";

        //年份
        searchMonthSelectPanelHTML += "<div class='monthSelectOption year'>";
        
        $.each(yearOptionArray,function(index,item){
            let selectedYearClass = "";
            yearOptionArray[index] = EARLIEST_YEAR_OPTION+index;
            if(yearOptionArray[index] == crtShowYear){
               selectedYearClass = " selected";
            }
            searchMonthSelectPanelHTML += "<p class='monthSelectOptionItem year"+selectedYearClass+"'><span class='monthSelectOptionValue year' select-year-value='"+(EARLIEST_YEAR_OPTION+index)+"'>" + (EARLIEST_YEAR_OPTION+index) + "</span></p>";
        });

        searchMonthSelectPanelHTML += "</div>";


        //月份
        searchMonthSelectPanelHTML += "<div class='monthSelectOption month'>";

        for(var i=1;i<13;i++){
            let selectedMonthClass = "";
            if(i == crtShowMonth){
               selectedMonthClass =  " selected";
            }
            searchMonthSelectPanelHTML += "<p class='monthSelectOptionItem month"+selectedMonthClass+"'><span class='monthSelectOptionValue month' select-month-value='"+i+"'>" + i + "</span><span class='monthSelectOptionText'>月</span></p>";
        }

        searchMonthSelectPanelHTML += "</div>";

        searchMonthSelectPanelHTML += "</div>"


        $(this).append(searchMonthSelectPanelHTML);


        const thisMenuPanel = $(".searchMonthSelectPanel");
        
        //面板位置定位矫正
        $(thisMenuPanel).off("ajustPositon").on("ajustPositon",function(){

            let panelParent = $("#calendarTitle");

            let offset = panelParent.offset();
            let btnWidth = panelParent.width();

            let thisPanelWidth = $(this).width();
            $(thisMenuPanel).css({
                // 'min-height': '70px',
                'max-height': 'calc(100vh - 100px)',
                position: "absolute",
                left: offset.left,
                top: offset.top+40
            });

            //滚动选项至当前选中日期和年份展示出来
            const yearList = $(".monthSelectOption.year")[0];
            const monthList = $(".monthSelectOption.month")[0];

            const selectedYear = $(".monthSelectOptionItem.year.selected")[0];
            const selectedMonth = $(".monthSelectOptionItem.month.selected")[0];

            let yearOffSet = selectedYear.offsetTop - (yearList.clientHeight / 2) + (selectedYear.offsetHeight / 2);
            yearOffSet = Math.max(0, Math.min(yearOffSet, yearList.scrollHeight - yearList.clientHeight));
            let monthOffSet = selectedMonth.offsetTop - (monthList.clientHeight / 2) + (selectedMonth.offsetHeight / 2);
            monthOffSet = Math.max(0, Math.min(monthOffSet, monthList.scrollHeight - monthList.clientHeight));

            yearList.scroll(0,yearOffSet);
            monthList.scroll(0,monthOffSet);

        });

        $(thisMenuPanel).trigger("ajustPositon");

        //给面板配置“点击其他地方关闭“效果
        hidePanelByClick(thisMenuPanel,$(this));

        //面板移除事件绑定
        $(thisMenuPanel).off("removeMenuPanel").on("removeMenuPanel",function(){
            const monthTitle = $("#calendarTitle");
            if(monthTitle.hasClass("hover")){
                monthTitle.removeClass("hover");
            }
            $(this).remove();
            // $("#searchPage").css("overflow","overlay");

        });

        //配置面板中【年份】的点击事件
        $("#calendarTitle .searchMonthSelectPanel .monthSelectOptionItem.year").off("click").on("click",function(e){
            e.stopPropagation();
            if($(this).hasClass("selected")){
                return;
            }else{
                $(".searchMonthSelectPanel .monthSelectOptionItem.year").removeClass("selected");
                $(this).addClass("selected");
                $(".searchMonthSelectPanel .monthSelectOptionItem.month").removeClass("selected");
            }
        });


        //配置面板中【月份】的点击事件
        $("#calendarTitle .searchMonthSelectPanel .monthSelectOptionItem.month").off("click").on("click",function(){
            if(!$(this).hasClass("selected")){
                $(".searchMonthSelectPanel .monthSelectOptionItem.month").removeClass("selected");
                $(this).addClass("selected");
            }
            //计算出需要向前或向后的月份数量
            const selectedYear = Number($(".monthSelectOptionItem.year.selected .monthSelectOptionValue").attr("select-year-value"));
            const selectedMonth = Number($(".monthSelectOptionItem.month.selected .monthSelectOptionValue").attr("select-month-value"));

            const pageShowDate = new Date(Number($("#calendarTitle").attr("datedata")));
            const pageShowYear = pageShowDate.getFullYear();
            const pageShowMonth = Number(pageShowDate.getMonth())+1;
            let yearNum =  selectedYear - pageShowYear;
            let monthNum =  selectedMonth - pageShowMonth;
            let differenceNum = yearNum*12 + monthNum;
            if(differenceNum!=0){
                searchDateMonth(differenceNum,themeId);
            }
            $(".menuPanel.searchMonthSelectPanel").trigger("removeMenuPanel");
           
        });

    });

}

/**
 * 在日期搜索页面 展示每个日期的搜索结果标记
 * @param existResult 搜索结果
 * @param forceShowResult 对应日期没有记录时强制展示搜索结果
 * */
function showDateSearchResult(existResult,forceShowResult){

    if(!notNull(existResult) && !forceShowResult){
        printLog(arguments.callee.name.toString(),"标记日期搜索结果失败，参数异常");
        return;
    }


    /*let searchResult = {};
    searchResult.recordData = existResult.recordData;
    searchResult.themeInfo = existResult.themeInfo;
    searchResult.searchType = 2;//2表示日期搜索
    searchResult.key = existResult.key;
    // let fullData = getLocalRecordData();
    searchResult.totalNum = existResult.totalNum;
    searchResult.resultNum = existResult.resultNum;
    //let searchDate = new Date(Number(existResult.data[existResult.dataId].dayContentDate));
    //searchResult.key = searchDate.getFullYear()+"/"+zeroFormat(searchDate.getMonth()+1)+"/"+zeroFormat(searchDate.getDate());
    localSave("search_result",searchResult);*/
    if(existResult.exist){
        //在这里 考虑是否还需要保存
        //localSave("search_result",existResult);
        showRecords(undefined,undefined,existResult,1); 
    }else{
        showToast("这天没有记录任何内容",2000);
        if(forceShowResult){
            showRecords(undefined,undefined,existResult,1); 
        }
    }
}

/**
 * 获取指定主题的记录
 * @param type: 1 用ID获取； 2 用名称获取；空默认取创建时间最晚的主题
 * @param theme主题id或名称
 * 返回结果(数据格式与本地存储相同)
 * result
 *  -themeID
 *   - -themeName
 *   - recordList
 *   - updatedTime
 **/
function getRecordsByTheme(type,theme){

    const thisFucName = arguments.callee.name.toString();

    let result = {};

    let localRecords = getLocalRecordData();
    let localRecordsExist = checkRecordData(1,localRecords);

    if(!localRecordsExist){
        printLog(thisFucName,"本地数据获取异常：",localRecords);
        return null;
    }

    //本地存储中有数据记录
    // if(notNull(localRecords) && notNull(localRecords.recordData) && getJsonLength(localRecords.recordData)!=0){
    let localRecordDataExist = checkRecordData(1,localRecords); 

    if(!localRecordDataExist){
        return null;
    }

    let arrayThemeRecord = [];
    $.each(localRecords.recordData,function(index,item){
        arrayThemeRecord.push(item);
    });

       
    if("undefined"==typeof(type)||null==type){
        //未指定获取方式，默认取创建时间最晚的一个主题
        //按主题创建日期倒序排序
        arrayThemeRecord.sort(function(a,b){return b.createTime - a.createTime;});

        result.recordList = arrayThemeRecord[0].recordList;
        result.themeInfo = {};
        result.themeInfo.id = arrayThemeRecord[0].themeId;
        result.themeInfo.name = arrayThemeRecord[0].themeName;
        result.themeInfo.createTime = arrayThemeRecord[0].createTime;
        result.themeInfo.updateTime = arrayThemeRecord[0].updateTime;
        result.themeInfo.recordNum = getJsonLength(arrayThemeRecord[0].recordList);

    }else if(1 == type){
        //按照主题ID获取主题记录
        if(!localRecords.recordData.hasOwnProperty(theme)){
            result = null;
            printLog(thisFucName,"本地找不到指定的主题id:",theme);
        }else{

            result.recordList = localRecords.recordData[theme].recordList;
            result.themeInfo = {};
            result.themeInfo.id = localRecords.recordData[theme].themeId;
            result.themeInfo.name = localRecords.recordData[theme].themeName;
            result.themeInfo.createTime = localRecords.recordData[theme].createTime;
            result.themeInfo.updateTime = localRecords.recordData[theme].updateTime;
            result.themeInfo.recordNum = getJsonLength(localRecords.recordData[theme].recordList);
        }
        

    }else if(2 == type){
        //按照主题名称获取主题记录
        printLog(thisFucName,"暂不支持通过主题名称获取主题记录");
        return null;

    }else{
        printLog(thisFucName,"无法识别的主题搜索类型",type);
        result = null;
    }

    // printLog(thisFucName,{"result":result});
    return result;

}


/**展开或收起主题选择菜单*/
function toggleSwitchThemePanel(){
    if(!$("#switchThemePanel:visible").length){
        let localFullData = getLocalRecordData();
        if(notNull(localFullData)&&notNull(localFullData.recordData)&&localFullData.recordData.length!=0){
            let themeList = [];
            $.each(localFullData.recordData,function(index,item){
                let theme = {};
                theme.id = item.themeId;
                theme.name = item.themeName;
                theme.createTime = item.createTime;
                themeList.push(theme);
            });
            themeList.sort(function(a,b){return b.createTime - a.createTime});

            let thisThemeId = "";
            let requestParams = getQueryParams();
            if(!notNull(requestParams) || !requestParams.hasOwnProperty("themeId")){
                //页面请求参数没有themeId时通过页面contentThemeTitle获取
                if(notNull($("#contentThemeTitle").attr("themeId"))){
                    thistheme = $("#contentThemeTitle").attr("themeId");
                }else{
                    printLog("无法确定当前展示的主题");
                    return;
                }
            }else{
                thisThemeId = requestParams.themeId;
            }

            let themeListHTML = "<div id='goThemeList' class='panelActionItem themeItemList'><p class='themeItem'>主题列表</p><em class='iconfont icon-to-right'></em></div><hr><p class='panelActionItem menuTypeTitle'>切换主题</p>";;
            $.each(themeList,function(index,item){
                if(thisThemeId.toString() == item.id.toString()){
                    themeListHTML += "<div class='panelActionItem themeItemList' title='"+ item.name+"' themeid='"+item.id+"'><p class='themeItem themeItemSelected' themeid='"+item.id+"'>"+ item.name + "</p><span class='checkedThemeIcon iconfont icon-checked'></div>";
                }else{
                    themeListHTML += "<div class='panelActionItem themeItemList' title='"+ item.name+"' themeid='"+item.id+"'><p class='themeItem' themeid='"+item.id+"'>"+ item.name + "</p><span class='hiddenIcon checkedThemeIcon iconfont icon-checked'></div>";

                }
            });

            let themePanelHTML = "<div id='switchThemePanel' class='menuPanel'>" +  themeListHTML + "</div>";

            let otherMunuPanel = $(".menuPanel");
            if(otherMunuPanel.length > 0){
               otherMunuPanel.trigger("removeMenuPanel"); 
            }

            $("#mainContent").append(themePanelHTML);

            const thisPanel = $("#switchThemePanel");
            const thisPanelBtn = $("#contentThemeTitle");

            //定义面板位置矫正事件
            $(thisPanel).off("ajustPositon").on("ajustPositon",function(){
                let title = $("#contentTitle");
                let offset = title.offset();
                let height = title.outerHeight();
                // let winWidth = window.innerWidth;
                
                thisPanel.css({
                    // 'min-height': '131px',
                    'max-height': 'calc(100vh - 150px)',
                    position: "absolute",
                    left: (offset.left+10),
                    top: (offset.top + height - 5)
                });
            });

            $("#switchThemePanel").trigger("ajustPositon");


            //添加主题点击事件，点击切换主题
            $(".themeItemList").off("click").on("click",function(){switchShowTheme($(this).attr("themeid"))});

            //添加“主题列表“点击绑定事件
            $("#goThemeList").off("click").on("click",function(){
                showThemeList(null,thisThemeId);
            });

            //定义面板移除事件
            $(thisPanel).off("removeMenuPanel").on("removeMenuPanel",function(){
                $(this).remove();
                $("#contentThemeTitle.hover").removeClass("hover");
            });

            //添加页面绑定事件，点击页面其他地方关闭弹窗
            hidePanelByClick(thisPanel,thisPanelBtn);

        }else{
            printLog(arguments.callee.name.toString(),"获取本次存储数据异常");
            showToast("没有可切换的主题");
            $("#contentThemeTitle").removeClass("hover");
        }
    }else{
        $("#switchThemePanel").trigger("removeMenuPanel");
    }

}


/*切换当前展示主题*/
function switchShowTheme(themeId){
    if(notNull(themeId)){
        let localFullData = getLocalRecordData();
        let selectedTheme = $("#switchThemePanel .themeItemSelected").attr("themeid");
        if(notNull(localFullData.recordData[themeId])){
            if(selectedTheme != themeId){
                showRecords(null,null,null,null,themeId);
            }else{
                toggleSwitchThemePanel();
                printLog(arguments.callee.name.toString(),"当前选择主题与页面展示主题相同，无需切换");
                return;
            }
        }else{
            printLog(arguments.callee.name.toString(),"切换主题失败，不存在的themeId",themeId);
            return;  
        }
    }else{
        printLog(arguments.callee.name.toString(),"themeId异常，切换主题失败");
        return;
    }
}


/**
 *展示主题列表
 * 
 **/
function showThemeList(displayRule,fromThemeId){
    const thisFucName = arguments.callee.name.toString();

    let localFullData = getLocalRecordData();

    let localRecordExist = checkRecordData(1,localFullData);

    if(!localRecordExist){
        printLog(arguments.callee.name.toString(),"本地数据获取失败",localFullData);
        showTip("当前还没有任何记录，要开始记录吗？","若有过往下载的txt数据文件可上传后继续记录。",2,3);
        removeQueryParam("showType");
        removeQueryParam("fromThemeId");
        return;
    }

    let showThemeHTML = "<div id='contentTitle' style='border:none'><p id='themeListTitle'><em class='themeListBackBtn iconfont icon-to-left' title='返回记录列表'></em><em class='text'>主题</em></p><p id='createThemeBtn'><em class='btnFrontIcon iconfont icon-create'></em><em>新建主题</em></p></div>";

    let finalRule = {};
    finalRule.showItem = ["recordNum","updateTime"];
    finalRule.sortItem = "updateTime";
    finalRule.sortType = "desc";

    if(getJsonLength(localFullData.recordData) != 0){

        //整理主题列表展示规则
        let themeListPreferance = getUserPreferance("theme_list_display");

        //列表要展示的字段
        if(displayRule?.showItem && Array.isArray(displayRule.showItem) && displayRule.showItem.length > 0){
        
            finalRule.showItem = displayRule.showItem;
        
        }else if(themeListPreferance?.showItem && Array.isArray(themeListPreferance.showItem) && themeListPreferance.showItem.length>0){

            finalRule.showItem = themeListPreferance.showItem;

        }

        //用于排序的字段
        if(displayRule?.sortItem){

            finalRule.sortItem = displayRule.sortItem;

        }else if(themeListPreferance?.sortItem){

            finalRule.sortItem = themeListPreferance.sortItem;

        }

        //排序类型：升序/降序
        if(displayRule?.sortType){

            finalRule.sortType = displayRule.sortType;

        }else if(themeListPreferance?.sortType){

            finalRule.sortType = themeListPreferance.sortType;

        }

        printLog(thisFucName,"本次展示规则：",finalRule);


        //组装主题列表 - 标题 - 名称字段
        showThemeHTML += "<div class='themeList themelistTitle'><div class='themeItemNotAction'><div class='themeItemName'>名称</div>";


        //组装除“名称”字段外，其他全部标题字段
        $.each(finalRule.showItem,function(index,item){

            let titleName = "";//标题的文字名称
            let titleItemClassName = "";//标题的内容样式类名
            let titleIconClassName = "icon-to-down";//标题的排序类名

            if(finalRule.sortItem == item){
                if(finalRule.sortType == "desc"){
                    titleIconClassName = "icon-down-arrow";
                }else{
                    titleIconClassName = "icon-up-arrow";
                }
            }

            switch(item){

                case "recordNum":
                    titleItemClassName = "themeItemLength";
                    titleName = "记录总数";
                    break;

                case "textNum":
                    titleItemClassName = "themeItemLength";
                    titleName = "总字数";
                    break;

                case "createTime":
                    titleItemClassName = "themeItemTime";
                    titleName = "创建时间";
                    break;

                case "updateTime":
                    titleItemClassName = "themeItemTime";
                    titleName = "更新时间";
                    break;
            }

            showThemeHTML += "<div class='"+titleItemClassName+" actionTitle' itemname='"+item+"'><p class='themeListTitleAction'><span class='themeListTitleText'>"+titleName+"</span><em class='themeListActionIcon iconfont "+titleIconClassName+"'></em></p></div>";


            if(index+1 == finalRule.showItem.length){
                    showThemeHTML += "</div><div class='themeItemActionBtn' style='opacity:0;margin:0'></div></div>";
            }

        });

        //组装列表展示内容
        let themeArray = [];//用于后续排序和展示的主题信息数组
        let recordTotalRcd = 0;
        let recordTotalText = 0;
        $.each(localFullData.recordData,function(themeId,themeObj){
            let showThemeItemInfo = {};
            showThemeItemInfo.id = themeObj.themeId;
            showThemeItemInfo.name = themeObj.themeName;
            showThemeItemInfo.items = [];

            //全部主题的总记录数
            recordTotalRcd += getJsonLength(themeObj.recordList);

            //全部主题的总字数
            $.each(themeObj.recordList,function(index,recordObj){
                $.each(recordObj.dayContentDetail,function(contentIndex,contentObj){
                    recordTotalText += innerTextTransform(contentObj.replace(/&#10;/g,"")).length;
                });
                
            });


            //组装showItem中所有的字段值，按照showItem中的顺序
            $.each(finalRule.showItem,function(index,item){

                showThemeItemInfo.recordNum = getJsonLength(themeObj.recordList);

                let textTotalNum = 0;
                $.each(themeObj.recordList,function(recordIndex,recordObj){
                    $.each(recordObj.dayContentDetail,function(contentIndex,contentObj){
                        textTotalNum += innerTextTransform(contentObj.replace(/&#10;/g,"")).length;
                    });
                    
                });

                showThemeItemInfo.textNum = textTotalNum;

                showThemeItemInfo.createTime = themeObj.createTime;

                showThemeItemInfo.updateTime = themeObj.updateTime;

                showThemeItemInfo.items[index] = {};

                switch(item){
                    case "recordNum":
                        showThemeItemInfo.items[index].text = getJsonLength(themeObj.recordList).toLocaleString();
                        showThemeItemInfo.items[index].value = getJsonLength(themeObj.recordList);
                        showThemeItemInfo.items[index].className = "themeItemLength";
                        showThemeItemInfo.items[index].itemName = "recordNum";
                        break;

                    case "textNum":
                        showThemeItemInfo.items[index].text = textTotalNum.toLocaleString();
                        showThemeItemInfo.items[index].value = textTotalNum;
                        showThemeItemInfo.items[index].className = "themeItemLength";
                        showThemeItemInfo.items[index].itemName = "textNum";
                        break;

                    case "createTime":
                        showThemeItemInfo.items[index].text = getTimeText(themeObj.createTime,1,0,1,1).fullText;
                        showThemeItemInfo.items[index].value = themeObj.createTime;
                        showThemeItemInfo.items[index].className = "themeItemTime";
                        showThemeItemInfo.items[index].itemName = "createTime";
                        break;

                    case "updateTime":
                        showThemeItemInfo.items[index].text = getTimeText(themeObj.updateTime,1,0,1,1).fullText;
                        showThemeItemInfo.items[index].value = themeObj.updateTime;
                        showThemeItemInfo.items[index].className = "themeItemTime";
                        showThemeItemInfo.items[index].itemName = "updateTime";
                        break;
                }
            });
            themeArray.push(showThemeItemInfo);
        });


        //对数组内容排序
        if(finalRule.sortType == "desc"){
            themeArray.sort(function(a,b){ return b[finalRule.sortItem] - a[finalRule.sortItem];});
        }else if(finalRule.sortType == "asc"){
            themeArray.sort(function(a,b){ return a[finalRule.sortItem] - b[finalRule.sortItem];});
        }

        //组装主题具体信息
        $.each(themeArray,function(index,themeInfo){
            showThemeHTML += "<div class='themeList' themeid='"+themeInfo.id+"'><div class='themeItemNotAction'><p class='themeItemName themeListItem' title='"+themeInfo.name+"' itemname='themeName'>"+themeInfo.name+"</p>";
            
            $.each(themeInfo.items,function(i,t){
                showThemeHTML += "<p class='"+t.className+"  themeListItem' itemvalue='"+t.value+"' itemname='"+t.itemName+"'>"+t.text+"</p>";
            });

            showThemeHTML += "</div><div class='themeItemActionBtn iconfont icon-more' themeid='"+themeInfo.id+"'></div></div>";

            //最底部的提示文案
            if(index+1 == themeArray.length){
                showThemeHTML += "<p class='themeListBtm'>  已创建<span class='boldNumber'>"+ themeArray.length.toLocaleString() +"</span>个主题，包含<span class='boldNumber'>"+ recordTotalRcd.toLocaleString() +"</span>条记录，共计<span class='boldNumber'>"+ recordTotalText.toLocaleString() +"</span>字。</p></div>";
                showThemeHTML += "</div>";
            }

        });

    }else{
        showThemeHTML += "<p class='listBtmTip'>还没有创建主题</p>";
    }

    //按照本次展示规则 更新本地theme_list_display规则
    updateUserPreferance("theme_list_display",finalRule);

    //确保顶部标题正确
    $("#topNavContent #navTitle #pageTopTitle").html(PROJECT_NAME);

    //在页面展示最终主题列表内容
    $("#mainContent").html(showThemeHTML);

    //更新页面标题
    $("title").text(PROJECT_NAME+" - "+"主题");

    if($("#nodataDiv").is(":visible")){
        $("#nodataDiv").hide();
    }

    if(!$("#contentAll").is(":visible")){
        $("#contentAll").show();
    }

    /*if(typeof actionBarTimer !=="undefined" && actionBarTimer) clearTimeout(actionBarTimer);
    $(".toastActionBar").remove();*/

    //更新页面查询参数 fromThemeId
    if(notNull(fromThemeId)){
        updateQueryParam("fromThemeId",fromThemeId);
    }
    

    //定义主题列表中可点击标题的菜单点击事件（选择列表展示字段和排序字段）
    $(".themeListTitleAction").off("click").on("click",function(e){

        //当前点击的标题
        const thisClickTitle = $(this).parent(".actionTitle");

        //当前点击的标题图标
        const thisClickTitleIcon = $(thisClickTitle).find(".iconfont.themeListActionIcon");

        //当前点击标题展示的字段itemname
        const thisClickItemName = $(this).parent(".actionTitle").attr("itemname");
        
        //如果当前标题的菜单面板正在展示，要关闭面板
        const thisTitleMenuPanel = $(thisClickTitle).children(".themeListTitleActionPanel");
        if(thisTitleMenuPanel.length > 0){
            $(thisTitleMenuPanel).trigger("removeMenuPanel");
            return;
        }

        if(!$(this).hasClass("hover")){
            $(this).addClass("hover");
        }

        //页面当前展示的所有字段
        let pageShowingItems = $(".themelistTitle .actionTitle[itemname!='']");
        let pageShowedItemAry = [];
        $.each(pageShowingItems,function(index,showedItem){
            pageShowedItemAry.push($(showedItem).attr("itemname"));
        });

        //页面当前展示规则
        let thisRules = getUserPreferance("theme_list_display");

        //组装菜单面板内容
        let menuPanelHTML = "<div class='menuPanel themeListTitleActionPanel'>";

        menuPanelHTML += "<p class='panelActionItem menuTypeTitle'>展示</p>";

        //所有可展示的字段itemName和展示名称
        const allItems = ["recordNum","textNum","createTime","updateTime"];
        const allItemsText = ["记录总数","总字数","创建时间","更新时间"];
        
        $.each(allItems,function(index,item){
            //let itemName = $(item).attr("itemname");
            let specClassName = "";
            if(pageShowedItemAry.indexOf(item) == -1){
                //未展示的字段 unshown
                specClassName = " unshown";
            }else if(item == thisClickItemName){
                //已展示的字段，并且是当前点击的字段
                specClassName = " showing";
            }else{
                //已展示的字段，并且是
                specClassName = " shown";
            }

            menuPanelHTML += "<p class='panelActionItem item"+specClassName+"' itemname='"+item+"'>"+allItemsText[index]+"</p>";

        });

        menuPanelHTML += "<hr><p class='panelActionItem menuTypeTitle'>排序</p>";

        const sortTextMapping = {
            "recordNum":["由多到少","由少到多"],
            "textNum":["由多到少","由少到多"],
            "createTime":["由近到远","由远到近"],
            "updateTime":["由近到远","由远到近"]
        };

        let specSortClassName = "";
        let descClassName = "";
        let ascClassName = "";
        if(thisClickItemName==thisRules.sortItem){
            specSortClassName = " sorting";
            descClassName = thisRules.sortType=="desc" ? " showing" : "";
            ascClassName = thisRules.sortType=="asc" ? " showing" : "";
        }

        menuPanelHTML += "<p class='panelActionItem sort"+specSortClassName+descClassName+"' sortType='desc'>"+sortTextMapping[thisClickItemName][0]+"</p>";
        menuPanelHTML += "<p class='panelActionItem sort"+specSortClassName+ascClassName+"' sortType='asc'>"+sortTextMapping[thisClickItemName][1]+"</p>";

        menuPanelHTML += "</div>";


        //如果页面中有其他menuPanel 需要移除
        let otherMunuPanel = $(".menuPanel");
        if(otherMunuPanel.length > 0){
            $(otherMunuPanel).trigger("removeMenuPanel");
        }

        //展示当前menuPanel
        $(thisClickTitle).append(menuPanelHTML); 

        const thisMenuPanel = $(".themeListTitleActionPanel");
        const thisMenuPanelBtn = $(".actionTitle[itemname="+thisClickItemName+"]").children(".themeListTitleAction");


        //定义themeListTitleActionPanel的removeMunuPanle事件
        $(thisMenuPanel).off("ajustPositon").on("ajustPositon",function(){
            let offset = $(thisClickTitle).offset();
            let height = $(thisClickTitle).outerHeight();

            $(".themeListTitleActionPanel").css({
                // 'min-height': '70px',
                'max-height': 'calc(100vh - 100px)',
                position: "absolute",
                left: offset.left,
                top: offset.top+36
            });
        });

        $(thisMenuPanel).trigger("ajustPositon");

        
        //定义themeListTitleActionPanel的removeMunuPanle事件
        $(thisMenuPanel).off("removeMenuPanel").on("removeMenuPanel",function(){
            
            //面板对应的标题
            let thisPanleTitle = $(this).siblings(".themeListTitleAction.hover");
            //取消对应标题的hover类样式  
            $(thisPanleTitle).removeClass("hover");

            //面板对应标题的图标
            let thisTitleIcon = $(thisPanleTitle).children(".iconfont.themeListActionIcon");

            //移除当前面板
            $(this).remove();

        });

        hidePanelByClick(thisMenuPanel,thisMenuPanelBtn);

        //定义标题菜单中元素的点击事件
        $(".menuPanel.themeListTitleActionPanel .panelActionItem").off("click").on("click",function(e){
            
            if($(this).hasClass("shown") || $(this).hasClass("menuTypeTitle")){
                return;
            }
            
            const thisShowingTitlePanel = $(this).parent(".menuPanel.themeListTitleActionPanel");
            const thisClickTitle = $(thisShowingTitlePanel).siblings(".themeListTitleAction");

            const thisClickItemName = $(this).attr("itemname");

            //如果点击的是当前正在展示的字段，关掉弹窗不做任何处理
            if($(this).hasClass("showing")){
                
                $(thisShowingTitlePanel).trigger("removeMenuPanel");

                return;
            }

            let newDisplayRule = {};

            // const allShowableItem = $(thisShowingTitlePanel).children("[itemname][itemname!=''].panelActionItem");
            const pageShowingItems = $(".actionTitle[itemname][itemname!='']");
            
            const thisTitleItemName = $(thisShowingTitlePanel).parent(".actionTitle").attr("itemname");

            let pageShowingItemAry = [];
            let newShowItemAry = [];
            //如果点击的是「展示」选项
            if($(this).hasClass("item")){
                $.each(pageShowingItems,function(index,item){
                    let itemname = $(item).attr("itemname");
                    pageShowingItemAry.push(itemname);
                    if($(this).attr(itemname) != itemname){
                        newShowItemAry.push(itemname);
                    }
                });


                //当前点击标题在所有展示字段中的顺序
                const thisTitleItemNameIndex = pageShowingItemAry.indexOf(thisTitleItemName);

                newShowItemAry[thisTitleItemNameIndex] = thisClickItemName;

                newDisplayRule.showItem = newShowItemAry;

            }else if($(this).hasClass("sort")){
            //如果点击的是排序字段
                if(!$(this).hasClass("sorting")){
                    //把排序字段换成当前展示字段
                    newDisplayRule.sortItem = thisTitleItemName;
                }

                newDisplayRule.sortType = $(this).attr("sortType");   

            }

            showThemeList(newDisplayRule);

        }); 

    });



    //定义主题列表标题左侧【返回箭头】的点击事件
    $("#themeListTitle .themeListBackBtn").off("click").on("click",function(){
        
        const requestParams = getQueryParams();
        let aimThemeId = null;

        if(!requestParams?.fromThemeId){
            printLog(".themeListBackBtn.click","当前页面没有fromThemeId，将展示默认主题下的记录数据");
            showRecords();
            return;
        }

        let themeData = getRecordsByTheme(1,requestParams.fromThemeId);
        //let themeDataExist = checkRecordData(1,themeData);
        if(!notNull(themeData)){
            printLog(".themeListBackBtn.click","当前页面fromThemeId的主题数据不存在，将展示默认主题下的记录数据，fromThemeId：",requestParams.fromThemeId);
            showRecords();
            return;
        }

        printLog(".themeListBackBtn.click","将展示fromThemeId主题：", innerTextTransform(themeData.themeInfo.themeName));
        showRecords(0,0,0,0,requestParams.fromThemeId);

        
    });


    //鼠标移入时主题列表行时 样式的设置
    $(".themeList").off("mouseenter").on("mouseenter",function(e){
        //鼠标移入非标题的主题行后，若前一个同级主题不是“操作action”状态，将其border-bottom设为透明
         if(!$(this).hasClass("themelistTitle")){
            $(this).addClass("hover");
            let prevItem = $(this).prev();
            if(prevItem.length != 0 && !$(prevItem).hasClass("action")){
                $(prevItem).addClass("hoverPrev");
            }
         }
    });

    //鼠标移入时主题列表行时 样式的设置
    $(".themeList").off("mouseleave").on("mouseleave",function(e){
        //若主题行的操作面板不是展示状态，恢复当前元素的非hover效果并将前一个非标题的同级主题border-bottom恢复默认灰色
         if(!$(this).hasClass("themelistTitle")){
            //鼠标离开主题行后，若主题行的操作面板是展示状态，保留hover效果
            let showActionPanelThemeId = $(".themeListItemAactionPanel").attr("themeid");
            let thisThemeId = $(this).attr("themeid");
            let prevItem = $(this).prev();
            if(prevItem.length != 0 && !$(this).hasClass("action")){
                $(prevItem).removeClass("hoverPrev");
            }
            $(this).removeClass("hover");
         }
    });

    //添加主题行的点击跳转记录列表页事件
    $(".themeList").off("click").on("click",function(e){
        if(!$(this).hasClass("themelistTitle")){
            let themeId = $(this).attr("themeid");
            showRecords(null,null,null,null,themeId);
        }
    });

    //添加主题行的操作按钮点击事件
    $(".themeItemActionBtn").off("click").on("click",function(e){
        e.stopPropagation(); 
        showThemeActionPanel($(this).attr("themeid"));
    });

    //添加新建主题的点击事件
    $("#createThemeBtn").off("click").on("click",function(){
        showThemeNameEditWin(null,1);
    });

    updateQueryParam("showType","themeList");
    removeQueryParam("themeId");
    removeQueryParam("searchType");
    removeQueryParam("searchKey");

    //避免其他步骤隐藏了顶部菜单，此处展示顶部菜单
    if(!$("#navMenu").is(":visible")){
        $("#navMenu").show();
    }
    //隐藏添加、搜索顶部操作按钮
    $("#addRecordBtn").parent("li").hide();
    $("#searchBtn").parent("li").hide();

    //展示【设置】按钮
    $("#configBtn").parent("li").show();

    //重新绑定下载事件
    $("#saveRecordBtn").off("click").on("click",function(){
        downloadFileConfirm();
    });

    //重新绑定上传事件
    $("#reUploadBtn").off("click").on("click",function(){
        uploadFileConfirm();
        updateUploadFileMethod();
    });

    $("#configBtn").off("click").on("click",function(){
        showSystemConfigWin();
    });

    checkIfDownload();

    $(".loadingTip").remove();
    stopLoadingNextFlag = true;

    printLog(arguments.callee.name.toString(),"已展示主题列表");

}


function showThemeActionPanel(themeId){

    const thisFucName = arguments.callee.name.toString();

    if(!notNull(themeId)){
        printLog(arguments.callee.name.toString(),"无法展示主题操作面板，缺少themeid参数");
        return;
    }

    let localFullData = getLocalRecordData();
    let localRecordExist = checkRecordData(1,localFullData);
    if(!localRecordExist){
        printLog(arguments.callee.name.toString(),"本地存储数据异常",localFullData,themeId);
        showToast("主题已被删除");
        return;
    }

    let localThemeObj = localFullData.recordData[themeId];
    if(!notNull(localThemeObj)){
        printLog(arguments.callee.name.toString(),"主题数据获取异常",themeId);
        showToast("主题已被删除");
        //return;
    }


    //如果页面中有其他menuPanel 需要移除
    let otherMenuPanel = $(".menuPanel[themeid!="+themeId+"]");
    if(otherMenuPanel.length > 0){
        $(otherMenuPanel).trigger("removeMenuPanel");
    }

    let thisMenuPanel = $(".themeListItemAactionPanel[themeid="+themeId+"]");
    if(thisMenuPanel.length > 0){
        $(thisMenuPanel).trigger("removeMenuPanel");
        return;
    }
    

    //主题操作面板内容组装开始
    let showPanelHTML = "<div class='menuPanel themeListItemAactionPanel' themeid='"+themeId+"'>";

    //新页面打开
    showPanelHTML += "<p class='panelActionItem showInNewTabBtn'>在新页面打开</p>";

    //分割线
    showPanelHTML += "<hr>";

    //下载
    const unsaveChangedInfo = localGet("undownload_changed_info");
    let themeUndownloadFlag = "";
    if(notNull(unsaveChangedInfo) && unsaveChangedInfo.hasOwnProperty(themeId)){
        themeUndownloadFlag = "<em class='dotReminder show'></em>";
    }
    showPanelHTML += "<p class='panelActionItem downloadThemeBtn'><span>下载</span>"+themeUndownloadFlag+"</p>";
    //重命名
    showPanelHTML += "<p class='panelActionItem renameThemeBtn'>重命名</p>";

    //分割线
    showPanelHTML += "<hr>";
    //上传
    showPanelHTML += "<p class='panelActionItem uploadToThemeBtn'>上传导入</p>";

    //分割线
    showPanelHTML += "<hr>";
    //删除
    showPanelHTML += "<p class='panelActionItem deleteThemeBtn'>删除</p>";
    
    //主题操作面板内容组装结束
    showPanelHTML += "</div>";

    

    $(".themeList[themeid="+themeId+"]").append(showPanelHTML);

    const targetElement = $(".themeListItemAactionPanel[themeid="+themeId+"]");

    //定义菜单面板的remove事件
    $(targetElement).off("ajustPositon").on("ajustPositon",function(){
        let themeBtn = $(".themeList .themeItemActionBtn[themeid="+themeId+"]");
        let offset = $(themeBtn).offset();
        let height = $(themeBtn).outerHeight();

        targetElement.css({
            // 'min-height': '70px',
            'max-height': 'calc(100vh - 100px)',
            position: "absolute",
            left: offset.left -  $(".themeListItemAactionPanel").width() + $(themeBtn).width(),
            top: offset.top + 35
        });

    });

    $(targetElement).trigger("ajustPositon");


    //清除其他操作中的主题行样式
    $(".themeList.action").removeClass("action");
    //给对应主题行添加“操作中”样式
    $(".themeList[themeid="+themeId+"]").addClass("action");
    //给对应主题行前一个主题行添加hoverPrev样式
    let prevItem = $(".themeList[themeid="+themeId+"]").prev(".themeList");
    if(prevItem.length != 0){
        $(prevItem).addClass("hoverPrev");
    }


    const toggleButton = $(".themeItemActionBtn[themeid="+themeId+"]");

    //定义菜单面板的remove事件
    $(targetElement).off("removeMenuPanel").on("removeMenuPanel",function(){
        const thisThemeId = $(this).attr("themeid");
        $(this).remove();
        $(".themeList.action").removeClass("action");
        /*$(".themeList.hoverPrev").removeClass("hoverPrev");
        $(".themeList.hover").removeClass("hover");*/
        
    });

    hidePanelByClick(targetElement);


    


    //给面板中操作按钮绑定点击事件

    //新页面打开
    $(".showInNewTabBtn").off("click").on("click",function(e){
        e.stopPropagation(); 

        $(this).parent(".menuPanel").trigger("removeMenuPanel");

        let pageUrl = new URL(window.location.href);

        pageUrl.searchParams.delete("searchKey");
        pageUrl.searchParams.delete("searchType");

        pageUrl.searchParams.set("showType","recordList");
        pageUrl.searchParams.set("themeId",themeId);

        //void  $(".themeList")[0].offsetHeight;

        window.open(pageUrl,"_blank");

        /*requestAnimationFrame(() => {
            window.open(pageUrl, '_blank');
        });*/
    });

    //上传
    $(".uploadToThemeBtn").off("click").on("click",function(e){
        e.stopPropagation();

        $(this).parent(".menuPanel").trigger("removeMenuPanel");

        uploadFileConfirm(themeId);
        updateUploadFileMethod(themeId);

    });

    //下载
    $(".downloadThemeBtn").off("click").on("click",function(e){
        e.stopPropagation(); 

        $(this).parent(".menuPanel").trigger("removeMenuPanel");

        downloadFileConfirm([themeId]);

    });


    //重命名按钮点击事件
    $(".renameThemeBtn").off("click").on("click",function(e){
        e.stopPropagation(); 
        showThemeNameEditWin(themeId);

        $(this).parent(".menuPanel").trigger("removeMenuPanel");

    });

    //删除按钮点击事件
    $(".deleteThemeBtn").off("click").on("click",function(e){
        e.stopPropagation(); 

        let del_localData = getLocalRecordData();
        let del_localDataExist = checkRecordData(1,del_localData);
        if(!del_localDataExist){
            printLog("deleteThemeBtn.click","本地数据异常",del_localData);
            showToast("本地数据异常");
            return;
        }

        let del_theme = del_localData.recordData[themeId];
        if(!notNull(del_theme)){
            printLog("deleteThemeBtn.click","主题数据异常",del_theme);
            showTip("主题已经被删除了","当前页面展示内容有变动，刷新看看吧。",0,6);
            return;
        }

        $(this).parent(".menuPanel").trigger("removeMenuPanel");

        let recordNum = getJsonLength(del_theme.recordList);
        let contentNum = 0;
        let contentTextNum = 0;
        if(recordNum!=0){
            $.each(del_theme.recordList,function(index,item){
                contentNum += item.dayContentDetail.length;
                $.each(item.dayContentDetail,function(i,t){
                    contentTextNum += innerTextTransform(t.replace(/&#10;/g,"")).length;
                });
            });
        }
        let confirmText = "确认删除吗？";
        if(recordNum!=0){
            if(contentNum !=0){
                confirmText = "确认删除「 "+del_theme.themeName+" 」吗？<br>共 "+recordNum.toLocaleString()+" 条记录，包含 "+contentNum.toLocaleString()+" 项内容，总计 " + contentTextNum.toLocaleString() + " 字。";
            }else{
                confirmText = "确认删除「 "+del_theme.themeName+" 」吗？";
            }
            
        }else{
            confirmText = "确认删除主题「 "+del_theme.themeName+" 」吗？";
        }
        showTip(confirmText,"删除后无法恢复，请谨慎操作。",4,10,{"themeId":themeId});
    });
}

/**
 * 展示重命名/创建主题弹窗
 * @param themeId 重命名的主题id
 * @param isCreate 是否新建**/
function showThemeNameEditWin(themeId,isCreate){

    let winTitleText = "主题名称";
    let mainBtnText = "确定";

    if(!notNull(themeId) && !isCreate){
        //没有themeid并且不是创建新主题
        printLog(arguments.callee.name.toString(),"无法展示主题编辑弹窗，缺少themeid参数",isCreate);
        return;
    }

    let localFullData = getLocalRecordData();
    let localRecordDataExist = checkRecordData(1,localFullData);
    //创建主题
    if(isCreate){

        winTitleText = "创建新主题";
        mainBtnText = "创建";

        //输入框填充当前主题名称
        $("#themeNameEditWin #themeNameEditInput").val("");

        $("#themeNameEditInput").attr("placeholder","输入主题名称");

        //确定按钮点击事件 - 创建新主题
        $("#confirmEditThemeBtn").off("click").on("click",function(){
            let newTheme = {};
            let inputName = $("#themeNameEditInput").val().trim();
            if(!notNull(inputName)){
                showToast("请输入主题名称",2000);
                $("#themeNameEditInput").focus();
                return;
            }

            if(!localRecordDataExist){
                localFullData = {};
                localFullData.recordData = {};
            }

            let saveThemeName = innerHtmlTransform(inputName);
            let themeNameExist = false;

            if(getJsonLength(localFullData.recordData)!=0){
                $.each(localFullData.recordData,function(index,item){
                    if(item.themeName == saveThemeName){
                        themeNameExist = true;
                        return;
                    }
                });
            }

            if(themeNameExist){
                showToast("主题名称不能重复",2000);
                printLog("confirmEditThemeBtn.click","主题创建失败，名称重复：",saveThemeName);
                $("#themeNameEditInput").select();
                return;
            }

            newTheme.themeId = createThemeId();
            newTheme.themeName = saveThemeName;
            newTheme.createTime = (new Date()).getTime();
            newTheme.updateTime = (new Date()).getTime();
            newTheme.recordList = {};

            printLog("confirmEditThemeBtn.click","主题数据创建成功：",newTheme);


            localFullData.recordData[newTheme.themeId] = newTheme;
            updateLocalRecordData(localFullData);
            printLog("confirmEditThemeBtn.click","主题创建成功：",newTheme.themeId,newTheme);
            //showToast("主题创建成功",2000);

            let actionParams = {};
            actionParams.editType = 0;
            actionParams.dataId = null;
            actionParams.themeId = newTheme.themeId;
            actionParams.firstAdd = 0;
            printLog("confirmEditThemeBtn.click","添加记录参数：：",actionParams);
            closeAllWin();
            showActionBar("主题创建成功","去添加记录","showEditWin",actionParams,5000);
            //updateUndownloadInfo(newTheme.themeId);//未添加记录不增加未下载标识-260305
            showThemeList();

        });

    //编辑主题名称
    }else{

        if(!localRecordDataExist){
            printLog(arguments.callee.name.toString(),"本地存储数据异常",localFullData,themeId);
            return;
        }
        let localThemeObj = localFullData.recordData[themeId];
        if(!notNull(localThemeObj)){
            printLog(arguments.callee.name.toString(),"主题数据获取异常",localFullData,themeId);
            showTip("主题已被删除，无法进行编辑。","当前页面展示内容有变动，刷新看看吧。",0,6);
            return;
        }

        if(!notNull(localThemeObj.themeName)){
            printLog(arguments.callee.name.toString(),"主题名称数据获取异常",localThemeObj);
            return; 
        }

        //输入框填充当前主题名称
        $("#themeNameEditWin #themeNameEditInput").val(htmlDecode(localThemeObj.themeName));
        $("#themeNameEditInput").attr("placeholder","输入新的主题名称");

        //确定按钮点击事件
        $("#confirmEditThemeBtn").off("click").on("click",function(){
            let inputNewName = $("#themeNameEditInput").val().trim();
            if(!notNull(inputNewName)){
                showToast("请输入主题名称",2000);
                $("#themeNameEditInput").focus();
                return;
            }
            inputNewName = innerHtmlTransform(inputNewName);
            renameTheme(themeId,inputNewName);
        });

    }

    //输入框focus时边框样式设置
    $("#themeNameEditWin #themeNameEditInput").off("focus").on("focus",function(e){
        let inputBorder = $(this).parent(".singleInput")[0];
        if(!$(inputBorder).hasClass("focus")){
            $(inputBorder).addClass("focus");
        }

    });

    //输入框blur时边框样式设置
    $("#themeNameEditWin #themeNameEditInput").off("blur").on("blur",function(e){
        let inputBorder = $(this).parent(".singleInput")[0];
        $(inputBorder).removeClass("focus");
    });


    //取消弹窗按钮点击事件
    $("#cancelEditThemeBtn").off("click").on("click",function(){
        closeAllWin();
    });

    WinDragInit($("#themeNameEditWin .winTitle")[0],$("#themeNameEditWin")[0]);
    $("body").addClass("noScroll");
    $("#themeNameEditWin .winTitleText").html(winTitleText);
    $("#themeNameEditWin #confirmEditThemeBtn").html(mainBtnText);
    $("#alertBgWin,#themeNameEditWin").show();
    $("#themeNameEditWin #themeNameEditInput").select();
}

/**重命名主题**/
function renameTheme(themeId,newThemeName){
    if(!notNull(themeId)){
        printLog(arguments.callee.name.toString(),"缺失themeid参数，无法重命名主题");
        return;
    }

    if(!notNull(newThemeName)){
        printLog(arguments.callee.name.toString(),"缺失newThemeName参数，无法重命名主题",newThemeName);
        return;
    }

    let localFullData = getLocalRecordData();
    let localFullDataExist = checkRecordData(1,localFullData);
    if(!localFullDataExist){
        printLog(arguments.callee.name.toString(),"本地存储数据异常",localFullData);
        showToast("主题已被删除，无法操作。");
        return;
    }

    let localThemeObj = localFullData.recordData[themeId];
    if(!notNull(localThemeObj)){
        printLog(arguments.callee.name.toString(),"主题数据获取异常",localFullData,themeId);
        showToast("主题已被删除，无法操作。");
        return;
    }

    let nameExist = false;
    $.each(localFullData.recordData,function(index,item){
        if(item.themeName == newThemeName && index!=themeId){
            nameExist = true;
            return;
        }
    });

    if(nameExist){
        showToast("主题名称不可重复");
        $("#themeNameEditWin #themeNameEditInput").select();
        return;
    }

    let localThemeName = localThemeObj.themeName;
    if(localThemeName == newThemeName){
        showToast("主题名称未改动",2000);
        closeAllWin();
        return;
    }

    localFullData.recordData[themeId].themeName = newThemeName;
    updateLocalRecordData(localFullData);
    closeAllWin();
    $(".themeList[themeid="+themeId+"] .themeItemName").html(newThemeName);
    $(".themeList[themeid="+themeId+"] .themeItemName").attr("title",newThemeName);
    showToast("主题名称修改成功",2000);
    printLog(arguments.callee.name.toString(),themeId+"主题名称修改成功, "+localThemeName+"→"+newThemeName);

    updateUndownloadInfo(themeId);
    checkIfDownload();

    checkShowingRecordUpdate();
    

}

function deleteTheme(themeId){

    const thisFucName = arguments.callee.name.toString();

    if(!notNull(themeId)){
        printLog(thisFucName,"缺失themeid参数，无法删除主题");
        return;
    }

    /**防止误删 5X3Q4U my Records开发记录主题**/
    if("3W2S8B" == themeId){
        showTip("已成功阻止删除ID为 5X3Q4U 的主题","",0,11);
        printLog(thisFucName,"防止误删"+themeId);
        return;
    }

    let localFullData = getLocalRecordData();
    let localFullDataExist = checkRecordData(1,localFullData);
    if(!localFullDataExist){
        printLog(thisFucName,"本地存储数据异常",localFullData);
        return;
    }

    let localThemeObj = localFullData.recordData[themeId];
    let tipText = "";

    //若页面中展示了当前要删除的主题，进行移除
    let pageShowedRemoved = false;
    let pageShowItem = $(".themeList[themeid="+themeId+"]");
    if(pageShowItem.length!=0){
        $(pageShowItem).remove();
        pageShowedRemoved = true;
        printLog(thisFucName,"页面中主题元素已移除");
        tipText = "主题删除成功";
    }

    if(!notNull(localThemeObj)){
        
        if(pageShowedRemoved){
            printLog(thisFucName,"未找到本地主题数据，删除操作结束",themeId);
            tipText = "主题删除成功";
            checkShowingRecordUpdate();
        }else{
            //页面没展示、本地存储不存在，说明已被删除
            printLog(thisFucName,"主题已被删除",themeId);
            tipText = "主题删除成功";
            checkShowingRecordUpdate();
        }
        if($(".themeList:not(.themelistTitle)").length == 0){
            // tipText += "，页面没有更多数据了。";
            $("#mainContent").append("<p class=‘listBtmTip nodata’>没有主题数据</p>");
            $(".themeListBtm").remove();
        }
        showToast(tipText);
        closeAllWin();
        return;
    }

    if($(".themeList:not(.themelistTitle)").length == 0){
        // tipText += "，页面没有更多数据了。";
            $("#mainContent").append("<p class='listBtmTip nodata'>没有主题数据</p>");
            $(".themeListBtm").remove();
    }


    delete localFullData.recordData[themeId];
    updateLocalRecordData(localFullData);
    printLog(thisFucName,"主题删除成功，页面展示元素及本地数据均已清除",themeId,localThemeObj.themeName);
    showToast(tipText);
    closeAllWin();

    let undownloadInfo = localGet("undownload_changed_info");
    if(notNull(undownloadInfo) && getJsonLength(undownloadInfo)!=0){
        delete undownloadInfo[themeId];
        localSave("undownload_changed_info",undownloadInfo);
        printLog(thisFucName,"该主题的未下载变动信息已清除");
    }

    checkIfDownload();
            
    checkShowingRecordUpdate();

}

function uploadFileConfirm(targetThemeId){
    const thisFucName = arguments.callee.name.toString();

    let localFullData = getLocalRecordData();
    let localDataExist = checkRecordData(1,localFullData);

    if(!localDataExist){
        $("#txtFileUpload").click(); 
        return;
    }

    if(notNull(targetThemeId)){
        if(!localFullData.recordData.hasOwnProperty(targetThemeId)){
            showTip("主题已被删除，无法下载。","页面当前展示内容发生变动，刷新看看吧。",-1,6);
            printLog(thisFucName,"本地数据找不到指定的themeid",targetThemeId);
            return;
        }

        let themeName = localFullData.recordData[targetThemeId].themeName;
        let themeRecordNum = getJsonLength(localFullData.recordData[targetThemeId].recordList);
        if(themeRecordNum == 0){
            $("#txtFileUpload").click();
            return;
        }
        let themeRecordContentNum = 0;
        let themeRecordTextNum = 0;
        $.each(localFullData.recordData[targetThemeId].recordList,function(index,item){
            themeRecordContentNum += item.dayContentDetail.length;
            $.each(item.dayContentDetail,function(i,t){
                themeRecordTextNum += innerTextTransform(t.replace(/&#10;/g,"")).length;
            });
        });

        $(localFullData.recordData[targetThemeId].recordList)
        showTip("要上传数据文件覆盖 「 "+themeName+" 」的现有记录吗？<br>共 " + themeRecordNum.toLocaleString() + " 条记录，包含 "+themeRecordContentNum.toLocaleString()+" 项内容，总计 " + themeRecordTextNum.toLocaleString() + " 字。",
            "覆盖后无法恢复，建议先下载当前记录数据进行备份。",5,5,{"themeId":[targetThemeId]});
    }else{
        $("#txtFileUpload").removeAttr("themeid");
        let crtThemeNum = getJsonLength(localFullData.recordData);
        let totalRecordNum = 0;
        let totalContentNum = 0;
        let totalTextNum = 0;
        $.each(localFullData.recordData,function(themeIndex,theme){
            totalRecordNum += getJsonLength(theme.recordList);
            $.each(theme.recordList,function(dayRecordIndex,dayRecord){
                totalContentNum += dayRecord.dayContentDetail.length;
                $.each(dayRecord.dayContentDetail,function(contentIndex,content){
                    
                    totalTextNum += innerTextTransform(content.replace(/&#10;/g)).length;
                    
                });
            });
        });
        showTip("⚠️ 确认上传数据文件覆盖全部 "+ crtThemeNum.toLocaleString()+" 个主题的记录吗？<br>共 " + totalRecordNum.toLocaleString() + " 条记录，包含 "+totalContentNum.toLocaleString()+" 项内容，总计 " + totalTextNum.toLocaleString() + " 字。",
            "覆盖后无法恢复，建议先下载当前记录数据进行备份。",5,5);
    }

}

/**
 *展示系统设置弹窗 
 */
function showSystemConfigWin(){
    const thisFucName = arguments.callee.name.toString();


    //获取所有颜色模式选项
    let colorModeOptions = "";
    Object.entries(VALID_COLOR_MODE).forEach(([key, value]) => {
     colorModeOptions += "<option value='"+ key +"'>"+ value +"</option>";
    });

    $("#sysColorModeSlt").html(colorModeOptions);
    
    //获取用户偏好 - 颜色模式
    let userColorPrefer = getUserPreferance("system_dark_mode_prefer");

    //弹窗中回显用户当前颜色模式选择（默认为AUTO）
    if(!notNull(userColorPrefer)
        || typeof userColorPrefer !== "string" 
        || userColorPrefer.trim() === "" 
        || !Object.keys(VALID_COLOR_MODE).includes(userColorPrefer)){
            userColorPrefer = "AUTO";
    }
    $('#sysColorModeSlt').val(userColorPrefer);

    //给弹窗中颜色模式选项绑定选中事件
    $("#sysColorModeSlt").off("change").on("change",function(){
        let colorMode = $(this).val().toString().toUpperCase();
        updateUserPreferance("system_dark_mode_prefer",colorMode);
        forceSwitchColorMode(colorMode,1);
        showToast("颜色模式已切换为「 "+ VALID_COLOR_MODE[$(this).val()] +" 」");
    });

    //组合所有主题色
    let themeColorOptions = "";
    $.each(THEME_COLOR_OPTION,function(index,item){
        themeColorOptions += "<div class='themeColorOption " + item.value +"' themeColorValue='" + item.value +"'>"
                                 + "<p class='insideColor iconfont icon-checked' style='background-color:"+item.color+"'></p><p class='insideColorName'>"+ item.name +"</p>"
                            +"</div>";
    });
    $("#sysThemeColorList").html(themeColorOptions);

    //获取用户偏好 - 主题色
    let userThemeColorPrefer = getUserPreferance("system_theme_color_prefer");
    //弹窗中回显用户当前主题色选择（默认为蓝色BLUE）
    if(!notNull(userThemeColorPrefer)
        || typeof userThemeColorPrefer !== "string" 
        || userThemeColorPrefer.trim() === ""
        || !THEME_COLOR_OPTION.some(item => item.value === userThemeColorPrefer)
      ){
            printLog(thisFucName,"无法识别的「主题色」用户偏好：",userThemeColorPrefer);
            userThemeColorPrefer = "blueTheme";
    }

    let selectedThemeColor = $("[themeColorValue="+userThemeColorPrefer+"]");
    if(selectedThemeColor.length > 0){
        selectedThemeColor.addClass("selected");
    }

    //给弹窗中主题色选项绑定选中事件
    $(".insideColor").off("click").on("click",function(){
        const thisColorObj = $(this).closest(".themeColorOption");
        if(thisColorObj.hasClass("selected")){
            // printLog("点击当前主题色");
            return;
        }

        const userThemeColor = thisColorObj.attr("themecolorvalue");
        const sysColorItem = THEME_COLOR_OPTION.find(item => item.value === userThemeColor);
        if(!sysColorItem){
            printLog(thisFucName,"无法识别的「主题色」选项：",userThemeColor);
            showToast("主题色设置失败，刷新页面重试下吧。");
            return;
        }
        
        $("html").css("--themeColor",sysColorItem.color);
        $(".themeColorOption.selected").removeClass("selected");
        $("[themeColorValue="+userThemeColor+"]").addClass("selected");
        updateUserPreferance("system_theme_color_prefer",userThemeColor);
        showToast("主题色已设置为「 "+sysColorItem.name+" 」");

    });

    //当前版本
     //重新加载版本信息 判断是否有更新
    const loadedVersionJS = $("#sysVersionJS");
    const loadedVersionSrc = loadedVersionJS.attr("src").replace(/(\.js).*/, "$1");
    const latestVersionJS = document.createElement("script");
    latestVersionJS.src = loadedVersionSrc + "?t=" + Date.now();
    latestVersionJS.id = "sysVersionJS";
    document.body.appendChild(latestVersionJS);
    loadedVersionJS.remove();



    let showVersionInfo = "";
    if(LOADED_VERSION != versionInfo.latest_version){
        showVersionInfo += "<span id='newRersionReminder'>点击更新</span>";
        printLog(thisFucName, "监测到新版本："+versionInfo.latest_version,versionInfo);
    }
    showVersionInfo += "<span>" + LOADED_VERSION + "</span>";

    $("#systemConfigWin #sysVersionInfo").html(showVersionInfo);
    $("#newRersionReminder").off("click").on("click",function(){
        // closeAllWin();
        // showTip("确认刷新页面更新至 "+versionInfo.latest_version+" 版本吗？","更新内容：<br/>"+versionInfo.update_info,4,6);
        location.reload(); 
    });

    closeAllWin();
    WinDragInit($("#systemConfigWin .winTitle")[0],$("#systemConfigWin")[0]);
    $("body").addClass("noScroll");
    $("#alertBgWin,#systemConfigWin").show();

    
}


/*
//获取V6.0之前版本的记录数据
function getOldVersionData(){
    let localFullData = localGet("local_storage_record_data");
    return localFullData.recordData;
}*/

/**向指定主题id插入记录数据**/
/*function insertData(themeId,recordData){
    let localFullData = getLocalRecordData();
    let insertTheme = localFullData.recordData[themeId];
    //向本地存储数据中插入指定日期的对应记录
    $.each(recordData,function(index,item){
        insertTheme.recordList[index] = {};
        insertTheme.recordList[index] = item;
    });

    localFullData.recordData[themeId] = insertTheme;

    updateLocalRecordData(localFullData);
}*/


