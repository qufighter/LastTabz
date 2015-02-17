var pressedTabs=[],ecurTab=0,closeMode=false;
var searchTitlesDefault='Search Title & Url';
function getEventTarget(ev){
	ev = ev || event;
	var targ=(typeof(ev.target)!='undefined') ? ev.target : ev.srcElement;
	if(targ !=null){
			if(targ.nodeType==3)
					targ=targ.parentNode;
	}
	return targ;
}

function getEventTargetA(ev){
	ev = ev || event;
	var targ=(typeof(ev.target)!='undefined') ? ev.target : ev.srcElement;
	if(targ !=null){
			if(targ.nodeType==3)
					targ=targ.parentNode;
	}
	if(targ.nodeName != 'A')return targ.parentNode;
	return targ;
}
function preventEventDefault(ev){
	ev = ev || event;
	if(ev.preventDefault)ev.preventDefault();
	ev.returnValue=false;
	return false;
}
function stopEventPropagation(ev){
	ev = ev || event;
	if(ev.stopPropagation)ev.stopPropagation();
	ev.cancelBubble=true;
	ev.cancel=true;
}
function cancelEvent(e){
	e = e ? e : window.event;
	if(e.stopPropagation)
		e.stopPropagation();
	if(e.preventDefault)
		e.preventDefault();
	e.cancelBubble = true;
	e.cancel = true;
	e.returnValue = false;
	return false;
}
function _ge(l){
	return document.getElementById(l);
}
function addBorder(who){
	who.previousSibling.style.border='1px solid red';
	who.style.border="1px solid red";
}
function remBorder(who){
	who.previousSibling.style.border='none';
	who.style.border='';
}
function hasBorder(who){if(who.style.border=="1px solid red")return true;return false;}
function queueClose(who){pressedTabs[who.name]=(who);}
function unqueueClose(who){pressedTabs[who.name]=false;}
function clearPressed(){
	for(var t in pressedTabs){
		if(pressedTabs[t]) remBorder(pressedTabs[t]);
	}
	pressedTabs=[];
}
function pressTab(ev,who,isfirst){
	who=getEventTargetA(ev);
	if(who.parentNode.className!='thinrow' && ev.button==1){
		clearPressed()
		closeMode=true;
		addBorder(who);
		queueClose(who);
		ecurTab=who;
	}
}
function relesTab(ev){
	who=getEventTargetA(ev);
	if(ev.button==1){
		remTabs(who);
	}
}
var lastOverTab = {className:''}
function mouseOverTab(ev,who,isfirst){
	if( typeof(who) == 'undefined') who=getEventTargetA(ev);
	if(who.parentNode.className!='thinrow' && closeMode && ev.button==1 && ecurTab!=who){
		if(hasBorder(who)){
			remBorder(who);
			unqueueClose(who);
		}else{
			addBorder(who);
			queueClose(who);
		}
		ecurTab=who;
	}

	if( who.parentNode.className=='row' ){
		lastOverTab.className=lastOverTab.className.replace(' reticule','');
		who.className=who.className.replace(' reticule','') + ' reticule';
		lastOverTab=who;
	}

	who.scrollIntoViewIfNeeded();
	pr(who)
//  		if(ev.button==1){
//  			if(isfirst || pressedTab==who){
//  				who.previousSibling.style.border='1px solid red';
//  				who.style.border="1px solid red";
//  				pressedTab=who
//				}
//			}
}
function mouseOutTab(ev,who){
	if( typeof(who) == 'undefined') who=getEventTargetA(ev);

	if( who.parentNode.className=='row' ){
		lastOverTab.className=lastOverTab.className.replace(' reticule','');
	}
//  		if(ev.button==1){
//  			who.previousSibling.style.border='none';
//  			who.style.border='';
//  		}
}

function clearSearch(){
	_ge('title-search').value=searchTitlesDefault;
}

function switchToTab(ev,who){
	if( typeof(who) == 'undefined') who=getEventTargetA(ev);
	if(ev.button==1){remTab(who);return;};
	if(who.name=='LOAD_HIST'){clearSearch();loadRest(true);return;};
	if(who.name=='LOAD_MORE'){clearSearch();loadAllTabs();return;};
	if(who.name=='LOAD_DNS'){clearSearch();loadAllTabs(false,false,true);return;};
	if(who.name=='LOAD_ALPHA'){clearSearch();loadAllTabs(false,true);return;};
	if(who.name=='LOAD_DEFAULT'){clearSearch();loadAllTabs(true);return;};
	chrome.tabs.update(who.name-0,{active:true},function(){/*changed tab*/window.close();})
}
function remTabs(who){if(hasBorder(who)){for(var t in pressedTabs){if(pressedTabs[t]) remTab(pressedTabs[t]);}pressedTabs=[];}else{clearPressed();remTab(who);}}
function remTab(who){who.parentNode.parentNode.removeChild(who.parentNode);chrome.tabs.remove([who.name-0],function(){getCurrentTabs()})}
function closeX(ev){
	who=getEventTarget(ev);
	console.log(who);
	remTab(who);
	cancelEvent(ev);
}
/*tabsGotten means historyTabs*/
var tabsGotten=[],tabsLoaded=[],tabResults=[],curTab=0;
var lockPr=false,curpr=0,hasAdd=false;
var doThumbs = ((localStorage["dothumbs"]=='true')?true:false);
var showFirstItem = ((localStorage["showCurrentTab"]=='true')?true:false);
var justback = ((localStorage["justback"]=='true')?true:false);
if(justback){
	chrome.runtime.sendMessage({greeting: "lastab"}, function(response) {})
	window.close();
}
var offstringcut = 21;//truncate titles will be ocfigurable as wol wildth
function pr(who){};
if(doThumbs){
	function pr(who){
		//window.setTimeout(function(){
			if(!lockPr && curpr!=who){
				pre(who);
				lockPr=true;
			}
			curpr=who;
			window.setTimeout(function(){lockPr=false;if(curpr==who)pre(who);},50);
		//},100);
	}
	function getOffset( el ){
			var _x=0,_y=0;
			while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
					_x+=el.offsetLeft;// - el.scrollLeft;
					_y+=el.offsetTop;// - el.scrollTop;
					el = el.offsetParent;
			}return { y: _y, x: _x };
	}
	function pre(who){
		chrome.runtime.sendMessage({greeting: "gettabimg",tabId:(who.name-0)}, function(response) {
			if(response.scr){
				if(! _ge('pim')){
					var p=document.createElement('img');
					p.src=response.scr;p.id='pim';p.width=150;p.className='prvw'
					document.body.appendChild(p);
				}else{
					window.setTimeout(function(){_ge('pim').src=response.scr;_ge('pim').style.display=(response.scr.length > 0?'block':'none');},10);
					var offs=getOffset(who);
					if(offs.y+112>document.body.clientHeight){
						offs.y=document.body.clientHeight-112;
						if(offs.y<0)offs.y=0;
					}
					_ge('pim').style.top=offs.y;
				}
			}else{
				if(_ge('pim')){
					_ge('pim').src='';
					_ge('pim').style.display='none';
				}
			}
			//lockPr=false;
		});
		//},10);
	}
}

function maekTab(tab,b){
	if( tabsLoaded[tab.id] ){console.log('tab alredy loaded', tab, b);return;}
	if(curTab>=15){
		document.body.style.overflowY='auto';
		document.body.style.marginRight='16px';
	}

	var turl=tab.url;
	if(turl.length > 256)turl=turl.substr(0,128)+'... ...'+turl.substr(turl.length-128);

	var n = Cr.elm('div',{class:'row',events:[['mousedown', pressTab],['mouseup', relesTab],['mouseover', mouseOverTab],['mouseout', mouseOutTab],['click', switchToTab]]},[
		Cr.elm('img',{title:'Close \n'+tab.url,name:tab.id,class:'closex',src:'img/close.png',event:['click',closeX,true]}),
		Cr.elm('a',
						{class:(tab.selected?"sel":""),
								name:tab.id,
								title:tab.title+' \n\n'+turl
						},[
							Cr.elm('img',{src:tab.favIconUrl,class:'favi',border:0}),
							Cr.elm('span',{},[
								Cr.txt(tab.title.replace('http://','').replace('www.','').substr(0,offstringcut))
							])
						]
		)
	],_ge('tabs'));
	tabResults.push(tab);
	tabsLoaded[tab.id] = true;
}
function clearAllReset(){
	tabsLoaded=[];
	tabResults=[];
	Cr.empty(_ge('tabs'));
	curTab=0;
}
 //think about it fool cuz its a joke that tabs could change while this is open?? or no....?? search getAllInWindow 2x= no 
//if(who.name=='LOAD_ALPHA'){who.childNodes[1].innerText='';loadAlphabetical();return;};if(who.name=='LOAD_DEFAULT'){who.childNodes[1].innerText='';loadAllTabs(true);return;};


function loadAllTabs(_defaultOrdering,_alphaOrdering,_urlOrdering){
	if(typeof(_defaultOrdering)=='undefined')_defaultOrdering=false;
	if(typeof(_alphaOrdering)=='undefined')_alphaOrdering=false;
	if(typeof(_urlOrdering)=='undefined')_urlOrdering=false;
	defaultOrdering=_defaultOrdering,
	alphaOrdering=_alphaOrdering,
	urlOrdering=_urlOrdering;
	actuallyLoadAllTabs();
}
var defaultOrdering=0,alphaOrdering=0,urlOrdering=0,selectedMatchIndex=0;
function actuallyLoadAllTabs(navToTopMatch){
	var searchWord=false;
	if( searchTitlesDefault != _ge('title-search').value ){
		searchWord=_ge('title-search').value.toLowerCase().split(' ');
		localStorage["lastSearch"]=_ge('title-search').value;
	}
	
	//chrome.tabs.getAllI<input type="button" >nWindow(null, function(tabs) {
		var tabs=allInWindow;
		var cdn=function(i,l){return i>-1;}
		var inc=-1;
		var l=tabs.length;
		var i=l-1;
		
		if(searchWord||defaultOrdering||alphaOrdering||urlOrdering){
			clearAllReset();
			cdn=function(i,l){return i<l;}
			inc=1,i=0;
		}

		/* needed: a way to sort tabs on history order too, since search results are always sorted by tab order, alpha order, or url order ... see "tabsGotten means historyTabs" */
		/* this will also need to be reset, or otherwise we need to also maintain a way to sort by default ordering */
		if(alphaOrdering){
			tabs.sort(function(a, b){
			 var nameA=a.title.toLowerCase(), nameB=b.title.toLowerCase()
			 if (nameA < nameB) //sort string ascending
				return -1
			 if (nameA > nameB)
				return 1
			 return 0 //default return value (no sorting)
			})
		}else if(urlOrdering){
			tabs.sort(function(a, b){
				//.replace('http://','').replace('https://','')
			 var nameA=a.url.toLowerCase(), nameB=b.url.toLowerCase()
			 if (nameA < nameB) //sort string ascending
				return -1
			 if (nameA > nameB)
				return 1
			 return 0 //default return value (no sorting)
			})
		}
		
		//for( i=tabs.length-1; cdn(i,l); i+=inc ){
		for( ; cdn(i,l); i+=inc ){
			var tab=tabs[i]
			if(tab){
				if(searchWord){
					var searchHaystack = tab.title.toLowerCase()+' '+tab.url.toLowerCase();
					for(s=0,sl=searchWord.length;s<sl; s++){
						if(searchHaystack.indexOf(searchWord[s]) < 0) break;
					}
					if(s==sl) maekTab(tab);
				}else if(!navToTopMatch || selectedMatchIndex > 0){
					maekTab(tab); // calling this function while navigating top match can cause issues where popup does not close, when selectedMatchIndex > 0 typically results are already created and in that case maekTab() does nothing to cause this undesired behavior
				}
			}curTab++;//stop
		}
		
		//if(defaultOrdering||alphaOrdering)
		showRemainingTabsButton(true);
		
		if(alphaOrdering||urlOrdering){//get sort back
			getCurrentTabs(); // this resets the sort, since we applied a strange sort above, we lost the default ordering of tabs, probably not needed if desired sort is always applied
		}

		if( selectedMatchIndex >= tabResults.length ) selectedMatchIndex = tabResults.length-1;
		if( selectedMatchIndex < 0 ) selectedMatchIndex = 0;

		if( tabResults.length ){
			if( navToTopMatch ){
				switchToTab({},{name:tabResults[selectedMatchIndex].id});
			}else{
				//show thumbnail for first result, also indicate tab index
				mouseOverTab({}, document.getElementById('tabs').childNodes[selectedMatchIndex].getElementsByTagName('a')[0]);
			}
		}
	//});
}
var allInWindow=[],allTabsByTabId=[];
function getCurrentTabs(){
	chrome.tabs.getAllInWindow(null, function(tabs) {
		allInWindow=tabs;
		allTabsByTabId=[];
		for( var i=tabs.length-1; i>-1; i-- ){
			allTabsByTabId[tabs[i].id]=tabs[i];
		}// duplicated below
	});
}
function loadRest(doReset){
	if(typeof(doReset)=='undefined')doReset=false;
	if(doReset)clearAllReset();
	chrome.tabs.getAllInWindow(null, function(tabs){
		allInWindow=tabs;
		allTabsByTabId=[];
		for( var i=tabs.length-1; i>-1; i-- ){
			allTabsByTabId[tabs[i].id]=tabs[i];
		}// duplicated above
		while(curTab<tabsGotten.length){
			var tab=allTabsByTabId[tabsGotten[curTab]];
			//console.log('--');
			if(tab){
				maekTab(tab);
			}curTab++;//go
			//if(curTab > tabsGotten.length-2)window.setTimeout(addRemainingTabsLink,300);
			//console.log(curTab, tabsGotten.length-2)
		}
		if( tabsGotten.length ){
			mouseOverTab({}, document.getElementById('tabs').childNodes[selectedMatchIndex].getElementsByTagName('a')[0]);
		}
		if(doReset)showRemainingTabsButton();
	});
}

function cl(){
	addRemainingTabsLink();
	chrome.runtime.sendMessage({greeting: "gettabs"}, function(response) {
		if(doThumbs){
			document.body.style.marginLeft=150;
		}
		var tabs = response.farewell || [];
		tabsGotten=[],curTab=0,hasAdd=false;
		for( i=tabs.length-(showFirstItem?1:2); i >-1; i-- ){
			if(tabs[i]-0 > 0 ){
				tabsGotten.push(tabs[i]-0);
			}
		}
		loadRest();
	});
}

function selectSelf(ev){
	getEventTarget(ev).select();
}
function processArrowInput(ev){
	console.log(ev.keyCode);
	var kc = ev.keyCode;
	if( kc == 13 ){//enter
		cancelEvent(ev);
		return actuallyLoadAllTabs(true);
	}else if( kc == 17 ){//left control
		cancelEvent(ev);
		return setLastSearch();
	}else if(kc == 38){//up
		selectedMatchIndex--;
		cancelEvent(ev);
	}else if(kc == 40){//down
		selectedMatchIndex++;
		cancelEvent(ev);
	}
	setTimeout(actuallyLoadAllTabs,10);
}

function setLastSearch(){
	_ge('title-search').value=localStorage["lastSearch"];
	_ge('title-search').select();
	actuallyLoadAllTabs();
}

function showRemainingTabsButton(is_on){
	if(_ge('LOAD_MORE'))is_on=true;
	if(_ge('LOAD_MORE'))_ge('LOAD_MORE').parentNode.removeChild(_ge('LOAD_MORE'));
	if(_ge('LOAD_HIST'))_ge('LOAD_HIST').parentNode.removeChild(_ge('LOAD_HIST'));
	if(_ge('LAST_SEARCH'))_ge('LAST_SEARCH').parentNode.removeChild(_ge('LAST_SEARCH'));

	if( localStorage["lastSearch"] ){
		var n=Cr.elm('div',{id:'LAST_SEARCH',class:'thinrow',events:[['click', setLastSearch]]},[
			Cr.elm('a',{name:'LAST_SEARCH',title:"Show results for the last search term '"+localStorage["lastSearch"]+"' [ctrl]..."},[
				Cr.elm('span',{class:'thinspan'},[Cr.txt('Show "'+localStorage["lastSearch"]+'"...')])
			])
		]);
		Cr.insertNode(n,_ge('controls'),_ge('controls').firstChild);
	}

	if(is_on){
		var n=Cr.elm('div',{id:'LOAD_HIST',class:'thinrow',events:[['mousedown', pressTab],['mouseup', relesTab],['mouseover', mouseOverTab],['mouseout', mouseOutTab],['click', switchToTab]]},[
			Cr.elm('a',{name:'LOAD_HIST',title:"Shows historic tabs in order of their last viewing.  Tabs you were just in will be listed at the top."},[
				Cr.elm('span',{class:'thinspan'},[Cr.txt('Show Recent Tabs...')])
			])
		]);
		Cr.insertNode(n,_ge('controls'),_ge('controls').firstChild);
	}else{
		var n=Cr.elm('div',{id:'LOAD_MORE',class:'thinrow',events:[['mousedown', pressTab],['mouseup', relesTab],['mouseover', mouseOverTab],['mouseout', mouseOutTab],['click', switchToTab]]},[
			Cr.elm('a',{name:'LOAD_MORE',title:"Show non-history tabs for this window"},[
				Cr.elm('span',{class:'thinspan'},[Cr.txt('Show Remaining Tabs...')])
			])
		]);
		Cr.insertNode(n,_ge('controls'),_ge('controls').firstChild);
	}

}

function addRemainingTabsLink(){
	showRemainingTabsButton();

	var sf=Cr.elm('div',{id:'LOAD_SEARCH',class:'thinrow',events:[['mousedown', pressTab],['mouseup', relesTab],['mouseover', mouseOverTab],['mouseout', mouseOutTab],['click', switchToTab]]},[
		Cr.elm('input',{id:'title-search',type:'text',value:searchTitlesDefault,events:[['mouseover',selectSelf],['keydown',processArrowInput]]})
	],_ge('controls'));
	sf.firstChild.select();

	Cr.elm('div',{id:'LOAD_ALPHA',class:'thinrow',events:[['mousedown', pressTab],['mouseup', relesTab],['mouseover', mouseOverTab],['mouseout', mouseOutTab],['click', switchToTab]]},[
		Cr.elm('a',{name:'LOAD_ALPHA',title:"Sort tabs alphabetically by tab title"},[
			Cr.elm('span',{class:'thinspan'},[Cr.txt('Sort by Title...')])
		])
	],_ge('controls'));

	Cr.elm('div',{id:'LOAD_DNS',class:'thinrow',events:[['mousedown', pressTab],['mouseup', relesTab],['mouseover', mouseOverTab],['mouseout', mouseOutTab],['click', switchToTab]]},[
		Cr.elm('a',{name:'LOAD_DNS',title:"Sort tabs alphabetically by their URL"},[
			Cr.elm('span',{class:'thinspan'},[Cr.txt('Sort by Domain...')])
		])
	],_ge('controls'));

	Cr.elm('div',{id:'LOAD_DEFAULT',class:'thinrow',events:[['mousedown', pressTab],['mouseup', relesTab],['mouseover', mouseOverTab],['mouseout', mouseOutTab],['click', switchToTab]]},[
		Cr.elm('a',{name:'LOAD_DEFAULT',title:"Show tabs in their default left to right order"},[
			Cr.elm('span',{class:'thinspan'},[Cr.txt('Sort by Tab Order...')])
		])
	],_ge('controls'));
}

document.addEventListener('keydown',processArrowInput);

document.addEventListener('DOMContentLoaded', function () {
	cl();
});
