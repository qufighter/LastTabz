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
	if(localStorage["maxhistory"]-0 > 0 ) maxHistory = (localStorage["maxhistory"] - 0) + 1;
	dothumbs = ((localStorage["dothumbs"]=='true')?true:false);
	if(dothumbs==false)tabImgs=[];
	hqthumbs = ((localStorage["hqthumbs"]=='true')?true:false);
	onewin = ((localStorage["onewin"]=='true')?true:false);
	justback = ((localStorage["justback"]=='true')?true:false);
	if(justback){
		chrome.browserAction.setIcon({path:'img/icon19back.png'});
	}else{
		chrome.browserAction.setIcon({path:'img/icon19.png'});
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
iconimg.src="img/icon19.png";

function updateIcon(windowId){
	//return;
	// if(!dothumbs)return;
	// var curIdx = selwIdx[windowId];
	// if( !selWindows[windowId][curIdx-1] || !tabImgs[selWindows[windowId][curIdx-1]] ){
	// 	//console.log(windowId+'nol'+curIdx+' '+selWindows[windowId][curIdx+1]);
	// 	return;
	// }
	// chrome.tabs.get(selWindows[windowId][curIdx-1], function(tab){
	// 	var icvs = document.createElement('canvas');//icon canvas
	// 	var sx,sy;
	// 	var totalWidth = 19;
	// 	icvs.width=totalWidth
	// 	icvs.height=totalWidth
	// 	var ictx = icvs.getContext("2d");
	// 	favimg=new Image();
	// 	favimg.onload = function(){
	// 		ictx.drawImage(iconimg,0,0);
	// 		//ictx.scale(0.9,0.9);
	// 		ictx.drawImage(favimg,3,2);
	// 		chrome.browserAction.setIcon({imageData:ictx.getImageData(0, 0, 19, 19)});//update icon (to be configurable)
	// 		icvs=null;
	// 	}
	// 	favimg.src=tabImgs[tab.id];//tab.favIconUrl;
	// 	});
}
function historyAdd(winId,tabId){
	if( !selWindows[winId] ){
		selWindows[winId] = new Array();
		selwIdx[winId]=-1;
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
	setCurrentWindow(aInfo.tabId,aInfo);
});

chrome.windows.onFocusChanged.addListener(function(windowId){
	if(windowId!= chrome.windows.WINDOW_ID_NONE ){
		currentWindow = windowId;

		// seems like the "current window" may not have history - meaning it is a new window in this case
		// or maybe the current windows history entries had been moved to another window, or closed ???? 
	}
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

function goToLastTab(index){
	if(!index)index=1;
	chrome.tabs.update(selWindows[currentWindow][selwIdx[currentWindow]-index],{selected:true},function(){/*changed tab*/})
}

chrome.commands.onCommand.addListener(function(command){
	if(command.substr(0,18)=='navigate-last-tab-'){
		goToLastTab(command.substr(18)-0);
	}
});

chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse){
		if (request.greeting == "gettabs" && selWindows[currentWindow]){
			sendResponse({farewell: selWindows[currentWindow]});
		}else if(request.greeting == "lastab"){
			goToLastTab();
			sendResponse({});
		}else if(request.greeting == "highlightTabs"){
			chrome.tabs.highlight({tabs:JSON.parse(request.tabs), windowId:sender.windowId})
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
	// we only want to capture the header
	chrome.tabs.executeScript(tabId, {code:'window.scrollY'}, function(res){
		if( !res || res[0] == 0 ){
			reallyCaptureImage(winId,tabId);
		}
	});
}


function reallyCaptureImage(winId,tabId){
	chrome.tabs.captureVisibleTab(winId, function(dataUrl){
		pim.onload=function(){
			var img = pim;
			var cvs = example;
			cvs.width = thumbwidth;
			cvs.height = thumbwidth*thHeiRatio;
			var dwidth = img.naturalWidth*0.75, dheight = img.naturalHeight*0.75;
			var ctx = cvs.getContext("2d")
			ctx.clearRect(0,0,cvs.width,cvs.height);
			ctx.drawImage(img, 0,0, img.naturalWidth,img.naturalHeight, 0,0, dwidth,dheight);
			var tctx = tiny.getContext("2d");
			//drawImage (image, sx,sy, sWidth,sHeight, dx,dy, dWidth,dHeight) //CANVAS
			//check left edge to see if there is no logo/site on image
			var offset = 0;
			var variation = 0;
			var dat, dat2, dat3, avg=[];
			var mean, min, max, median, range, halfRange, maxDist, minDist;
			var ypos=cvs.height*0.0, ypos2=cvs.height*0.33, ypos3=cvs.height*0.66, yheight=cvs.height*0.33;
			while( variation < 15 && offset < img.naturalWidth/4){
				tctx.drawImage(cvs, 5,ypos, 1,yheight, 0,0, 1,1)
				dat = tctx.getImageData(0,0, 1,1).data;
				tctx.drawImage(cvs, 5,ypos2, 1,yheight, 0,0, 1,1)
				dat2 = tctx.getImageData(0,0, 1,1).data;
				tctx.drawImage(cvs, 5,ypos3, 1,yheight, 0,0, 1,1)
				dat3 = tctx.getImageData(0,0, 1,1).data;
				avg = [(dat[0]+dat2[0]+dat3[0])*0.333, (dat[1]+dat2[1]+dat3[1])*0.333, (dat[2]+dat2[2]+dat3[2])*0.333]
				mean = (avg[0] + avg[1] + avg[2])*0.333;

				avg.sort();
				min = avg[0];//Math.min(avg[0], avg[1], avg[2]);
				max = avg[2];//Math.max(avg[0], avg[1], avg[2]);
				median = avg[1];
				//(avg[0]!=min && avg[0]!=max)?median=avg[0]:0;
				//(avg[1]!=min && avg[1]!=max)?median=avg[1]:0;
				//(avg[2]!=min && avg[2]!=max)?median=avg[2]:0;

				maxDist = max - median,
				minDist = median - min;
				maxDist = Math.max(maxDist, minDist);
				range = (max - min);
				halfRange = range * 0.5;

				//variation = Math.abs(dat[0]-avg[0]) + Math.abs(dat[1]-avg[1]) + Math.abs(dat[2]-avg[2])
				variation = range - (maxDist - halfRange);
				//console.log('variation', variation, offset, avg);
				offset += 5;
				ctx.drawImage(img, offset,0, img.naturalWidth,img.naturalHeight, 0,0, dwidth,dheight);
			}
			if( offset >= img.naturalWidth/4){
				ctx.drawImage(img, img.naturalWidth*0.25,0, img.naturalWidth*0.5,img.naturalWidth*0.5*thHeiRatio, 0,0, cvs.width,cvs.height);
			}
			tabImgs[tabId]=cvs.toDataURL("image/jpeg",1.0);
			pim.src='';
		};
		pim.src=dataUrl;
	});
}

var pim = document.createElement('img');
var example = document.createElement('canvas');
var tiny = document.createElement('canvas');
tiny.width = 1;
tiny.height = 1;
fromPrefs()