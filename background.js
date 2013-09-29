var maxHistory = 15;//PerWindow
var dothumbs = false;
var selWindows=[],selwIdx=[],tabImgs=[];
var thscale=0.09;
var hqthumbs=false;
var onewin=false;
var justback=false;
var thumbwidth=100;
var thHeiRatio=0.75;
var currentWindow = 1;//to track which set of tabs to return to the popup.html
var tabsWindows=[];
function fromPrefs(){
	if(localStorage["maxhistory"]-0 > 0 ) maxHistory = new Number(localStorage["maxhistory"]) + 1;
	dothumbs = ((localStorage["dothumbs"]=='true')?true:false);
	if(dothumbs==false)tabImgs=[];
	hqthumbs = ((localStorage["hqthumbs"]=='true')?true:false);
	onewin = ((localStorage["onewin"]=='true')?true:false);
	justback = ((localStorage["justback"]=='true')?true:false);
	if(justback){
		chrome.browserAction.setIcon({path:'icon19back.png'});
	}else{
		chrome.browserAction.setIcon({path:'icon19.png'});
	}
	if(onewin){
		currentWindow=1;
		//merge all history somehow....??
	}else{
		tabsWindows=[];
	}
	if(hqthumbs){
		thumbwidth=200;
		//var tim=pim;
		//tim.width=200,tim.height=150;
		//tim = example;
		//tim.width=200,tim.height=150;
		thscale=0.18;
	}else{
		thumbwidth=100;
		//var tim=pim;
		//tim.width=150,tim.height=75;
		//tim = example;
		//tim.width=150,tim.height=75;
		thscale=0.09;
	}
}

function clearAll(dup,arr,winid){
	var narr=[],l=arr.length-1;
	for(i=0;i<l;i++){if(arr[i]!=dup)narr.push(arr[i]);}
	selwIdx[winid]=narr.length-1;
	return narr;
}

function clearDups(dup,arr,winid){
	var narr=clearAll(dup,arr,winid);
	narr.push(dup);
	selwIdx[winid]=narr.length-1;
	return narr;
}

var iconimg=new Image();
iconimg.src="icon19.png";

function updateIcon(windowId){
	if(!dothumbs)return;
	var curIdx = selwIdx[windowId];
	if( !selWindows[windowId][curIdx-1] || !tabImgs[selWindows[windowId][curIdx-1]] ){
		//console.log(windowId+'nol'+curIdx+' '+selWindows[windowId][curIdx+1]);
		return;
	}
	chrome.tabs.get(selWindows[windowId][curIdx-1], function(tab){
		var icvs = document.createElement('canvas');//icon canvas
		var sx,sy;
		var totalWidth = 19;
		icvs.width=totalWidth
		icvs.height=totalWidth
		var ictx = icvs.getContext("2d");
		favimg=new Image();
		favimg.onload = function(){
	    ictx.drawImage(iconimg,0,0);
	    //ictx.scale(0.9,0.9);
			ictx.drawImage(favimg,3,2);
			chrome.browserAction.setIcon({imageData:ictx.getImageData(0, 0, 19, 19)});//update icon (to be configurable)
	  	icvs=null;
	  }
		favimg.src=tabImgs[tab.id];//tab.favIconUrl;
		});
}
function historyAdd(winId,tabId){
	if( !selWindows[winId] ){
		selWindows[winId] = new Array();
		selwIdx[winId]=new Number(-1);
	}
	//if( selWindows[winId][selwIdx[winId]] == tabId ) return; //same as one on top already
	
	selWindows[winId].push(tabId);
	selWindows[winId]=clearDups(tabId,selWindows[winId],winId);//selwIdx[winId]+=1; //handles increment as well
	if(selWindows[winId].length >maxHistory){
		//console.log("history exceeded"+ selWindows[winId]);
		selWindows[winId]=selWindows[winId].splice(1,maxHistory);
		//console.log("history exceeded"+ selWindows[winId]);
		selwIdx[winId]-=1;
	}
	if(dothumbs)captureImage(winId,tabId);
	//console.log(selwIdx[winId]+' win:'+winId +' tab:'+tabId);
	chrome.browserAction.setTitle({title:(selWindows[winId].length-1)+' LASTabZ'})
	updateIcon(winId);
}
function setCurrentWindow(tabId,selectInfo){
	if(!onewin){
		currentWindow=selectInfo.windowId;
	}else{
		tabsWindows[tabId]=selectInfo.windowId;//no longe rused?
	}
	historyAdd(currentWindow,tabId);
}
chrome.tabs.onActivated.addListener(function(aInfo){
	setCurrentWindow(aInfo.tabId,aInfo.windowId);
});
//chrome.tabs.onSelectionChanged.addListener(setCurrentWindow);
//chrome.windows.onFocusChanged.addListener(function(windowId){
//	chrome.tabs.getSelected(windowId,function(tab){
//		setCurrentWindow(tab.id,{windowId:tab.windowId})
//	})
//});

chrome.tabs.onUpdated.addListener(function(tabId,changeInfo,tab) {
	if(dothumbs)captureImage(tab.windowId,tabId);//while user navigates optionally capture screenshot updates
});

function removedTab(closedTab) {
	disablelasttab = ((localStorage["disablelasttab"]=='true')?true:false);
	//BUG - a popup window for some reason counts in the tab list for a window
	var clwin=currentWindow;
	if( !disablelasttab && closedTab == selWindows[currentWindow][selwIdx[currentWindow]] && selWindows[currentWindow].length > 1 ){
		var finalTarget = selWindows[currentWindow][selwIdx[currentWindow]-1];
		selWindows[currentWindow]=clearAll(closedTab,selWindows[currentWindow],currentWindow);
		setTimeout(function(){//unnecessary timeout?
			chrome.windows.getCurrent(function(window){//could possibly use shortcut here - currentWindow should be up to date, however this delay is necessary since the window is switched after the tab is closed, we have to make sure that occurs first and registers in the history array?
				var windowId = onewin?currentWindow:window.id;//currentWindow
				if( clwin==windowId ){//ohterwise they just closed a window
					var curIdx = selwIdx[windowId];
					if( selWindows[windowId][(curIdx)]!= finalTarget ){ //selWindows[windowId][(curIdx-1)]==closedTab  && finalTarget==selWindows[windowId][(curIdx-2)]  && finalTarget!=selWindows[windowId][(curIdx)] && selWindows[windowId].length > 2){//we have enough history, and we were viewing the closed tab
						var nextTab = selWindows[windowId][(curIdx-1)];// FINALtARGET
						//trim the items that are extra (the accidental select and the removed tab)
						selWindows[windowId]=selWindows[windowId].splice(0,(curIdx));selwIdx[windowId]-=1;//REMOVE FAULTY ENTRY
						//chrome.windows.update(tabsWindows[nextTab],{top:0,left:0}, function(w){
						
							chrome.tabs.update(nextTab,{selected:true},function(a){//SELET CORRECT TAB
							//console.log('last tab now selected')
							})
						
						//})
					}
				}
			})
		},3);
	}else{
		selWindows[currentWindow]=clearAll(closedTab,selWindows[currentWindow],currentWindow);
	}
	if(tabImgs[closedTab]){
		//tabImgs[closedTab]=false;
		tabImgs[closedTab]=null;
		cleanupEmptyImages();
	}
	updateIcon(currentWindow)
}

chrome.tabs.onRemoved.addListener(removedTab);

chrome.windows.onRemoved.addListener(function(winId) {
	if( selWindows[winId] ){
		//selWindows[winId] = false;
		//selwIdx[winId]=0;
		selWindows[winId]=null;
		selwIdx[winId]=null;
		cleanupEmptyWindows()
	}
});

//Warning i you ever sort tabs based on window, references to which window thumb belongs to change here! OR else risk duplicate tracking
chrome.tabs.onDetached.addListener(removedTab);
//		function( tabId, d) {
//			selWindows[d.oldWindowId]=clearAll(tabId,selWindows[d.oldWindowId],d.oldWindowId);
//			cleanupEmptyWindows()
//		});

function cleanupEmptyWindows(){
	var nsw = new Array();
	for(i in selWindows){
		if( typeof(selWindows[i]) == 'object' && selWindows[i]!=null && selWindows[i].length > 0){
			nsw[i]=selWindows[i];
		}
	}
	selWindows=nsw;
}

function cleanupEmptyImages(){
	var nsw = new Array();
	for(i in tabImgs){
		if( typeof(tabImgs[i]) == 'string' && tabImgs[i]!=null && tabImgs[i].length > 0){
			nsw[i]=tabImgs[i];
		}
	}
	tabImgs=nsw;
}

chrome.extension.onRequest.addListener(
function(request, sender, sendResponse){
    if (request.greeting == "gettabs" && selWindows[currentWindow]){
      sendResponse({farewell: selWindows[currentWindow]});
    }else if(request.greeting == "lastab"){
    	chrome.tabs.update(selWindows[currentWindow][selwIdx[currentWindow]-1],{selected:true},function(){/*changed tab*/})
    	sendResponse({});
    }else if(request.greeting == "gettabimg"){
    	if(tabImgs[request.tabId]){
    		sendResponse({scr: tabImgs[request.tabId]});
    	}else{
    		sendResponse({});
    	}
    }else if(request.greeting == "getallwindowshistory"){
      sendResponse({farewell:selWindows});//mode not
    }else if(request.greeting == "reloadprefs"){
    	fromPrefs();sendResponse({});
    }else
    	sendResponse({});
  
});
function captureImage(winId,tabId){
	chrome.tabs.captureVisibleTab(winId, function(dataUrl){
		pim.src=dataUrl;
		window.setTimeout(function(){
			var img = pim;
			img.width = thumbwidth;
			img.height = thumbwidth*thHeiRatio;
	  	var cvs = example;
	  	cvs.width = thumbwidth;
			cvs.height = thumbwidth*thHeiRatio;
	  	var ctx = cvs.getContext("2d")
	  	ctx.clearRect(0,0,img.width,img.height);
	  	ctx.putImageData(getImageDataFromImage(img), 0, 0);
	  	tabImgs[tabId]=cvs.toDataURL("image/jpeg",0.3);
			pim.src='';
		},255);
	});
}
function getImageDataFromImage(idOrElement){
	var theImg = (typeof(idOrElement)=='string')? document.getElementById(idOrElement):idOrElement;
	var cvs = document.createElement('canvas');
	cvs.width = thumbwidth;
	cvs.height = thumbwidth*thHeiRatio;
	var ctx = cvs.getContext("2d");
	ctx.scale(thscale,thscale);
	ctx.drawImage(theImg,0,0);
	var id=ctx.getImageData(0, 0, cvs.width, cvs.height);
	cvs=null;
	return (id);
}

var pim = document.createElement('img');
var example = document.createElement('canvas');
fromPrefs()