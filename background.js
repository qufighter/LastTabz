var maxHistory = 15;//PerWindow
var dothumbs = false;
var selWindows={};
var selwIdx={};
var tabImgs=[];
var thscale=0.09;
var hqthumbs=false;
var onewin=false;
var justback=false;
var thumbwidth=100;
var thHeiRatio=0.75;
var currentWindow = '-1';//to track which set of tabs to return to the popup.html (invalid at launch!!!)
var tabsWindows=[];
var storage = chrome.storage.sync || chrome.storage.local;
var disablelasttab = false;
var fully_loaded = false; // mv3...

function mv3_persist_session_storage(){
    // since service worker may be killed any time, we call this often as we make any changes to our needed data objects....
    var toSet ={
        selWindows: JSON.stringify(selWindows)
        ,selwIdx: JSON.stringify(selwIdx)
        //,tabImgs: JSON.stringify(tabImgs) // too big to store here
    }
    console.log('store_to_session_memory_mv3_so_chatty_about_process_memory', toSet);
    chrome.storage.session.set(toSet, function(){});
}

function loadPrefsFromStorage(cbf){
    storage.get(null, function(obj) {
        if(chrome.runtime.lastError)console.log(chrome.runtime.lastError.message);
        cbf(obj);
        //loadPrefsFromLocalStorage(results, cbf, obj || {})
    });
}

function fromPrefs(){
    loadPrefsFromStorage(function(obj){
        
        console.log('bg got setttings... ', obj)
        
        maxHistory = obj.maxhistory ? obj.maxhistory : maxHistory;
        onewin = obj.onewin && obj.onewin == 'true' ? true : false;
        justback = obj.justback && obj.justback == 'true' ? true : false;
        
        dothumbs = obj.dothumbs && obj.dothumbs == 'true' ? true : false;
        if(dothumbs==false)tabImgs=[];
        hqthumbs = obj.hqthumbs && obj.hqthumbs == 'true' ? true : false

        if(justback){
            chrome.action.setIcon({path:'img/icon19back.png'});
        }else{
            chrome.action.setIcon({path:'img/icon19.png'});
        }
        
        disablelasttab = obj.disablelasttab && obj.disablelasttab == 'true' ? true : false
        
        
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
        fully_loaded = true;
    });
    
	//if(localStorage["maxhistory"]-0 > 0 ) maxHistory = (localStorage["maxhistory"] - 0) + 1;
	//dothumbs = ((localStorage["dothumbs"]=='true')?true:false);
	//if(dothumbs==false)tabImgs=[];
	//hqthumbs = ((localStorage["hqthumbs"]=='true')?true:false);
	//onewin = ((localStorage["onewin"]=='true')?true:false);
	//justback = ((localStorage["justback"]=='true')?true:false);
	
	if(onewin){
		currentWindow=-1;
		//merge all history somehow....??
	}else{
		tabsWindows=[];
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

//var iconimg=new Image(); // mv3 incompatible code!
//iconimg.src="img/icon19.png";

function updateIcon(windowId){
    // consider: OffscreenCanvas which we CAN use in service worker?!?!?!?!
//    const canvas = new OffscreenCanvas(width, height);
//    return canvas;

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
	// 		chrome.action.setIcon({imageData:ictx.getImageData(0, 0, 19, 19)});//update icon (to be configurable)
	// 		icvs=null;
	// 	}
	// 	favimg.src=tabImgs[tab.id];//tab.favIconUrl;
	// 	});
}
function historyAdd(winId,tabId){
	if( !selWindows[winId] ){
		selWindows[winId] = [];
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
	chrome.action.setTitle({title:(selWindows[winId].length-1)+' LASTabZ'})
	updateIcon(winId);
    
    mv3_persist_session_storage();
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
    console.log('tab onActivated', aInfo)
	setCurrentWindow(aInfo.tabId,aInfo);
});

chrome.windows.onFocusChanged.addListener(function(windowId){
	if(windowId!= chrome.windows.WINDOW_ID_NONE ){
        if(!onewin){
            currentWindow= windowId;
        }
		// seems like the "current window" may not have history - meaning it is a new window in this case
		// or maybe the current windows history entries had been moved to another window, or closed ???? 
	}
});

//chrome.tabs.onSelectionChanged.addListener(setCurrentWindow); // deprecated mv3
//chrome.windows.onFocusChanged.addListener(function(windowId){
//	chrome.tabs.getSelected(windowId,function(tab){ // deprecated in mv3
//		setCurrentWindow(tab.id,{windowId:tab.windowId})
//	})
//});
//
//chrome.tabs.onUpdated.addListener(function(tabId,changeInfo,tab) {
//	if(dothumbs)captureImage(tab.windowId,tabId);//while user navigates optionally capture screenshot updates
//});

function removedTab(closedTab) {
    
	//BUG - a popup window for some reason counts in the tab list for a window
	var clwin=currentWindow;
	if( !disablelasttab && closedTab == selWindows[currentWindow][selwIdx[currentWindow]] && selWindows[currentWindow].length > 1 ){
		var finalTarget = selWindows[currentWindow][selwIdx[currentWindow]-1];
		selWindows[currentWindow]=clearAll(closedTab,selWindows[currentWindow],currentWindow);
        //        mv3_persist_session_storage(); // we'll do this below soon, so just wait?

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
                        mv3_persist_session_storage();
					}
				}
			})
		},3);
	}else{
		selWindows[currentWindow]=clearAll(closedTab,selWindows[currentWindow],currentWindow);
        mv3_persist_session_storage();
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
    var nsw = {};
	for(i in selWindows){
		if( typeof(selWindows[i]) == 'object' && selWindows[i]!=null && selWindows[i].length > 0){
			nsw[i]=selWindows[i];
		}
	}
	selWindows=nsw;
    
    mv3_persist_session_storage();
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
        // now we get messages or other listners, but we're not in a 'loaded' state?.?.? what a nightmare to be forced to use magic?
        //console.log(request.greeting, 'fully_loaded: ' , fully_loaded);
    
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
        }else if(request.greeting == "newImage"){

            // todo, we got an image from the content scirpt which is disabled now... mv3 thanks!
            // you could make it work,   "optional_permissions": ["scripting"], etc...
            
		}else
			sendResponse({});
});

function getWindowScrollY(){
    return window.scrollY;
}

function captureImage(winId,tabId){
    return; /// disabled, see reason below
    
	// we only want to capture the header, check window.scrollY before screenshot!
    chrome.scripting.executeScript({
        target: {tabId: tabId},
        func: getWindowScrollY,
        args: []
    }, function(iRes){
        if( iRes ){
            var res = iRes.result;
            if( !res || res[0] == 0 ){
                reallyCaptureImage(winId,tabId);
            }
        }else{
            // prohibited tab??? yeah right... but they didn't click your popup, so you are SOL
        }
    });
  
// // manifest v2 code follows (cleanup)
//	chrome.tabs.executeScript(tabId, {code:'window.scrollY'}, function(res){
//		if( !res || res[0] == 0 ){
//			reallyCaptureImage(winId,tabId);
//		}
//	});
}


function reallyCaptureImage(winId,tabId){
//chrome.tabs.sendMessage(tabId, {snapShot:true}, function(response) {});
    
    return; // these features are too problematic for mv3 (not snapping, too big to store to chrome.storage.session, etc)
    // we culd cache toa  content script but thats sort of self defeating, this extgension isnt' suppose to need those.
    
    console.log('abotu to capture visible tab, it will work or fail right??')
    
    // for some reason, we actually do get a dataURL when using keyboard to trigger last tab... go figgure?  how!?!?!
    //otherwise this seems broken

    chrome.tabs.captureVisibleTab(winId, function(dataUrl){
        
        console.log('we got a snappy shot dataUrl', dataUrl)
        
        if( dataUrl ){
            
            fetch(dataUrl)
            .then(function(response){return response.blob()})
            .then(function(blob){
                createImageBitmap(blob)
                .then(function(imgBmp){
                    console.log(imgBmp);
                    
                    var cvs = new OffscreenCanvas(thumbwidth, thumbwidth*thHeiRatio);
                    var tiny = new OffscreenCanvas(1, 1);

                    var dwidth = imgBmp.width*0.75, dheight = imgBmp.height*0.75;
                    var ctx = cvs.getContext("2d")
                    ctx.clearRect(0,0,cvs.width,cvs.height);
                    ctx.drawImage(imgBmp, 0,0, imgBmp.width,imgBmp.height, 0,0, dwidth,dheight);
                    var tctx = tiny.getContext("2d");
                    //drawImage (image, sx,sy, sWidth,sHeight, dx,dy, dWidth,dHeight) //CANVAS
                    //check left edge to see if there is no logo/site on image
                    var offset = 0;
                    var variation = 0;
                    var dat, dat2, dat3, avg=[];
                    var mean, min, max, median, range, halfRange, maxDist, minDist;
                    var ypos=cvs.height*0.0, ypos2=cvs.height*0.33, ypos3=cvs.height*0.66, yheight=cvs.height*0.33;
                    while( variation < 15 && offset < imgBmp.width/4){
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
                        ctx.drawImage(imgBmp, offset,0, imgBmp.width,imgBmp.height, 0,0, dwidth,dheight);
                    }
                    if( offset >= imgBmp.width/4){
                        ctx.drawImage(imgBmp, imgBmp.width*0.25,0, imgBmp.width*0.5,imgBmp.width*0.5*thHeiRatio, 0,0, cvs.width,cvs.height);
                    }
                    
                    //tabImgs[tabId]=URL.createObjectURL(cvs.convertToBlob({type: 'img/jpeg', quality: 1.0}));
                    //tabImgs[tabId]=cvs;
                    
                    cvs.convertToBlob({type: 'img/jpeg', quality: 0.1}).then(function(cvsblob){
                        const reader = new FileReader();
                        reader.addEventListener('load', function(){
                            tabImgs[tabId]=reader.result;
                        });
                        reader.readAsDataURL(cvsblob);
                    });

                    

                    //.convertToBlob({type: 'img/jpeg', quality: 1.0}); // we cache blobs now... don't ask why... because REASONS (such as I'm sure we can actually cache these right?? lol... wait I had running memory context... wait what am I??? a service worker!  Oh crap ran out of work, guess time to kill all memory anyway... bye bye...

                    /*
                     
                     const offscreen = document.querySelector('canvas').transferControlToOffscreen();
                     const worker = new Worker('myworkerurl.js');
                     worker.postMessage({canvas: offscreen}, [offscreen]);

                    // see why send the data URI when you can send somethign you can't even cache
                     // a million offscreen canvas or blob objects is way safer than a million strings and TOTALLY DIFFERNT mind you
                     // URL.createObjectURL() has MEMORY leaks.... Note: This feature is not available in Service Workers due to its potential to create memory leaks.
                     but that's fine everywhere else
                     
                     enjoy broken features
                     
                     */
                    
                    
                    //tabImgs[tabId]=cvs.toDataURL("image/jpeg",1.0);

                    
                    
                    
                    
                })
            })

        }
    });
    
    

//chrome.tabs.captureVisibleTab(winId, function(dataUrl){
//		pim.onload=function(){
//			var img = pim;
//			var cvs = example;
//			cvs.width = thumbwidth;
//			cvs.height = thumbwidth*thHeiRatio;
//			var dwidth = img.naturalWidth*0.75, dheight = img.naturalHeight*0.75;
//			var ctx = cvs.getContext("2d")
//			ctx.clearRect(0,0,cvs.width,cvs.height);
//			ctx.drawImage(img, 0,0, img.naturalWidth,img.naturalHeight, 0,0, dwidth,dheight);
//			var tctx = tiny.getContext("2d");
//			//drawImage (image, sx,sy, sWidth,sHeight, dx,dy, dWidth,dHeight) //CANVAS
//			//check left edge to see if there is no logo/site on image
//			var offset = 0;
//			var variation = 0;
//			var dat, dat2, dat3, avg=[];
//			var mean, min, max, median, range, halfRange, maxDist, minDist;
//			var ypos=cvs.height*0.0, ypos2=cvs.height*0.33, ypos3=cvs.height*0.66, yheight=cvs.height*0.33;
//			while( variation < 15 && offset < img.naturalWidth/4){
//				tctx.drawImage(cvs, 5,ypos, 1,yheight, 0,0, 1,1)
//				dat = tctx.getImageData(0,0, 1,1).data;
//				tctx.drawImage(cvs, 5,ypos2, 1,yheight, 0,0, 1,1)
//				dat2 = tctx.getImageData(0,0, 1,1).data;
//				tctx.drawImage(cvs, 5,ypos3, 1,yheight, 0,0, 1,1)
//				dat3 = tctx.getImageData(0,0, 1,1).data;
//				avg = [(dat[0]+dat2[0]+dat3[0])*0.333, (dat[1]+dat2[1]+dat3[1])*0.333, (dat[2]+dat2[2]+dat3[2])*0.333]
//				mean = (avg[0] + avg[1] + avg[2])*0.333;
//
//				avg.sort();
//				min = avg[0];//Math.min(avg[0], avg[1], avg[2]);
//				max = avg[2];//Math.max(avg[0], avg[1], avg[2]);
//				median = avg[1];
//				//(avg[0]!=min && avg[0]!=max)?median=avg[0]:0;
//				//(avg[1]!=min && avg[1]!=max)?median=avg[1]:0;
//				//(avg[2]!=min && avg[2]!=max)?median=avg[2]:0;
//
//				maxDist = max - median,
//				minDist = median - min;
//				maxDist = Math.max(maxDist, minDist);
//				range = (max - min);
//				halfRange = range * 0.5;
//
//				//variation = Math.abs(dat[0]-avg[0]) + Math.abs(dat[1]-avg[1]) + Math.abs(dat[2]-avg[2])
//				variation = range - (maxDist - halfRange);
//				//console.log('variation', variation, offset, avg);
//				offset += 5;
//				ctx.drawImage(img, offset,0, img.naturalWidth,img.naturalHeight, 0,0, dwidth,dheight);
//			}
//			if( offset >= img.naturalWidth/4){
//				ctx.drawImage(img, img.naturalWidth*0.25,0, img.naturalWidth*0.5,img.naturalWidth*0.5*thHeiRatio, 0,0, cvs.width,cvs.height);
//			}
//			tabImgs[tabId]=cvs.toDataURL("image/jpeg",1.0);
//			pim.src='';
//		};
//		pim.src=dataUrl;
//	});
}

//var pim = document.createElement('img');
//var example = document.createElement('canvas');
//var tiny = document.createElement('canvas');
//tiny.width = 1;
//tiny.height = 1;



// mv3 session storage... check it...
chrome.storage.session.get(['selWindows','selwIdx'], function(stor){
    
    if( stor.selWindows ){
        try{
            selWindows = JSON.parse(stor.selWindows);
        }catch(e){
            selWindows = [];
        }
    }
    
    if( stor.selwIdx ){
        try{
            selwIdx = JSON.parse(stor.selwIdx);
        }catch(e){
            selwIdx = [];
        }
    }
    
    console.log('bg launched and got session storage again...')
    
    fromPrefs();
});

