function recordInputDragInit(){
	// $("#editInputList").sortable();
	$("#editInputList").sortable({axis:"y"});//只能在垂直方向拖拽

	//定义鼠标按下后的事件
	$("#editInputList p.inputNum").off("mousedown").on("mousedown",function(){

		draggingElement = $(this).parent(".editInputDiv");
		$(draggingElement).addClass("dragging-item");

		$("#editRecordWin").addClass("dragging-input-mode");

	});

	$("#editInputList").off("sortupdate").on("sortupdate", function(event){
		var allRecordInput = $(".editInputDiv");
		var logText = "序号已更新：";
		$.each(allRecordInput,function(i,t){
			var itemIndexNum = $(t).index() + 1;
			var itemIndexText = itemIndexNum + ".";
			var itemShownText = $(t).find(".inputNum").text();
			if(itemIndexText!=itemShownText){
				$(t).find(".inputNum").text(itemIndexText);
				logText += (i+1)+"(原序号："+itemShownText.substring(0,1)+")、";
			}
		});
		printLog("sortupdate(#editInputList)",logText);
		draggingItemStyleReset(draggingElement);
	});

	//定义鼠标抬起事件
	$(window).off("mouseup").on("mouseup",function(){
		$("#editInputList p.inputNum").unbind("mousemove");
		if(typeof(draggingElement)!="undefined"&&draggingElement!=null){
			draggingItemStyleReset(draggingElement);
		}
	});
}

function draggingItemStyleReset(draggingItem){
	if(typeof(draggingItem)!="undefined"&&draggingItem!=null){
		$(draggingElement).removeClass("dragging-item");
		draggingElement = null;
	}

	$("#editRecordWin").removeClass("dragging-input-mode");

	textareaHeightAutoShow();
}

