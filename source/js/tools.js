function autoShowContentByQueryParams() {
    const thisFucName = arguments.callee.name.toString();

    const localFullData = getLocalRecordData();
    const localFullDataExist = checkRecordData(1, localFullData);
    const pageRequestParams = getQueryParams();

    if (!notNull(pageRequestParams) || getJsonLength(pageRequestParams) == 0) {
        printLog(thisFucName, "当前页面无任何查询参数,将展示默认主题记录");
        showRecords();
        return;
    }

    if (!pageRequestParams.hasOwnProperty("showType") || !notNull(pageRequestParams.showType)) {
        printLog(thisFucName, "查询参数中showType不存在或为空，将展示默认主题记录", pageRequestParams);
        showRecords();
        return;
    }

    //showType为themeList
    if (pageRequestParams.showType == "themeList") {

        printLog(thisFucName, "查询参数中指定showType为themeList");
        if (localFullDataExist) {
            showThemeList();
        } else {
            printLog(thisFucName, "当前本地无数据，无法展示主题列表");
            removeQueryParam("showType");
            removeQueryParam("fromThemeId");
            showRecords();
        }

        //showType为recordList
    } else if (pageRequestParams.showType == "recordList") {

        printLog(thisFucName, "识别到查询参数中指定showType为recordList");

        //没有themeId 直接展示默认主题
        if (!pageRequestParams.hasOwnProperty("themeId")) {
            printLog(thisFucName, "查询参数缺失指定themeId,将展示默认主题记录");
            showRecords();
            return;
        }

        let showThemeId = pageRequestParams.themeId;
        //如果查询参数中指定的themeId不存在，直接展示默认主题信息，不继续识别
        if (!localFullDataExist || !localFullData.recordData.hasOwnProperty(showThemeId)) {
            printLog(thisFucName, "查询参数指定的themeId不存在，将展示默认主题记录");
            showRecords();
            return;
        }

        //同时存在searchKey和searchType
        if (pageRequestParams.hasOwnProperty("searchKey") && pageRequestParams.hasOwnProperty("searchType")) {

            let searchKey = decodeURIComponent(pageRequestParams.searchKey);
            let searchType = pageRequestParams.searchType;

            if (!notNull(searchKey)) {
                printLog(thisFucName, "查询参数中searchKey为空，将展示主题记录：", pageRequestParams);
                showRecords(null, null, null, null, showThemeId);
                return;
            }

            if (searchType == 1) {
                printLog(thisFucName, "识别到查询参数中指定的查询关键词：", searchKey);
                keySearch(decodeURIComponent(searchKey), showThemeId);
            } else if (searchType == 2) {
                printLog(thisFucName, "识别到查询参数中指定的查询日期：", searchKey);
                let searchDate = new Date(decodeURIComponent(searchKey).replace(/\//g, "-") + "T00:00:00");
                if (!isNaN(searchDate)) {
                    let dateSerResult = dateSearch(searchDate.getTime(), showThemeId);
                    showDateSearchResult(dateSerResult, 1);
                } else {
                    printLog(thisFucName, "查询参数中指定的查询日期异常,将直接展示主题数据：", searchKey);
                    showRecords(null, null, null, null, showThemeId);
                }
            } else {
                printLog(thisFucName, "查询参数中指定的searchType异常,将直接展示主题记录内容", searchType);
                showRecords(null, null, null, null, showThemeId);
            }

            //没有同时存在searchKey和searchType，展示指定themeId即可
        } else {
            printLog(thisFucName, "searchType和SearchKey没有同时存在,进行指定themeId的展示处理：", showThemeId);
            showRecords(null, null, null, null, showThemeId);
        }
        //showType为其他，无法识别
    } else {
        printLog(thisFucName, "showType无法识别，进行默认主题记录展示");
        showRecords();
    }

}

const functionParamMappings = {

}

function notNull(obj) {

    if (obj === null || obj === undefined) return false;

    if (typeof obj === "string" && obj.trim() === "") return false;

    if (typeof obj === "object" && !Array.isArray(obj) && Object.keys(obj).length === 0) return false;


    return true;

}

function getJsonLength(json) {
    let length = 0;

    try {
        //let data = $.parseJSON(json);
        $.each(json, function() {
            length++;
        });
    } catch (e) {
        return 0;
        printLog(arguments.callee.name.toString(), "处理参数可能不是JSON对象", e);
    }
    return length;
}

/*
 * 将内容转义为innerText
 */
function innerTextTransform(str) {
    //printLog(arguments.callee.name.toString(),"innerText转义开始，转义前：",str);
    let innerTextValue = str;
    if (typeof(str) != "undefined" && str != null && str != "") {
        let tempDiv = document.createElement("div");
        tempDiv.innerHTML = str;
        innerTextValue = tempDiv.innerText;
        tempDiv = null;
    }
    // innerTextValue = innerTextValue.replace(/\n/g,"&#10;");
    //printLog(arguments.callee.name.toString(),"innerText转义成功，转义后：",innerTextValue);
    return innerTextValue;
}

/*
 * 将内容反转义为innerHTML
 */
function innerHtmlTransform(str) {
    //printLog(arguments.callee.name.toString(),"innerHtml转义开始，转义前：",str);
    let innerHtmlValue = str;
    if (typeof(str) != "undefined" && str != null && str != "") {
        let tempDiv = document.createElement("div");
        tempDiv.innerText = str;
        innerHtmlValue = tempDiv.innerHTML;
        tempDiv = null;
    }
    //printLog(arguments.callee.name.toString(),"innerHtml转义成功，转义后：",innerHtmlValue);
    return innerHtmlValue;
}

/**
 * 展示记录内容时，弹窗内输入框高度自适应内容高度
 * */
function textareaHeightAutoShow() {
    $(".editRecordInput").each(function() {
        $(this).height("auto");
        $(this).height(this.scrollHeight + "px");
    });
}

/**
 * 输入框高度随着【输入】内容自适应
 * */
function textareaHeightAutoInput() {
    $(".editRecordInput").each(function() {}).on("input propertychange", function() {
        let now_height = $("#editRecordWin .winMainContent").scrollTop();
        $(this).height("auto");
        $(this).height(this.scrollHeight + "px");
        $("#editRecordWin .winMainContent").scrollTop(now_height);
    });
}

/**
 *
 * 过滤重复出现的字符串（只保留一个）
 * @param str 过滤前的字符串
 * @param s 需要过滤的字符串
 * @return 祛重后的字符串
 **/
function filterMultipleStr(str, s) {
    let result = "";
    if (typeof(str) != "undefined" && str != null && typeof(s) != "undefined" && s != null) {
        let t = s;
        let r = new RegExp(t, "g");
        let rr = new RegExp(t + t, "g");
        let if_exist = str.lastIndexOf(t + t); //字符串里是否存在连续出现两次的需要过滤对象
        while (if_exist != -1) {
            str = str.replace(rr, t); //把连续出现两次的替换成1个
            if_exist = str.lastIndexOf(t + t);
            let begin_str = str.substring(0, t.length);
            let end_str = str.substring(str.length - t.length, str.length);
            if (end_str == t) {
                str = str.substring(0, str.length - t.length);
            }
            if (begin_str == t) {
                str = str.substring(t.length, str.length);
            }
        }
        if (str.lastIndexOf(t) != -1) { //字符串中还存在需要过滤的内容
            let begin_str = str.substring(0, t.length);
            let end_str = str.substring(str.length - t.length, str.length);
            if (end_str == t) { //字符串的末尾是需要过滤的内容，去掉此内容
                str = str.substring(0, str.length - t.length);
            }
            if (begin_str == t) { //字符串的开头是需要过滤的内容，去掉此内容
                str = str.substring(t.length, str.length);
            }
        }
        result = str;
    }

    return result;
}

/**
 * 监听页面回退事件 
 **/
function listenPageBack() {
    window.addEventListener("popstate", function(event) {
        //获取回退后的地址
        const newURL = window.location.href;
        printLog("listenPageBack", "页面发生回退：", newURL);
        //刷新页面和根据页面参数识别展示内容的方式，都会导致页面只能回退一次
        //window.location.reload();
        autoShowContentByQueryParams();
    });
}

//更新页面查询参数
function updateQueryParam(key, value) {
    // 获取当前 URL
    let currentUrl = new URL(window.location.href);

    // 更新查询参数
    currentUrl.searchParams.set(key, value);

    // 更新 URL 不刷新页面
    history.pushState(null, '', currentUrl.toString());

    //location.href = currentUrl.toString();
}


//移除页面查询参数
function removeQueryParam(key) {
    // 获取当前 URL
    const url = new URL(window.location.href);

    // 删除指定的查询参数
    url.searchParams.delete(key);

    // 更新地址栏
    history.replaceState(null, "", url.toString());
}


function getQueryParams() {
    let url = location.search;
    let requestParams = new Object();
    if (url.indexOf("?") != -1) {
        let str = url.substr(1);
        strs = str.split("&");
        for (let i = 0; i < strs.length; i++) {
            requestParams[strs[i].split("=")[0]] = decodeURI(strs[i].split("=")[1]);
        }
    }
    return requestParams;
}


function datePickerInit() {
    $("#otherDayInput").datetimepicker({
        format: "YYYY/MM/DD",
        locale: moment.locale("zh-cn"),
        icons: {
            previous: "iconfont icon-left",
            next: "iconfont icon-right"
        },
        tooltips: {
            today: "今天",
            clear: "清空",
            close: "关闭",
            selectMonth: "选择月份",
            prevMonth: "上一月",
            nextMonth: "下一月",
            selectYear: "选择年份",
            prevYear: "上一年",
            nextYear: "下一年",
            selectDecade: "选择年代",
            prevDecade: "上一个十年",
            nextDecade: "下一个十年",
            prevCentury: "上个世纪",
            nextCentury: "下个世纪",
            pickHour: "Pick Hour",
            incrementHour: "Increment Hour",
            decrementHour: "Decrement Hour",
            pickMinute: "Pick Minute",
            incrementMinute: "Increment Minute",
            decrementMinute: "Decrement Minute",
            pickSecond: "Pick Second",
            incrementSecond: "Increment Second",
            decrementSecond: "Decrement Second",
            togglePeriod: "Toggle Period",
            selectTime: "Select Time",
        },
        //keepOpen: true,
        // showClose: true,
        // showTodayButton: true,
        //defaultDate: new Date(),
        useCurrent: false,
        viewDate: new Date(),
        //debug: true,
        // ignoreReadonly: true,
        // focusOnShow: true,
        widgetParent: $("#labelOtherDay")
    });

    $("#labelOtherDay").click(function() {
        $("#otherDayInput").focus();
        if ($("body").hasClass("dark-mode")) {
            $(".bootstrap-datetimepicker-widget.dropdown-menu").addClass("dark-mode");
            $(".bootstrap-datetimepicker-widget.dropdown-menu.bottom").addClass("dark-mode");
        }
    });

    $("#otherDayInput").focus(function() {
        $("#otherDayInput").attr("readonly", "readonly");
        setTimeout(function() {
            $("#otherDayInput").removeAttr('readonly');
        }, 200);
    });

    $("#otherDayInput").blur(function() {
        let selectDate = $("#otherDayInput").val();
        //printLog(selectDate);
        if (selectDate != null && selectDate != "") {
            $("#otherDayText").html(selectDate);
        } else {
            let todayDate = getCrtTime();
            $("#otherDayText").html(todayDate.year + "/" + zeroFormat(todayDate.month) + "/" + zeroFormat(todayDate.day));
        }
    });

    $("#otherDayInput").on("dp.show", function() {
        printLog("#otherDayInput.on(dp.show)");
        let crtSelectDate = $("#otherDayInput").val();
        let showDate = new Date();
        if (crtSelectDate) {
            showDate = new Date(crtSelectDate.replace(/\//g, "-") + "T00:00:00");
        }
        // printLog("datetimepicker - show","本次应展示日期：",showDate);
        $("#otherDayInput").data("DateTimePicker").date(showDate);
    });
}



function zeroFormat(a) { //判断是否要在数字前加0
    return a < 10 ? '0' + a : a;
}

function fliterNullData(data) {
    let fliterData = [];
    let flitNum = 0;
    $.each(data, function(index, item) {
        if (item != null && typeof(item) != "undefined") {
            fliterData.push(item);
        } else {
            flitNum++;
        }
    });
    if (flitNum != 0) printLog(arguments.callee.name.toString(), "已过滤数组中空数据")

    return fliterData;
}

function localSave(name, data) {
    if (notNull(name) && typeof(data) != "undefined") {
        if (name == "local_storage_record_data") {
            data.contentUpdateTime = (new Date()).getTime();
        }
        try {
            localStorage.setItem(name, JSON.stringify(data));
        } catch (e) {
            printLog("更新本地存储时出现异常", e);
            showTip("数据存储时出现异常，请检查数据保存是否成功。", "注意，请避免在浏览器的“无痕窗口”下使用当前工具。", -1, 11);
        }

    } else {
        printLog(arguments.callee.name.toString(), "必要参数不全");
    }
}

function localGet(name) {
    if (typeof(name) != "undefined" && name != "") {
        let localData = localStorage.getItem(name);
        if (!notNull(localData)) {
            return null;
        } else {
            return $.parseJSON(localData);
        }

    } else {
        printLog(arguments.callee.name.toString(), "必要参数不全");
    }
}

function getCrtTime() {
    let weeks = new Array("周日", "周一", "周二", "周三", "周四", "周五", "周六");
    let crtDate = new Date();
    let crtYear = crtDate.getFullYear();
    let crtMonth = crtDate.getMonth() + 1;
    let crtDay = crtDate.getDate();
    let crtWeek = weeks[crtDate.getDay()];
    let crtWeekNum = crtDate.getDay();
    let crtHour = crtDate.getHours();
    let crtMinute = crtDate.getMinutes();
    let crtSecond = crtDate.getSeconds();
    let crtTimeNum = crtYear.toString() + zeroFormat(crtMonth).toString() + zeroFormat(crtDay).toString() + crtHour.toString() + crtMinute.toString() + crtSecond.toString();
    let crtTimestamp = crtDate.getTime();
    //时间格式示例：2020-02-01 01:01:01
    // let crtTime = crtYear + '-' + crtMonth + "-" + CrtDay + " " + crtHour + ':' + crtMinute + ":" + crtSecond;
    let crtTimeData = {
        "year": crtYear,
        "month": crtMonth,
        "day": crtDay,
        "hour": crtHour,
        "minute": crtMinute,
        "second": crtSecond,
        "weekNum": crtWeekNum,
        "week": crtWeek,
        "crtTimeNum": crtTimeNum,
        "crtTimestamp": crtTimestamp
    };
    // printLog(JSON.stringify(crtTimeData));
    return crtTimeData;
}

function getTimeText(timstamp, conCHWords, connectStr, hideThisYear, hideSeconds, autoPreZeros) {

    let thisDate = new Date();
    let nowDate = new Date();

    //未指定时间戳或指定时间戳不合法，默认为当前时间
    if (notNull(timstamp) && !isNaN(new Date(Number(timstamp)))) {
        thisDate = new Date(Number(timstamp));
    }

    let dateNums = {};
    dateNums.year = thisDate.getFullYear();
    dateNums.month = thisDate.getMonth() + 1;
    dateNums.date = thisDate.getDate();
    dateNums.hour = thisDate.getHours();
    dateNums.minute = thisDate.getMinutes();
    dateNums.second = thisDate.getSeconds();
    dateNums.week = thisDate.getDay() == 0 ? 7 : thisDate.getDay()

    //未指定是否展示年月日，默认为展示年月日
    if (!notNull(conCHWords)) {
        conCHWords = true;
    }

    //不展示年月日文字且未提供其他连接字符，默认为“.”
    if (!notNull(connectStr) && !conCHWords) {
        connectStr = ".";
    }

    //未指定隐藏当前年，默认为隐藏
    if (!notNull(hideThisYear)) {
        hideThisYear = true;
    }

    //未指定隐藏秒，默认为展示
    if (!notNull(hideSeconds)) {
        hideSeconds = false;
    }

    //未指定是否自动补零，默认为是
    if (!notNull(autoPreZeros)) {
        autoPreZeros = true;
    }

    let hideYearText = false;
    if (hideThisYear && thisDate.getFullYear() == nowDate.getFullYear()) {
        hideYearText = true;
    }


    let dateYearText = thisDate.getFullYear();
    let dateMonthText = autoPreZeros ? perZero(thisDate.getMonth() + 1, 2) : thisDate.getMonth() + 1;
    let dateDayText = autoPreZeros ? perZero(thisDate.getDate(), 2) : thisDate.getDate();

    let dateHourText = autoPreZeros ? perZero(thisDate.getHours(), 2) + ":" : thisDate.getHours() + ":";
    let dateMinText = autoPreZeros ? perZero(thisDate.getMinutes(), 2) : thisDate.getMinutes();
    let dateSecText = autoPreZeros ? ":" + perZero(thisDate.getSeconds(), 2) : ":" + thisDate.getSeconds();
    dateSecText = hideSeconds ? "" : dateSecText;

    if (conCHWords) {
        dateYearText = hideYearText ? "" : dateYearText + "年";
        dateMonthText = dateMonthText + "月";
        dateDayText = dateDayText + "日";
    } else {
        dateYearText = hideYearText ? dateYearText + connectStr : "";
        dateMonthText = dateMonthText + connectStr;
        dateDayText = dateDayText + connectStr + "";
    }

    const EnWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const ChWeek = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

    let dateText = {};
    dateText.dateNums = dateNums;
    dateText.dateText = dateYearText + dateMonthText + dateDayText;
    dateText.timeText = dateHourText + dateMinText + dateSecText;
    dateText.fullText = dateYearText + dateMonthText + dateDayText + " " + dateHourText + dateMinText + dateSecText;
    dateText.CHWeek = ChWeek[thisDate.getDay()];
    dateText.ENWeek = EnWeek[thisDate.getDay()];
    //let t = getCrtTime();
    //let time = t.year+"-"+zeroFormat(t.month)+"-"+zeroFormat(t.day)+" "+zeroFormat(t.hour)+":"+zeroFormat(t.minute)+":"+zeroFormat(t.second);

    return dateText;
}

function showError(i, isReload) { //isReload为true 按钮为刷新重试
    closeAllWin();
    let errorInfo = i;
    let btnText = isReload;
    if (typeof(i) == "undefined" || i.toString().trim().length == 0) {
        errorInfo = "出现未知异常，请联系开发者修复。"
    }
    if (isReload) {
        btnText = "刷新重试";
        document.getElementById("IKCloseBtn").onclick = function() {
            location.href = location;
        };
    } else {
        btnText = "知道了";
        document.getElementById("IKCloseBtn").onclick = closeAllWin;
    }

    document.getElementById("errorErrorInfo").innerHTML = errorInfo;
    document.getElementById("IKCloseBtn").innerHTML = btnText;
    document.getElementById("editRecordWin").style.display = "none";
    document.getElementById("infoWin").style.display = "none";
    document.getElementById("alertBgWin").style.display = "block";
    document.getElementById("errorWin").style.display = "block";
    document.body.classList.add('noScroll');
    WinDragInit(document.getElementById("errorWin").getElementsByClassName("dragBar")[0], document.getElementById("errorWin"));
}

/*
 *toast提示 
 *tip：提示内容
 *time：展示时间，单位毫秒，默认3秒，不得低于1秒
 */
function showToast(tip, time) {
    let duration = 3000; //默认展示时间3秒
    if (notNull(time) && time > 2000 && time < 10000) {
        duration = time; //如果指定了展示时间，且指定时间不小于2秒不超过10秒，则按照指定时间展示
    }
    let nowToast = $(".toastTip");
    if (nowToast.length > 0) {
        nowToast.remove();
    }
    let toastTip = $("<div>");
    toastTip.attr("class", "toastTip");
    toastTip.html(tip);
    $(document.body).append(toastTip);
    toastTip.fadeIn(100, function() {
        // 淡入完成后，设置一个setTimeout，在duration毫秒后淡出
        setTimeout(function() {
            toastTip.fadeOut(500, function() {
                // 淡出完成后移除元素
                toastTip.remove();
            });
        }, duration - 100); // 减去淡入动画的时间，确保总显示时间为duration
    });

}

/**
 * 获取指定函数的参数名（不支持获取有默认值的参数，如test(a=1,b)）
 * */
function getFunctionParams(func) {
    const funcStr = func.toString();

    //正则提取括号内的字符串
    const paramMatch = funcStr.match(/\(([^)]*)\)/);
    if (!paramMatch) return [];

    //提取参数名并去除空格
    const params = paramMatch[1]
        .split(',')
        .map(param => param.trim())
        .filter(param => param); // 过滤空参数

    return params;
}

/**
 * 展示操作提示条
 * tip:文字内容
 * actionName:按钮名称
 * action:按钮的点击事件
 * time:展示时间，单位毫秒，默认5秒，不得低于2秒
 * @param params 需要执行函数需要的参数
 **/

function showActionBar(tip, actionName, action, params, time) {

    if (typeof(tip) == "undefined" || tip == null || tip == "") {
        printLog("showActionBar", "缺少tip参数");
        return;
    }

    if (typeof(actionName) == "undefined" || actionName == null || actionName == "") {
        printLog("showActionBar", "缺少actionName参数");
        return;
    }

    if (typeof(action) == "undefined" || action == null || action == "") {
        printLog("showActionBar", "缺少action参数");
        return;
    }

    let duration = 5000;
    if (notNull(time) && time > 2000 && time < 10000) {
        duration = time;
    }

    const thisToastTip = $(".toastTip");
    if (thisToastTip.length > 0) {
        const toastText = thisToastTip.text();
        const connStr = toastText[toastText.length - 1] == "。" ? "" : "。";
        tip = toastText + connStr + tip;
        duration += 2000;
        thisToastTip.remove();
    }

    const nowActionBar = $(".toastActionBar");
    if (nowActionBar.length > 0) {
        nowActionBar.remove();
    }
    const toastActionBar = $("<div>");
    toastActionBar.attr("class", "toastActionBar");
    if ($("body").hasClass("dark-mode")) {
        toastActionBar.addClass("dark-mode");
    }
    let toastActionBarContent = "<span class='toastActionBarTip'>" + tip + "</span><span class='toastActionBarBtn'>" + actionName + "</span>";
    toastActionBar.html(toastActionBarContent);
    $(document.body).append(toastActionBar);

    //存储倒计时相关变量
    window.actionBarTimer = null;
    let leftTime = duration;
    let startTime = null;

    //开始倒计时函数
    const startTimer = () => {

        //清除已有计时器
        if (actionBarTimer) clearTimeout(actionBarTimer);

        //记录开始时间
        startTime = Date.now();

        //设置新计时器
        actionBarTimer = setTimeout(function() {
            toastActionBar.fadeOut(500, function() {
                toastActionBar.remove();
            });
        }, leftTime - 100);

    };

    //显示actionBar并开始倒计时
    toastActionBar.fadeIn(100, function() {

        startTimer();
        printLog("actionBar.fadeIn", tip, actionName, action);

        //鼠标进入actionBar时暂停倒计时
        toastActionBar.off("mouseenter").on("mouseenter", function() {
            if (actionBarTimer) {
                //清除计时器
                clearTimeout(actionBarTimer);
                //计算剩余时间
                const pastTime = Date.now() - startTime + 100;
                leftTime = Math.max(0, leftTime - pastTime);
                actionBarTimer = null;
                printLog("toastActionBar.mouseenter", "倒计时暂停，已过去：", pastTime);
            }
        });

        //鼠标离开actionBar后倒计时继续
        toastActionBar.off("mouseleave").on("mouseleave", function() {
            if (!actionBarTimer && leftTime > 0) {
                //恢复倒计时
                printLog("toastActionBar.mouseleave", "倒计时恢复，还剩余：", leftTime);
                startTimer();
            }
        });

        //点击actionBar中的按钮 执行对应的函数
        $(".toastActionBarBtn").off("click").on("click", function(e) {
            //清除计时器
            if (actionBarTimer) clearTimeout(actionBarTimer);
            toastActionBar.remove();

            let paramMapping = functionParamMappings[action];
            const func = window[action];
            if (typeof func === "function") {
                paramMapping = getFunctionParams(func);
                functionParamMappings[action] = paramMapping;
            }

            if (paramMapping) {
                const args = paramMapping.map(key => params?.[key]);
                printLog("actionBar.run:", action);
                window[action].apply(null, args);

            }
        });

    });

}


/**
 *
 *e为提示内容
 *i为下一步操作提示文案
 *@param action 为次操作按钮（0或其他关闭；-1不显示；1重新上传；2立即上传；3开始记录；4取消;5确认上传;6我已知晓（下载提示））
 *@param main_action为主操作按钮
 * 0或其他关闭;1重新上传；2立即上传；3开始记录；4确认删除指定记录；5下载当前数据；6刷新；
 * 7立即下载(首次添加记录下载提示专用);8，确认删除（清空历史搜索记录）;9,在指定主题下添加记录；
 * 10删除主题；11知道了
 *@param actionParams 指定方法需要的参数
 *
 **/
function showTip(e, i, action, main_action, actionParams) {

    let infoInfo = e;
    let tipInfo = i;
    let actionName = "";
    let mainActionName = "";
    $("#mainActionBtn").width("auto");

    if (typeof(e) == "undefined" || e == "" || e == null) {
        infoInfo = "操作出现未知异常。";
    }
    if (typeof(i) == "undefined" || i == "" || i == null) {
        tipInfo = "";
    }

    if (typeof(action) == "undefined") action = 0;
    if (typeof(main_action) == "undefined") main_action = 0;

    //次操作按钮配置
    switch (action){
        
        case -1:
            actionName = "";
            break;

        case 0:
            actionName = "关闭";
            $("#action1Btn").off("click").on("click", function() { closeAllWin(); });
            break;

        case 1:
            actionName = "重新上传";
            $("#action1Btn").off("click").on("click", function() { $("#txtFileUpload").click(); }); 
            break;

        case 2:
            actionName = "上传数据文件";
            $("#action1Btn").off("click").on("click", function() { $("#txtFileUpload").click(); });
            break;

        case 3:
            actionName = "开始记录";
            $("#action1Btn").off("click").on("click", function() { createNewRecord(); });
            break;

        case 4:
            actionName = "取消";
            $("#action1Btn").off("click").on("click", function() { closeAllWin(); });
            break;

        case 5:
            actionName = "下载当前记录";
            $("#action1Btn").off("click").on("click", function() { downloadFileConfirm(actionParams.themeId); });
            break;

        case 6:
            actionName = "我已知晓";
            $("#action1Btn").off("click").on("click", function() {
                closeAllWin();
                downloadReminderConfirm();
            });
            break;

        default:
            actionName = "关闭";
            $("#action1Btn").off("click").on("click", function() { closeAllWin(); });
    }
    
    //主操作按钮配置
    switch (main_action){
        case 0:
            mainActionName = "关闭";
            if (actionName == "关闭") $("#action1Btn").hide();
            $("#mainActionBtn").off("click").on("click", function() { closeAllWin(); });
            break;

        case 1:
            mainActionName = "重新上传";
            $("#mainActionBtn").off("click").on("click", function() { $("#txtFileUpload").click(); });
            break;

        case 2:
            mainActionName = "立即上传";
            $("#mainActionBtn").off("click").on("click", function() { $("#txtFileUpload").click(); });
            break;

        case 3:
            mainActionName = "开始新记录";
            $("#mainActionBtn").off("click").on("click", function() { createNewRecord(); }); 
            break;

        case 4:
            mainActionName = "确认删除";
            $("#mainActionBtn").off("click").on("click", function() { deleteDayRecord(actionParams.dataId, actionParams.themeId); });
            break;

        case 5:
           mainActionName = "确认上传并覆盖(5s)";
            $("#mainActionBtn").prop("disabled", true);
            $("#mainActionBtn").off("click").on("click", function() {
                //$("#txtFileUpload").attr("themeId",themeId);
                $("#txtFileUpload").click();
            }); 
            break;

        case 6:
            mainActionName = "刷新页面";
            $("#mainActionBtn").off("click").on("click", function() {
                location.reload();
            });
            break;

        case 7:
            mainActionName = "立即下载";
            $("#mainActionBtn").off("click").on("click", function() {
                downloadFile();
                closeAllWin();
                downloadReminderConfirm();
            });
            break;

        case 8:
             mainActionName = "确认删除";
            $("#mainActionBtn").off("click").on("click", function() {
                deleteKeySearchHistory(null, actionParams.themeId, null, 1);
                closeAllWin();
                //showKeySearchHistory(themeId);   
            });
            break;

        case 9:
            mainActionName = "开始记录";
            $("#mainActionBtn").off("click").on("click", function() {
                closeAllWin();
                showEditWin(0, null, actionParams.themeId);
            });
            break;

        case 10:
            //删除指定主题
            mainActionName = "确认删除(5s)";
            $("#mainActionBtn").prop("disabled", true);
            $("#mainActionBtn").off("click").on("click", function() {
                deleteTheme(actionParams.themeId);
            });  
            break;

        case 11:
            mainActionName = "知道了";
            $("#mainActionBtn").off("click").on("click", function() {
                closeAllWin();
            }); 
            break;

        case 12:
            mainActionName = "确认导入";
            $("#mainActionBtn").off("click").on("click", function() {
                importRecord(actionParams.fileData, actionParams.themeId);
            });
            break;

        default:
            mainActionName = "关闭";
            if (actionName == "关闭") $("#action1Btn").hide();
            $("#mainActionBtn").off("click").on("click", function() {
                closeAllWin();
            });  
    }

    $("#action1Btn").html(actionName); $("#mainActionBtn").html(mainActionName); $(".infoText").html(infoInfo); $(".tipText").html(tipInfo);
    if (action == -1) {
        $("#action1Btn").hide();
    } else {
        $("#action1Btn").show();
    }
    $("#editRecordWin,#errorWin").hide();

    if (main_action == 5) {
        let countDownTime = 4;
        let countDownBtn = function() {
            let seconds = countDownTime;
            // if(typeof(uploadInterval)!="undefined"){
            //  clearInterval(uploadInterval);
            // }    
            window.winActionBtnInterval = setInterval(function() {
                $("#mainActionBtn").text("确认上传并覆盖(" + seconds + "s)");
                seconds--;
                if (seconds < 0) {
                    clearInterval(winActionBtnInterval);
                    $("#mainActionBtn").removeAttr("disabled").text("确认上传并覆盖");
                }
            }, 1000);
        };
        countDownBtn();
    }

    //删除主题
    if (main_action == 10) {

        let deleteThemeCountDownTime = 4;
        let deleteThemeCountBtnDown = function() {
            let seconds = deleteThemeCountDownTime;
            window.winActionBtnInterval = setInterval(function() {
                $("#mainActionBtn").text("确认删除(" + seconds + "s)");
                seconds--;
                if (seconds < 0) {
                    clearInterval(winActionBtnInterval);
                    $("#mainActionBtn").removeAttr("disabled").text("确认删除");
                }
            }, 1000);
        };

        deleteThemeCountBtnDown();
    }

    $("#alertBgWin,#infoWin").show();
    if (main_action == 5 || main_action == 10) {
        $("#mainActionBtn").width(Math.ceil($("#mainActionBtn").width()));
    }

    // const hideCloseIconAry = [];
    if (action == 0 || action == 4) {
        $("#infoWin .closeWinIcon").addClass("hidden");
    } else {
        $("#infoWin .closeWinIcon").removeClass("hidden");
    }
    $("body").addClass("noScroll");


    WinDragInit($("#infoWin .dragBar")[0], $("#infoWin")[0]);  

}

    function closeAllWin() {
        try {
            $(".alertWin").removeAttr("style");
            $("#alertBgWin,.alertWin,#editErrorInfo,.winErrorInfo").hide();
            $(".errorText,.editRecordInput,.infoText,.tipText,#editErrorInfo,.winErrorInfo").html("");
            $(".editRecordInput").val("");
            $("input[name=editRecordDate]").removeAttr("checked");
            $("#todayRadio").prop("checked", true);
            $(".radioLabel").removeClass("radioLabelChecked");
            $("#labelToday").addClass("radioLabelChecked");
            $("#otherDayText").html("其它");
            $("[class='editInputDiv newAdd']").remove();
            $("#addContentBar").show();
            $("#otherDayInput").val("");
            $("#txtFileUpload").val("");

            $("body").removeClass("noScroll");

            if (winActionBtnInterval != null) {
                clearInterval(winActionBtnInterval);
                winActionBtnInterval = null;
                $("#mainActionBtn").removeAttr("disabled");
                $("#mainActionBtn").width("auto");
                //printLog("closeAllWin", "已清除弹窗按钮计时器并解除按钮禁用状态");
            }
        } catch (e) {
            printLog(arguments.callee.name.toString(), "弹窗初始化失败", e.message, e.stack);
        }

    }

    /**
     * 打印日志（仅在debug模式下打印，根据页面查询参数中的debug参数判断）
     * */
    function printLog(logSource, ...args) {
        let queryParams = getQueryParams();

        //页面查询参数debug存在且不是1或true时，不打印日志
        if (queryParams?.debug && ["1", "true"].indexOf(queryParams.debug.toLowerCase()) == -1) {
            return;
        }

        logSource = notNull(logSource) ? logSource : "unknown source";
        let logTime = getTimeText().fullText;
        let logResultInfoAry = [logTime, logSource];

        if (args.length > 0) {
            $.each(args, function(index, item) {
                if (typeof item === "object") {
                    logResultInfoAry.push(item);
                } else {
                    logResultInfoAry.push(String(item));
                }
            });
        }

        console.log(...logResultInfoAry);
    }

    /**
     * 不重复打印日志*/
    let lastPrintMessage = "";

    function printSingleLog(message) {
        if (message !== lastPrintMessage) {
            printLog(message);
            lastPrintMessage = message;
        }
    }


    /*滚动到页面底部时加载下一页
     * isForce 是否强制加载下一页
     ***/
    function autoLoadNextPage(isForce) {

        const thisFucName = arguments.callee.name.toString();

        if ("undefined" != typeof(stopLoadingNextFlag) && stopLoadingNextFlag) {
            return;
        }

        if (isForce) {
            $("#mainContent").trigger("loadNextPage");
            return;
        }

        let loadNextPageFlag = false;

        let listScrollTop = $(window).scrollTop(); //列表已经滚动不可视区域的高度
        let windowHeight = $(window).height(); //窗口可见高度
        let listHeight = $(document).height(); //内容高度

        let themeListShowing = false;

        let pageRequestParams = getQueryParams();
        if (notNull(pageRequestParams) && pageRequestParams.themeList) {
            themeListShowing = true;
        }

        //滚动到距离页面底部小雨50px时触发自动加载下一页
        if (listScrollTop + windowHeight >= listHeight - 50 && !themeListShowing) {
            //printLog(arguments.callee.name.toString(),"触发下一页：已滚动高度："+listScrollTop+"; 窗口可见高度："+windowHeight+"; 文档高度："+listHeight);
            loadNextPageFlag = true;
        }

        if (loadNextPageFlag) {

            if (loadingFlag) return; //如果正在处理，不再重复处理
            loadingFlag = true;

            $("#mainContent").trigger("loadNextPage");

        }

    }

    function ifShowToTop() {
        const thisFucName = arguments.callee.name.toString();

        let crtHeight = $(window).scrollTop();
        let winHeight = $(window).height();

        let pageWidth = $(window).width();
        let contentWidth = $("#mainContent").width();
        let scrollBarWidth = $("#page_scroll").width();

        const localFullData = getLocalRecordData();
        const localFullDataExist = checkRecordData(1, localFullData);
        const pageRequestParams = getQueryParams();

        if (localFullDataExist && pageRequestParams?.showType == "recordList" && pageRequestParams.hasOwnProperty("themeId")) {
            if (!localFullData.recordData.hasOwnProperty(pageRequestParams.themeId)) {
                printLog(thisFucName, "数据异常，找不到当前的主题", pageRequestParams.themeId);
            } else {
                themeName = localFullData.recordData[pageRequestParams.themeId].themeName;
                let pageHtml = $("#pageTopTitle").html();
                if (crtHeight > $("#topNav").height()) {
                    if ($("#pageTopTitle").html() != themeName) {
                        $("#pageTopTitle").html(themeName);
                    }
                } else {
                    $("#pageTopTitle").html(PROJECT_NAME);
                }
            }
        }

        if (crtHeight > 0.5 * winHeight) {
            //printLog(arguments.callee.name.toString(),"显示toTop按钮");

            let rightOffset = (pageWidth - contentWidth) / 2 - scrollBarWidth - 40;
            $("#page_scroll").css("right", rightOffset + "px");
            $("#page_scroll").show();
        } else {
            //printLog(arguments.callee.name.toString(),"隐藏toTop按钮");
            $("#page_scroll").hide();
        }
    }


    /**
     * 将弹窗设置为可拖拽
     * @param crtBar 推拽对象
     * @param crtWin 当前窗口
     * */
    function WinDragInit(crtBar, crtWin) {
        if (typeof(crtBar) != "undefined" && typeof(crtWin) != "undefined") {
            let x = 0;
            let y = 0;
            let l = 0;
            let t = 0;

            $(crtBar).off("mousedown").on("mousedown", function(e) {
                $(this).css("cursor", "grabbing");
                x = e.clientX;
                y = e.clientY;
                l = crtWin.offsetLeft;
                t = crtWin.offsetTop;


                // $(window).on("mousemove",function(me){
                $(this).on("mousemove", function(me) {
                    let nx = me.clientX;
                    let ny = me.clientY;

                    let dragBarWidth = $(crtWin).width();
                    let dragBarHeight = $(crtWin).height();

                    let winMinTop = dragBarHeight * 0.55 + 10;
                    let winMinLeft = dragBarWidth * 0.5 + 10;

                    let windowWidth = $(window).width();
                    let windowHeight = $(window).height();

                    let nl = (nx - x + l) > winMinLeft ? nx - x + l : winMinLeft;
                    let nt = (ny - y + t) > winMinTop ? ny - y + t : winMinTop;

                    let showedEnd = nl + dragBarWidth * 0.5 - 10;
                    if (showedEnd > windowWidth) {

                        nl -= nl + dragBarWidth * 0.5 - windowWidth + 10;

                    }

                    $(crtWin).css({
                        "margin": 0,
                        "left": nl,
                        "top": nt
                    });

                });

            });

            $(crtBar).on("mouseup", function(e) {
                $(this).off("mousemove");
                $(this).css("cursor", "grab");
            });

            $(crtBar).on("mouseover", function(e) {
                $(this).off("mousemove");
                $(this).css("cursor", "grab");
            });
        }
    }

    /**
     * 将字符串中所有对正则表达式有特殊含义的字符进行转义，以确保这些字符在被用作正则表达式模式的一部分时不会被解释为特殊字符
     **/
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& 表示被匹配的字符串
    }

    /*获取文件不可包含的特殊符号数组，且去重*/
    const filenameSpecialChars = /[<>:"/\\|?*]/g;

    function getUniqueFileNameSpecialChars(str) {
        const matches = str.match(filenameSpecialChars) || [];
        return [...new Set(matches)];
    }


    function copyJson(value) {
        let copyOfValue = value;
        if (typeof(value) != "undefined" && value != null) {
            $.each(value, function(index, item) {
                copyOfValue[index] = item;
            });
        }
        return copyOfValue;
    }

    /**
     *切换页面颜色模式
     */
    function forceSwitchColorMode(colorMode) {

        const thisFucName = arguments.callee.name.toString();

        if (typeof colorMode !== "string" || colorMode.trim() == "") {
            printLog(thisFucName, "输入的colorMode参数异常", colorMode);
            return;
        }

        let inputColorMode = String(colorMode).toUpperCase();
        const validMode = Object.keys(VALID_COLOR_MODE);
        if (!validMode.includes(inputColorMode)) {
            inputColorMode = "AUTO";
        }
        let colorChangeFlag = false;

        switch (inputColorMode) {
            case "AUTO":
                if (!window.matchMedia) {
                    printLog(thisFucName, "浏览器不支持matchMedia方法，无法自动适配系统颜色模式");
                    break;
                }
                //系统当前为深色模式
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    printLog(thisFucName, "系统当前为【🌑深色】模式");
                    forceSwitchColorMode("DARK");
                    break;
                    //系统当前为浅色模式
                } else {
                    printLog(thisFucName, "系统当前为【🌞浅色】模式");
                    forceSwitchColorMode("LIGHT");
                    break;
                }
                break;

            case "LIGHT":
                if ($("body").hasClass("dark-mode")) {
                    colorChangeFlag = true;
                    $("body").removeClass("dark-mode");
                }

                if (!$("body").hasClass("light-mode")) {
                    $("body").addClass("light-mode");
                }

                if (colorChangeFlag) {
                    printLog("forceSwitchColorMode", "已将页面设置为「浅色」模式");
                } else {
                    printLog("forceSwitchColorMode", "页面当前为「浅色」模式，无需切换");
                }
                break;


            case "DARK":
                $("body").removeClass("light-mode");

                if (!$("body").hasClass("dark-mode")) {
                    $("body").addClass("dark-mode");
                    colorChangeFlag = true;
                }

                if (colorChangeFlag) {
                    printLog(thisFucName, "已将页面设置为「深色」模式");
                } else {
                    printLog(thisFucName, "页面当前为「深色」模式，无需切换");
                }
                break;

        }

    }

    /**
     * 
     * 设置页面颜色模式
     * 默认为“跟随系统”，用户手动选择后以用户选择为准
     */
    function initDarkMode() {
        const thisFucName = arguments.callee.name.toString();
        const userSelectColorMode = getUserSettings("system_dark_mode_prefer");

        //当前没有用户选择，或用户选择不合法,则默认为跟随系统
        if (!notNull(userSelectColorMode) ||
            typeof userSelectColorMode !== "string" ||
            userSelectColorMode.trim() == "" ||
            !Object.keys(VALID_COLOR_MODE).includes(userSelectColorMode.trim().toUpperCase())) {

            printLog(thisFucName, "当前无用户偏好数据或用户偏好数据不合法，将默认按照【跟随系统】设置颜色模式。")
            forceSwitchColorMode("AUTO");
            return;
        } else {
            printLog(thisFucName, "将按照用户偏好设置页面颜色模式：", userSelectColorMode);
            forceSwitchColorMode(userSelectColorMode);
        }




        /*
            if (!window.matchMedia) {
                printLog(thisFucName, "浏览器不支持matchMedia方法，无法自动适配系统颜色模式");
                return;
            }

            if (window.matchMedia('(prefers-color-scheme: dark)').matches) { //系统当前为深色模式
                printLog(thisFucName, "系统当前为「深色」模式，用户选择：", userSelectColorMode);


                //用户没有选择 或 选择自动 或 选择深色
                if (userSelectColorMode === "LIGHT") {
                    printLog(thisFucName, "需跟随用户设置，切换为「浅色」模式");
                    forceSwitchColorMode("LIGHT");
                } else {
                    forceSwitchColorMode("DARK");
                }
            } else { //系统当前为浅色模式
                printLog(thisFucName, "系统当前为「浅色」模式，用户选择：", userSelectColorMode);
                if (userSelectColorMode === "dark") {
                    printLog(thisFucName, "需跟随用户设置，切换为「深色」模式");
                    forceSwitchColorMode("DARK");
                } else {
                    forceSwitchColorMode("LIGHT");
                }
            }*/

    }

    //添加系统配色监听，自动适配系统配色
    function listenSystemColorMode() {
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(event) {
                printLog("listenSystemColorMode", "监测到系统颜色模式变化");
                initDarkMode();
            });
            printLog("listenSystemColorMode", "系统颜色模式监听添加成功");
        } else {
            printLog("listenSystemColorMode", "浏览器不支持matchMedia方法，无法跟随并监听系统颜色模式");
        }

    }

    //获取用户自定义设置内容，未获取到则返回null
    function getUserSettings(settingName) {
        let userSettings = localGet("user_preferance_data");
        if (userSettings != null) {
            if (typeof(settingName) != "undefined" && settingName != null && settingName.trim() != "") {
                if (userSettings.hasOwnProperty(settingName) && notNull(userSettings[settingName])) {
                    printLog("getUserSettings", "获取到用户的「" + settingName + "」设置为：", userSettings[settingName]);
                    return userSettings[settingName];
                } else {
                    printLog("getUserSettings", "未找到到用户的「" + settingName + "」设置");
                    return null;
                }
            }
        } else {
            printLog("getUserSettings", "未找到到用户的任何设置内容");
            return null;
        }
    }

    /**
     *检查页面展示记录是否有变动 
     */
    function checkShowingRecordUpdate() {

        const thisFucName = arguments.callee.name.toString();
        const pageRequestParams = getQueryParams();

        let pageContentChanged = false;

        //页面为记录展示时，必须有themeId才能判断
        if (pageRequestParams?.showType == "recordList" && !pageRequestParams?.themeId) {
            printLog(thisFucName, "页面查询参数异常，记录页面页面缺失themeid参数，无法判断记录是否变动", pageRequestParams);
            return;
        }

        //获取全部本地记录数据
        let localData = getLocalRecordData();
        if (!notNull(localData)) { //如果本地数据为空，直接结束判断
            if (pageRequestParams?.showType == "recordList" && $(".dayRecordItem").length > 0) {
                showActionBar("记录数据已被删除", "刷新页面", "autoShowContentByQueryParams");
                return;
            }
            if (pageRequestParams?.showType == "themeList" && $(".themeList:not(.themelistTitle)").length > 0) {
                showActionBar("主题数据已被删除", "刷新页面", "autoShowContentByQueryParams");
                return;
            }
            printLog(thisFucName, "未获取到本地数据，无法继续判断页面数据变动。", localData);
            return;
        }

        let localDataExist = false;
        localDataExist = checkRecordData(1, localData);
        if (!localDataExist) {
            printLog(thisFucName, "本地数据为空");
            showToast("当前数据已被删除");
            return;
        }

        //页面没有showType参数说明没有任何可展示内容，但本地存储有数据，说明有变动
        if (!pageRequestParams?.showType && localDataExist) {
            printLog(thisFucName, "本地已有可展示数据，页面可更新", localData);
            let themeNum = getJsonLength(localData.recordData);

            let showThemeListParams = {};
            if (pageRequestParams?.themeId) {
                showThemeListParams.fromThemeId = pageRequestParams.themeId;
            }

            showActionBar("新增 " + themeNum + " 个主题", "立即查看", "showThemeList", showThemeListParams);
            return;
        }

        //当前是【主题列表】展示
        if (pageRequestParams.showType == "themeList") {

            let pageShowingThemeList = $(".themeList:not(.themelistTitle)");
            let pageShowingThemeNum = pageShowingThemeList.length;
            let localThemeNum = getJsonLength(localData.recordData);

            let pageShowedItem = $(".themelistTitle .actionTitle[itemname][itemname!='']");
            let pageShowedItemAry = [];
            if (pageShowedItem.length > 0) {
                $.each(pageShowedItem, function(pageIndex, pageItem) {
                    pageShowedItemAry.push($(pageItem).attr("itemname"));
                });
            }


            //本地没数据，页面展示的有主题数据
            if (!localDataExist && pageShowingThemeNum != 0) {
                printLog(thisFucName, "本地没数据，页面展示的有主题数据");
                showToast("主题已被删除或数据发生丢失", 6000);
                // showActionBar("主题已被删除","点击刷新","autoShowContentByQueryParams",null,4000);
                return;
            }

            //本地有数据，页面展示的主题数据数量跟本地不一致
            if (localDataExist && localThemeNum != pageShowingThemeNum) {
                printLog(thisFucName, "页面展示的主题数据数量跟本地不一致");
                // pageContentChanged = true;
                showActionBar("主题数据有变动", "立即刷新", "autoShowContentByQueryParams");
                return;
            }

            //本地数据与页面展示主题数量一致，检测主题内容是否一致
            if (localDataExist && localThemeNum == pageShowingThemeNum) {


                //判断页面中正在展示的每一个主题信息是否有变动
                $.each(pageShowingThemeList, function(index, item) {
                    let themeId = $(item).attr("themeid");
                    if (!localData.recordData?. [themeId]) {
                        printLog(thisFucName, "本地不存在页面展示的主题ID：", themeId);
                        showActionBar("主题信息有变动", "立即刷新", "autoShowContentByQueryParams");
                        return;
                    }

                    //判断页面中展示的主题名称及其他展示字段（记录数量、总字数）是否有变化
                    let localThemeInfo = localData.recordData[themeId];

                    //主题名称
                    let pageThemeName = $("[themeid='" + themeId + "'] .themeListItem[itemname='themeName']").html();

                    if (pageThemeName != localThemeInfo.themeName) {
                        printLog(thisFucName, innerTextTransform(pageThemeName) + "主题名称已更新为：", localThemeInfo.themeName);
                        showActionBar("主题信息有变动", "立即刷新", "autoShowContentByQueryParams");
                        return;
                    }

                    //判断页面中展示的 除名称外其他展示字段是否有变动
                    let themeInfoChanged = false;
                    $.each(pageShowedItemAry, function(i, t) {

                        if (themeInfoChanged) return;

                        switch (t) {
                            case "recordNum":
                                let themeRecordNum = getJsonLength(localThemeInfo.recordList);
                                let pageRecordNum = $(".themeList[themeid='" + themeId + "'] .themeListItem[itemname='recordNum']").attr("itemvalue");
                                if (themeRecordNum != pageRecordNum) {
                                    printLog(thisFucName, innerTextTransform(pageThemeName) + "的记录总数有变动");
                                    printLog("pageRecordNum：" + pageRecordNum, "themeRecordNum：" + themeRecordNum);
                                    showActionBar("主题数据有更新", "立即刷新", "autoShowContentByQueryParams");
                                    themeInfoChanged = true;
                                    break;
                                }
                                break;


                            case "textNum":
                                let themeTextNum = 0;
                                $.each(localThemeInfo.recordList, function(recordIndex, recordObj) {
                                    $.each(recordObj.dayContentDetail, function(contentIndex, contentObj) {
                                        themeTextNum += innerTextTransform(contentObj.replace(/&#10;/g, "")).length;
                                    });
                                });

                                let pageTextNum = $(".themeList[themeid='" + themeId + "'] .themeListItem[itemname='textNum']").attr("itemvalue");
                                if (themeTextNum != pageTextNum) {
                                    printLog(thisFucName, innerTextTransform(pageThemeName) + "的总字数有变动");
                                    printLog("pageTextNum：" + pageTextNum, "themeTextNum：" + themeTextNum);
                                    showActionBar("主题数据有更新", "立即刷新", "autoShowContentByQueryParams");
                                    themeInfoChanged = true;
                                    break;
                                }
                                break;

                                /*case "createTime":
                                    let themeCreateTime = localThemeInfo.createTime;
                                    let pageCreateTime = $("[themeid='"+themeId+"'] .themeListItem[itemname='createTime']").attr("itemvalue");
                                    if(themeCreateTime != pageCreateTime){
                                        printLog(thisFucName, innerTextTransform(pageThemeName)+"的创建时间展示需要更新");
                                        showActionBar("主题数据有变动","点击刷新","autoShowContentByQueryParams",null,4000);
                                        themeInfoChanged = true;
                                        break;
                                    }*/

                                /*case "updateTime":
                                    let themeUpdateTime = localThemeInfo.updateTime;
                                    let newUpdateTimeText = getTimeText(themeUpdateTime,1,0,1,1).fullText;

                                    let pageUpdateTime = $("[themeid='"+themeId+"'] .themeListItem[itemname='updateTime']").attr("itemvalue");
                                    let pageUpdateTimeText = getTimeText(pageUpdateTime,1,0,1,1).fullText;


                                    if(newUpdateTimeText.toString() != pageUpdateTimeText.toString()){
                                        printLog(thisFucName,pageThemeName+"的updateTime有变动");
                                        $("[themeid='"+themeId+"'] .themeListItem[itemname='updateTime']").attr("itemvalue",themeUpdateTime);
                                        $("[themeid='"+themeId+"'] .themeListItem[itemname='updateTime']").html(newUpdateTimeText);
                                        //pageContentChanged = true;
                                    }
                                    break;*/
                        }

                    });

                });
            }
        }

        //当前是【记录列表】展示
        if (pageRequestParams.showType == "recordList") {

            //页面中正在展示的当前主题id
            let pageShowingThemeId = pageRequestParams.themeId;

            //页面中正在展示的当前主题下的记录
            let pageShowingRecords = $(".recordList[dataid][themeid=" + pageShowingThemeId + "]");

            //当前页面已展示的记录数量
            let pageShowingRecordsNum = pageShowingRecords.length;

            //页面当前展示的主题存在
            let pageShowingThemeExist = (localDataExist && localData.recordData?. [pageShowingThemeId]) ? true : false;

            //本地数据为空但页面显示有数据
            if (!localDataExist && pageShowingRecordsNum > 0) {
                showToast("记录数据已被删除");
                return;
            }

            //页面展示主题不存在（已被删除或数据异常）
            if (!pageShowingThemeExist) {
                printLog(thisFucName, "页面展示主题已被删除或本地数据异常。");
                //showToast("当前主题已被删除");
                return;
            }

            //当前展示主题的存储数据
            let localThemeData = localData.recordData[pageShowingThemeId];

            //当前是否是搜索结果页
            let searchShowingFlag = (pageRequestParams?.searchType && pageRequestParams?.searchKey) ? true : false;


            /*判断页面展示的主题名称是否有变动*/
            let pageShowingThemeName = searchShowingFlag ? $(".topNavTitle.themeName").html() : $("#themeTitleText").html();
            if (pageShowingThemeName != localThemeData.themeName) {
                showActionBar("主题名称已更改", "刷新查看", "autoShowContentByQueryParams");
                printLog(thisFucName, "当前展示主题名称与存储数据不一致，存储数据：", innerTextTransform(localThemeData.themeName), ";页面展示数据：", pageShowingThemeName);
                return;
            }



            //页面展示主题存在 开始组装对比数据 对比当前展示数量是否正确

            //用于对比页面展示数据是否一致的对比数据
            let compareData = {};

            //获取当前搜索结果
            if (searchShowingFlag) {

                let searchResultData = {};
                //关键词搜索
                if (pageRequestParams.searchType == 1) {

                    searchResultData = keySearch(decodeURIComponent(pageRequestParams.searchKey), pageShowingThemeId, false, false);
                    compareData = searchResultData.recordData;

                    //日期搜索
                } else if (pageRequestParams.searchType == 2) {

                    let searchDate = new Date(decodeURIComponent(pageRequestParams.searchKey).replace(/\//g, "-") + "T00:00:00");
                    searchResultData = dateSearch(searchDate.getTime(), pageShowingThemeId);
                    compareData = searchResultData.recordData;

                } else {

                    printLog(thisFucName, "searchType无法识别，无法判断页面是否有变动", pageRequestParams.searchType);
                    return;
                }

            } else {
                //不是搜索结果展示，用于对比的就是当前主题数据
                compareData = localThemeData.recordList;
            }

            let compareDataNum = getJsonLength(compareData);

            /*页面没有展示任何记录，但符合条件的记录数量不为0*/
            if (pageShowingRecordsNum == 0 && compareDataNum != 0) {
                showActionBar("有记录未展示", "立即刷新", "autoShowContentByQueryParams");
                printLog(thisFucName, "存在可展示记录，但页面未展示任何记录，符合条件的记录：", compareData);
                return;
            }


            //获取页面当前排序规则 对对比数据进行排序
            let thisSortType = $(".recordListTitleRight").attr("sorttype");
            let thisIndedxType = $(".recordListTitleRight").attr("indextype");
            let compareDataAry = [];
            $.each(compareData, function(cIndex, cItem) {
                cItem.dataId = cIndex;
                cItem.themeId = localThemeData.themeId;
                compareDataAry.push(cItem);
            });

            if (thisSortType == "desc") {
                compareDataAry.sort(function(a, b) { return b.dayContentDate - a.dayContentDate; });
            } else if (thisSortType == "asc") {
                compareDataAry.sort(function(a, b) { return a.dayContentDate - b.dayContentDate; });
            } else {
                printLog(thisFucName, "记录列表排序类型无法识别，无法判断页面是否有变动", thisSortType);
                return;
            }


            //从排序后的本地数据中取出页面展示记录数量的记录出来
            const finalCompareAry = compareDataAry.slice(0, pageShowingRecordsNum);

            let pageRecordChanged = false;

            //开始对比、判断按照页面当前排序规则且相同数量的记录是否于本地存储记录相同（展示内容相同）

            let recordDataChanged = false;
            $.each(pageShowingRecords, function(psrIndex, psrItem) {

                if (recordDataChanged) return;

                let pageShowingDataId = $(psrItem).attr("dataid");
                let cprDataIndex = finalCompareAry.findIndex(item => item.dataId == pageShowingDataId);

                //页面展示的记录id不在对比数据中 有变动
                if (cprDataIndex == -1) {
                    const actionBarTip = searchShowingFlag ? "搜索结果有变动" : "记录数据有变动";
                    showActionBar(actionBarTip, "立即刷新", "autoShowContentByQueryParams");
                    printLog(thisFucName, "页面中第 " + (psrIndex + 1) + " 条记录已被删除或不符合搜索条件，dataid：", pageShowingDataId);
                    recordDataChanged = true;
                    return;
                }

                /*当前排序规则下，页面展示的第一条记录不应该是第一位，说明有新增数据未展示*/
                const pageFirstRecordId = pageShowingRecords.first().attr("dataid");
                const cprFirstRecordId = finalCompareAry[0].dataId;
                if (pageFirstRecordId != cprFirstRecordId) {
                    showActionBar("有新纪录未展示", "立即刷新", "autoShowContentByQueryParams");
                    printLog(thisFucName, "页面中第1条记录之前还有记录未展示，dataid：", cprFirstRecordId);
                    recordDataChanged = true;
                    return;
                }


                //id顺序与本地不同  有变动
                if (psrIndex != cprDataIndex) {
                    showActionBar("记录数据有变动", "立即刷新", "autoShowContentByQueryParams");
                    printLog(thisFucName, "页面中第 " + (psrIndex + 1) + " 条记录展示顺序有变动，dataid：", pageShowingDataId);
                    recordDataChanged = true;
                    return;
                }

                /*页面展示顺序正确，判断内容是否有变动*/

                //是否忽略高亮关键词
                let ignoreHighLight = (!searchShowingFlag || pageRequestParams?.searchType == 2) ? true : false;

                //高亮关键词内容
                let highLightKey = decodeURIComponent(pageRequestParams.searchKey);

                //对比数据中记录的HTML信息
                let cprRecordHTML = recordTrans2Html(finalCompareAry[cprDataIndex], highLightKey, ignoreHighLight, thisIndedxType);

                // printLog(thisFucName,"ignoreHighLight:",ignoreHighLight);
                // printLog(thisFucName,"highLightKey:",highLightKey);

                //把记录日期替换为时间戳
                cprRecordHTML = cprRecordHTML.replace(/<p[^>]*class=['"]recordDate['"][^>]*datetime=['"]([^'"]+)['"][^>]*>.*?<\/p>/, '$1');

                //存储中记录的文字信息，去掉所有<开头,>结束的html标签
                let cprRecordText = cprRecordHTML.replace(/<[^>]*>/g, '');

                //页面正在展示记录的HTML信息
                let pgsRecordHTML = $(".recordList[dataid=" + pageShowingDataId + "]")[0].outerHTML;

                //把记录日期替换为时间戳
                pgsRecordHTML = pgsRecordHTML.replace(/<p[^>]*class=['"]recordDate['"][^>]*datetime=['"]([^'"]+)['"][^>]*>.*?<\/p>/, '$1');

                //把页面展示的记录操作按钮文案去除
                pgsRecordHTML = pgsRecordHTML.replace(/<div[^>]*recordActionArea[^>]*>.*?<\/div>/gi, '');

                //把页面展示的复制链接按钮去除
                pgsRecordHTML = pgsRecordHTML.replace(/<div[^>]*copyLinkPop[^>]*>.*?<\/div>/gi, '');

                //页面展示记录的文字信息
                let pgsRecordText = pgsRecordHTML.replace(/<[^>]*>/g, '');

                //如果页面展示与存储数据的展示文本不一致，有变动
                if (pgsRecordText != cprRecordText) {
                    showActionBar("记录内容有更改", "立即刷新", "autoShowContentByQueryParams");
                    printLog(thisFucName, "页面中第 " + (psrIndex + 1) + " 条记录展示文本有变动，dataid：", pageShowingDataId);
                    printLog(thisFucName, "页面展示文本：", pgsRecordText);
                    printLog(thisFucName, "记录存储文本：", cprRecordText);
                    recordDataChanged = true;
                    return;
                }

                //存储内容中的超链接
                let cprRecordLinks = extractLinks(cprRecordHTML);

                //页面展示记录中的超链接
                let pgsRecordLinks = extractLinks(pgsRecordHTML);

                /*记录展示文本一致，判断超链接数量是否相同*/
                if (pgsRecordLinks.length != cprRecordLinks.length) {
                    showActionBar("记录内容有更改", "立即刷新", "autoShowContentByQueryParams");
                    printLog(thisFucName, "页面中第 " + (psrIndex + 1) + " 条记录中超链接数量有变动，dataid：", pageShowingDataId);
                    recordDataChanged = true;
                    return;
                }

                /*记录超链接数量一致，判断每个超链接集体链接是否相同超链接具体链接不同*/
                $.each(pgsRecordLinks, function(pglIndex, pgLink) {
                    if (pgLink != cprRecordLinks[pglIndex]) {
                        showActionBar("记录内容有更改", "立即刷新", "autoShowContentByQueryParams");
                        printLog(thisFucName, "页面中第 " + (psrIndex + 1) + " 条记录的超链接内容有变动，dataid：", pageShowingDataId);
                        printLog(thisFucName, "页面当前链接：", pgLink);
                        printLog(thisFucName, "新链接内容：", cprRecordLinks[pglIndex]);
                        recordDataChanged = true;
                        return;
                    }
                });

            });

        }

    }


    /**
     *给页面切换添加监听
     **/
    function listenPageFocus() {
        document.addEventListener("visibilitychange", function() {
            if (document.visibilityState == 'visible') {
                checkShowingRecordUpdate();
                checkIfDownload();
            }
        });

        window.onfocus = function(e) {
            const thisFucName = "window.focus";
            checkShowingRecordUpdate();
            checkIfDownload();

            let todayTagItem = $(".todayTag");
            if (todayTagItem.length == 0) {
                //printLog(thisFucName,"页面中不存在记录日期展示为“今天”的标识，无需处理日期更新");
                return;
            }
            if (todayTagItem.length != 0) {
                $.each(todayTagItem, function(index, item) {
                    let recordDateItem = $(item).parent(".recordDate");
                    let recordTime = $(recordDateItem).attr("datetime");
                    let recordDate = new Date(Number(recordTime));
                    let todayDate = new Date();
                    if (!isNaN(recordDate)) {
                        if (recordDate.getFullYear() != todayDate.getFullYear() ||
                            recordDate.getMonth() != todayDate.getMonth() ||
                            recordDate.getDate() != todayDate.getDate()
                        ) {
                            let newDateText = getTimeText(recordTime, null, null, 1);
                            $(recordDateItem).html(newDateText.dateText + " " + newDateText.CHWeek);
                            // printLog("window.foucs","记录日期展示已更新：",newDateText.dateText);
                            printLog(thisFucName, "页面中原展示为“今天”的记录日期已更新：", newDateText.dateText);
                        }
                    }
                });
            }


        };
    }

    function initThemeSwitch() {
        //定义主题切换功能
        $("#contentThemeTitle").off("click").on("click", function(e) {
            $(this).addClass("hover");
            toggleSwitchThemePanel();
        });
    }

    function perZero(number, length) {

        if (!notNull(number) || !notNull(length)) {
            printLog("preZero", "参数异常,number:" + number, length);
            return number;
        }

        let numberStr = number.toString();

        const zeroNum = length - numberStr.length;

        if (zeroNum > 0) {
            const afterPreZero = "0".repeat(zeroNum) + numberStr;
            // printLog("perZero",length+"位数字已补0成功",afterPreZero);
            return afterPreZero;
        }

        return numberStr;
    }


    function getRandomNumber(startNum, endNum, length) {

        if (!notNull(length) || !Number.isInteger(length)) {
            printLog("getRandomNumber", "无法生成随机数，随机数长度参数异常", length);
            return;
        }

        let maxNum = Math.pow(10, length) - 1;

        if (!notNull(startNum)) {
            startNum = 0;
        }

        if (startNum > maxNum) {
            printLog("getRandomNumber", "无法生成随机数，minNum参数异常", startNum);
            return;
        }

        if (!notNull(endNum) || endNum > maxNum) {
            endNum = maxNum;
        }

        let min = Math.ceil(startNum);
        let max = Math.floor(endNum);

        let randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
        // printLog(arguments.callee.name.toString(),length+"位随机已生成：",randomNum);
        return perZero(randomNum, length)

    }


    function getDateText(timstamp) {

        if (!notNull(timstamp)) {
            printLog(arguments.callee.name.toString(), "timstamp参数缺失", timstamp);
            return timstamp;
        }

        let dateObj = new Date(timstamp);
        if (isNaN(dateObj)) {
            printLog(arguments.callee.name.toString(), "timstamp参数异常", timstamp);
            return timstamp;
        }

        let nowDate = new Date();

        let dateYearText = dateObj.getFullYear();
        if (dateYearText == nowDate.getFullYear()) {
            dateYearText = "";
        } else {
            dateYearText = dateYearText + "年";
        }

        let dateMonthText = perZero(dateObj.getMonth() + 1, 2);
        let dateDayText = perZero(dateObj.getDate(), 2);
        let dateDayHour = perZero(dateObj.getHours(), 2);
        let dateDayMin = perZero(dateObj.getMinutes(), 2);
        let dateDaySec = perZero(dateObj.getSeconds(), 2);

        let fullDateText = dateYearText + dateMonthText + "月" + dateDayText + "日 " + dateDayHour + ":" + dateDayMin;

        return fullDateText;

    }


    function clearSingleInput(input) {
        const thisFucName = arguments.callee.name.toString();

        if (!notNull(input)) {
            printLog(thisFucName, "未传入正确input对象，无法清空输入框", input);
            return;
        }

        let innerInput = $(input).children("input");
        if (innerInput.length == 0) {
            printLog(thisFucName, "获取输入框失败：", innerInput);
            return;
        }

        if (innerInput.val() == "") {
            // printLog(thisFucName,"输入框当前内容为空，无需清空");
            $(innerInput).focus();
            return;
        }

        $(innerInput).val("");
        $(innerInput).focus();
    }


    function htmlDecode(str) {
        return $('<textarea/>').html(str).val();
    }

    function htmlEncode(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function updateUploadFileMethod(themeId) {

        if (!notNull(themeId)) {
            let themeId = null;
        }
        $("#txtFileUpload").off("change").on("change", function(e) {
            printLog("txtFileUpload.change", "检测到上传数据文件");
            printLog("txtFileUpload.change", "当前指定themeid:", themeId);
            readFile(themeId);
        });
    }


    function updateUserPreferance(name, value) {
        const thisFucName = arguments.callee.name.toString();

        if (!notNull(name)) {
            printLog(thisFucName, "更新用户偏好失败，name参数缺失:", name);
            return;
        }

        if (typeof(value) == "undefined") {
            printLog(thisFucName, "更新用户偏好失败，value参数缺失:", value);
            return;
        }

        let preferance = localGet("user_preferance_data");
        if (!notNull(preferance)) {
            preferance = {};
        }

        preferance[name] = value;

        localSave("user_preferance_data", preferance);

        // printLog(thisFucName,name+" 已更新为：",value);
    }

    function getUserPreferance(name) {
        const thisFucName = arguments.callee.name.toString();

        let preferance = localGet("user_preferance_data");

        if (!notNull(name)) {
            return preferance;
        }

        if (!notNull(preferance)) {
            return null;
        }

        if (preferance?. [name]) {
            return preferance[name];
        } else {
            return null;
        }

    }

    function isDomElement(obj) {
        // 检查对象存在，且 nodeType 为 1（元素节点）
        // let result = true;
        try {
            $.each(obj, function(index, item) {
                if (!(item && typeof item === 'object' && item.nodeType === 1)) {
                    return false;
                }
            });
        } catch (e) {
            printLog(e.message, e.stack);
            return false;
        }
        return true;
    }

    function hidePanelByClick(panel, btn) {
        const thisFucName = arguments.callee.name.toString();

        if (!notNull(panel)) {
            printLog(thisFucName, "目标菜单面板为空");
            return;
        }

        /*if(panel.length > 0){
            printLog(thisFucName,"panel参数不是页面dom元素");
        }*/

        if (!isDomElement(panel)) {
            printLog(thisFucName, "panel参数不是页面dom元素");
            return;
        }

        const targetElement = panel;
        const toggleButton = notNull(btn) ? btn : null;

        $(document).off("click").on("click", function(e) {
            if (toggleButton != null) {
                if (!targetElement.is(e.target) && targetElement.has(e.target).length === 0 && !toggleButton.is(e.target) && toggleButton.has(e.target).length === 0) {
                    $(targetElement).trigger("removeMenuPanel");
                }
            } else {
                if (!targetElement.is(e.target) && targetElement.has(e.target).length === 0) {
                    $(targetElement).trigger("removeMenuPanel");
                }
            }

        });
    }

    /**
     * 调整页面弹窗位置
     * */
    function alertWinPositionAdjust() {
        if ($(".alertWin").length == 0) {
            return;
        }

        $(".alertWin").css({
            "top": "50%",
            "left": "50%",
            "transform": "translate(-50%, -55%)"
        });

    }


    /**
     * 调整菜单面板的位置
     * */
    function menuPanlePositonAdjust() {
        if ($(".menuPanel").length == 0) {
            return;
        }

        $(".menuPanel").trigger("ajust");
    }


    /**
     * 给数字加上千分位逗号
     * */
    function thousandCommaNumber(number) {

        if (typeof number !== "number" && isNaN(Number(number))) {
            return number;
        }

        //数字是否是负数
        const negativeChar = number < 0 ? "-" : "";

        //数字的整数部分
        const pureNum = Math.trunc(number);

        //数字的小数部分
        const numberStr = number.toString();
        let tailNumStr = "";
        if (numberStr.split(".").length > 1) {
            tailNumStr = "." + numberStr.split(".")[1];
        }


        const strPureNum = Math.abs(pureNum).toString();
        const strNumLength = strPureNum.length;

        if (strNumLength <= 3) {
            return number.toString();
        }

        //数字长度除3的余数
        const strPureNumMod3 = strNumLength % 3;

        //数字长度除3的整数结果
        const strPureNum3times = Math.floor(strNumLength / 3);

        //要添加的逗号数量
        // const commaNum = strPureNumMod3==0 ? strPureNum3times : strPureNum3times-1;
        const commaNum = strPureNum3times;

        //从后往前最后一个逗号前剩余的数字
        const beforeCommaStr = strPureNumMod3 == 0 ? "" : strPureNum.substring(0, strPureNumMod3);

        //需要加逗号的数字部分
        const addCommaStr = strPureNum.substring(beforeCommaStr.length);


        //pureNum  1023456789 → ,023,456,789
        const afterCommaStrAry = [];
        for (let i = 0; i < commaNum; i++) {
            afterCommaStrAry.push(addCommaStr.substring(3 * i, 3 * (i + 1)));
        }

        let afterCommaStr = afterCommaStrAry.join(",");

        let afterCommaFullNumStr = beforeCommaStr + afterCommaStr + tailNumStr;

        const finalAfterCommaFullStr = negativeChar + afterCommaFullNumStr;


        return finalAfterCommaFullStr;


    }

    /**
     * 判断两个date是不是同一天
     */
    function isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }