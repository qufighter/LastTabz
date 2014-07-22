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
	who=getEventTargetA(ev);
//  		if(ev.button==1){
//  			who.previousSibling.style.border='none';
//  			who.style.border='';
//  		}
}

function switchToTab(ev,who){
	if( typeof(who) == 'undefined') who=getEventTargetA(ev);
	if(ev.button==1){remTab(who);return;};
	if(who.name=='LOAD_HIST'){loadRest(true);return;};
	if(who.name=='LOAD_MORE'){loadAllTabs();return;};
	if(who.name=='LOAD_DNS'){loadAllTabs(false,false,true);return;};
	if(who.name=='LOAD_ALPHA'){loadAllTabs(false,true);return;};
	if(who.name=='LOAD_DEFAULT'){loadAllTabs(true);return;};
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
var tabsGotten=[],tabsLoaded=[],curTab=0;
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
	tabsLoaded[tab.id] = true;
}
function clearAllReset(){
	tabsLoaded=[];
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
var defaultOrdering=0,alphaOrdering=0,urlOrdering=0;
function actuallyLoadAllTabs(navToTopMatch){
	var searchWord=false;
	if( searchTitlesDefault != _ge('title-search').value ){
		searchWord=_ge('title-search').value.toLowerCase().split(' ');
	}
	
	//chrome.tabs.getAllI<input type="button" >nWindow(null, function(tabs) {
		var tabs=allInWindow;
		var tabResults = [];
		var cdn=function(i,l){return i>-1;}
		var inc=-1;
		var l=tabs.length;
		var i=l-1;
		
		if(searchWord||defaultOrdering||alphaOrdering||urlOrdering){
			clearAllReset();
			cdn=function(i,l){return i<l;}
			inc=1,i=0;
		}

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
			if(tab && !tabsLoaded[tab.id]){
				if(searchWord){
					var searchHaystack = tab.title.toLowerCase()+' '+tab.url.toLowerCase();
					for(s=0,sl=searchWord.length;s<sl; s++){
						if(searchHaystack.indexOf(searchWord[s]) < 0) break;
					}
					if(s==sl) tabResults.push(tab),maekTab(tab);
				}else tabResults.push(tab),maekTab(tab);
			}curTab++;//stop
		}
		
		//if(defaultOrdering||alphaOrdering)
		showRemainingTabsButton(true);
		
		if(alphaOrdering||urlOrdering){//get sort back
			getCurrentTabs();
		}

		if( tabResults.length ){ //show thumbnail for first result
			mouseOverTab({}, document.getElementById('tabs').childNodes[0].getElementsByTagName('a')[0])
		}

		if( navToTopMatch ){
			switchToTab({},{name:tabResults[0].id});
		}
	//});
}
var allInWindow=[];
function getCurrentTabs(){
	chrome.tabs.getAllInWindow(null, function(t) {
		allInWindow=t;
	});
}
function loadRest(doReset){
	if(typeof(doReset)=='undefined')doReset=false;
	if(doReset)clearAllReset();
	chrome.tabs.getAllInWindow(null, function(tabs){
		allInWindow=tabs;
		var allTabsnow=[];
		for( var i=tabs.length-1; i>-1; i-- ){
			allTabsnow[tabs[i].id]=tabs[i];
		}
		while(curTab<tabsGotten.length){
			var tab=allTabsnow[tabsGotten[curTab]];
			//console.log('--');
			if(tab){
				maekTab(tab);
			}curTab++;//go
			//if(curTab > tabsGotten.length-2)window.setTimeout(addRemainingTabsLink,300);
			//console.log(curTab, tabsGotten.length-2)
		}
		if(doReset)showRemainingTabsButton();
	});
}
function createf1(){
	var dcl='',moe='';
	if(doThumbs){
		document.body.style.marginLeft=150;
		moe='onmouseover="pr(this)" ';
		dcl='style="left:150px;"';
	}
}
function cl(){
	addRemainingTabsLink();
	chrome.runtime.sendMessage({greeting: "gettabs"}, function(response) {
//document.body.innerHTML+=response.farewell;
		if(response.farewell==undefined){addRemainingTabsLink();return;};
		createf1();
		var tabs = response.farewell;//ß.split(',');
		tabsGotten=[],curTab=0,hasAdd=false;//,loadedTabs=0;
		for( i=tabs.length-(showFirstItem?1:2); i >-1; i-- ){
			if(tabs[i]-0 > 0 ){
				tabsGotten.push(tabs[i]-0);
			}
		}
		//if(tabsGotten.length>0)
		loadRest();
	});
}

function selectSelf(ev){
	getEventTarget(ev).select();
}
function wordSearchTabTitles(ev){
	console.log(ev.keyCode);
	var kc = ev.keyCode;
	if( kc == 13 ){//enter
		return actuallyLoadAllTabs(true);
	}else if(kc == 38){//up
		cancelEvent(ev);return;
	}else if(kc == 40){//down
		cancelEvent(ev);return;
	}
	actuallyLoadAllTabs();//searches leaving current sort applied
}

function showRemainingTabsButton(is_on){
	if(_ge('LOAD_MORE'))is_on=true;
	if(_ge('LOAD_MORE'))_ge('LOAD_MORE').parentNode.removeChild(_ge('LOAD_MORE'));
	if(_ge('LOAD_HIST'))_ge('LOAD_HIST').parentNode.removeChild(_ge('LOAD_HIST'));
	
	if(is_on){
		var n=Cr.elm('div',{id:'LOAD_HIST',class:'thinrow',events:[['mousedown', pressTab],['mouseup', relesTab],['mouseover', mouseOverTab],['mouseout', mouseOutTab],['click', switchToTab]]},[
			Cr.elm('a',{name:'LOAD_HIST',title:"Shows historic tabs in order of their last viewing.  Tabs you were just in will be listed at the top."},[
				Cr.elm('span',{class:'thinspan'},[Cr.txt('Show History Order...')])
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
		Cr.elm('input',{id:'title-search',type:'text',value:searchTitlesDefault,events:[['mouseover',selectSelf],['keyup',wordSearchTabTitles]]})
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

document.addEventListener('DOMContentLoaded', function () {
	cl();
});
