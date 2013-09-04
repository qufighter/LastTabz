var pressedTabs=[],ecurTab=0,closeMode=false;
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
	who=getEventTargetA(ev);
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
	who=getEventTargetA(ev);
	if(ev.button==1){remTab(who);return;};if(who.name=='LOAD_HIST'){who.childNodes[1].innerText='';loadRest(true);return;};if(who.name=='LOAD_MORE'){who.childNodes[1].innerText='';loadAllTabs();return;};if(who.name=='LOAD_DNS'){who.childNodes[1].innerText='';loadAllTabs(false,false,true);return;};if(who.name=='LOAD_ALPHA'){who.childNodes[1].innerText='';loadAllTabs(false,true);return;};if(who.name=='LOAD_DEFAULT'){who.childNodes[1].innerText='';loadAllTabs(true);return;};document.body.style.marginRight='auto';document.body.addEventListener('mousedown',function(){window.close},true);
	chrome.tabs.update(who.name-0,{active:true},function(){/*changed tab*/})
}
function remTabs(who){if(hasBorder(who)){for(var t in pressedTabs){if(pressedTabs[t]) remTab(pressedTabs[t]);}pressedTabs=[];}else{clearPressed();remTab(who);}}
function remTab(who){who.parentNode.parentNode.removeChild(who.parentNode);chrome.tabs.remove(who.name-0,function(){/*changed tab*/})}
var tabsGotten=[],tabsLoaded=[],curTab=0;
var lockPr=false,curpr=0,hasAdd=false;
var doThumbs = ((localStorage["dothumbs"]=='true')?true:false);
var showFirstItem = ((localStorage["showCurrentTab"]=='true')?true:false);
var justback = ((localStorage["justback"]=='true')?true:false);
if(justback){
	chrome.extension.sendRequest({greeting: "lastab"}, function(response) {})
	window.close();
	return;
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
		chrome.extension.sendRequest({greeting: "gettabimg",tabId:(who.name-0)}, function(response) {
			if(response.scr){
				if(! document.getElementById('pim')){
					var p=document.createElement('img');
					p.src=response.scr;p.id='pim';p.width=150;p.className='prvw'
					document.body.appendChild(p);
				}else{
					window.setTimeout(function(){document.getElementById('pim').src=response.scr;document.getElementById('pim').style.display=(response.scr.length > 0?'block':'none');},10);
					var offs=getOffset(who);
					if(offs.y+112>document.body.clientHeight){
						offs.y=document.body.clientHeight-112;
						if(offs.y<0)offs.y=0;
					}
					document.getElementById('pim').style.top=offs.y;
				}
			}else{
				if(document.getElementById('pim')){
					document.getElementById('pim').src='';
					document.getElementById('pim').style.display='none';
				}
			}
			//lockPr=false;
		});
		//},10);
	}
}
function dovents(n){
	n.addEventListener('mousedown', pressTab);
  n.addEventListener('mouseup', relesTab);
  n.addEventListener('mouseover', mouseOverTab);
  n.addEventListener('mouseout', mouseOutTab);
  n.addEventListener('click', switchToTab);
}

function maekTab(tab,b){
	if(curTab>=15){
		document.body.style.overflowY='auto';
		document.body.style.marginRight='16px';
	}
	var n=document.getElementById('f1').cloneNode(true);
	n.id='';
	n.firstChild.title='Close \n'+tab.url;
	n.firstChild.name=tab.id;
	n.childNodes[1].className=(tab.selected?"sel":"");
	n.childNodes[1].name=tab.id;
	var turl=tab.url;
	if(turl.length > 256)turl=turl.substr(0,128)+'... ...'+turl.substr(turl.length-128);
	n.childNodes[1].title=tab.title+' \n\n'+turl;
	n.childNodes[1].childNodes[0].src=tab.favIconUrl;
	n.childNodes[1].childNodes[1].innerText='\u00a0'+tab.title.replace('http://','').replace('www.','').substr(0,offstringcut);//fars vor
	//if(b)document.body.insertBefore(n,document.getElementById('LOAD_MORE'));
	document.body.appendChild(n);
	dovents(n);
	tabsLoaded[tab.id]=true;
	//curTab++;//keep counting //jackass // why did you hide this in a function // why are you looking at this // it belongs here
	//return;//dont return until now
}
function clearAllReset(){
	tabsLoaded=[];
	var n=document.getElementById('f1').cloneNode(true);
	document.body.innerHTML='';
	document.body.appendChild(n);
	curTab=0;
}
 //think about it fool cuz its a joke that tabs could change while this is open?? or no....?? search getAllInWindow 2x= no 
//if(who.name=='LOAD_ALPHA'){who.childNodes[1].innerText='';loadAlphabetical();return;};if(who.name=='LOAD_DEFAULT'){who.childNodes[1].innerText='';loadAllTabs(true);return;};
function loadAllTabs(defaultOrdering,alphaOrdering,urlOrdering){
	if(typeof(defaultOrdering)=='undefined')defaultOrdering=false;
	if(typeof(alphaOrdering)=='undefined')alphaOrdering=false;
	if(typeof(urlOrdering)=='undefined')urlOrdering=false;

	
	
	//chrome.tabs.getAllI<input type="button" >nWindow(null, function(tabs) {
		var tabs=allInWindow;
		var cdn=function(i,l){return i>-1;}
		var inc=-1;
		var l=tabs.length;
		var i=l-1;
		
		if(defaultOrdering||alphaOrdering||urlOrdering){
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
  			maekTab(tab);
  		}curTab++;//stop
		}
		
		//if(defaultOrdering||alphaOrdering)
		addRemainingTabsLink(true);
		
		if(alphaOrdering||urlOrdering){//get sort back
			chrome.tabs.getAllInWindow(null, function(t) {
				allInWindow=t;
			});
		}
	//});
}
var allInWindow=[];
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
		addRemainingTabsLink();
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
	chrome.extension.sendRequest({greeting: "gettabs"}, function(response) {
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
		loadnexttab();
		//else addRemainingTabsLink();
	});
}
function loadnexttab(){
//			chrome.tabs.get(tabsGotten[curTab], function(tab) {
//				if(tab){
//					maekTab(tab);
//				}
//			});
//			curTab++;
//			if(curTab > 4 ){
		loadRest();return;
	//}
	//if(curTab < tabsGotten.length )window.setTimeout(loadnexttab,14);
}
function addRemainingTabsLink(skipShowRemaining){
	if(typeof(skipShowRemaining)=='undefined')skipShowRemaining=false;

	//if(hasAdd)return;hasAdd=true;
	//use maektab to do this, but no
	if(document.getElementById('LOAD_MORE'))document.getElementById('LOAD_MORE').parentNode.removeChild(document.getElementById('LOAD_MORE'));
	if(document.getElementById('LOAD_ALPHA'))document.getElementById('LOAD_ALPHA').parentNode.removeChild(document.getElementById('LOAD_ALPHA'));
	if(document.getElementById('LOAD_DEFAULT'))document.getElementById('LOAD_DEFAULT').parentNode.removeChild(document.getElementById('LOAD_DEFAULT'));
	if(document.getElementById('LOAD_DNS'))document.getElementById('LOAD_DNS').parentNode.removeChild(document.getElementById('LOAD_DNS'));

	if(!skipShowRemaining){
  	var n=document.getElementById('f1').cloneNode(true);
		n.id='LOAD_MORE';
		n.className="thinrow";
		n.firstChild.style.display="none";
		n.childNodes[1].className="";
		n.childNodes[1].name="LOAD_MORE";
		n.childNodes[1].title="Show non-history tabs for this window";
		n.childNodes[1].childNodes[0].style.display="none";
		n.childNodes[1].childNodes[1].innerText='\u00a0'+'Show Remaining Tabs...';
		document.body.appendChild(n);
		dovents(n);
		//n.childNodes[1].addEventListener('mouseover',function(e){who=e.target;if(who.name=='LOAD_MORE')switchToTab(e,who)},true);
  }else{
  	var n=document.getElementById('f1').cloneNode(true);
		n.id='LOAD_HIST';
		n.className="thinrow";
		n.firstChild.style.display="none";
		n.childNodes[1].className="";
		n.childNodes[1].name="LOAD_HIST";
		n.childNodes[1].title="Shows historic tabs in order of their last viewing.  Tabs you were just in will be listed at the top.";
		n.childNodes[1].childNodes[0].style.display="none";
		n.childNodes[1].childNodes[1].innerText='\u00a0'+'Show History Order...';
		document.body.appendChild(n);
		dovents(n)
  }
	var n=document.getElementById('f1').cloneNode(true);
	n.id='LOAD_ALPHA';
	n.className="thinrow";
	n.firstChild.style.display="none";
	n.childNodes[1].className="";
	n.childNodes[1].name="LOAD_ALPHA";
	n.childNodes[1].title="Sort tabs alphabetically by tab title";
	n.childNodes[1].childNodes[0].style.display="none";
	n.childNodes[1].childNodes[1].innerText='\u00a0'+'Sort by Title...';
	document.body.appendChild(n);
	dovents(n)
	
	n=document.getElementById('f1').cloneNode(true);
	n.id='LOAD_DNS';
	n.className="thinrow";
	n.firstChild.style.display="none";
	n.childNodes[1].className="";
	n.childNodes[1].name="LOAD_DNS";
	n.childNodes[1].title="Sort tabs alphabetically by their URL";
	n.childNodes[1].childNodes[0].style.display="none";
	n.childNodes[1].childNodes[1].innerText='\u00a0'+'Sort By Domain...';
	document.body.appendChild(n);
	dovents(n)
	
	n=document.getElementById('f1').cloneNode(true);
	n.id='LOAD_DEFAULT';
	n.className="thinrow";
	n.firstChild.style.display="none";
	n.childNodes[1].className="";
	n.childNodes[1].name="LOAD_DEFAULT";
	n.childNodes[1].title="Show tabs in their default left to right order";
	n.childNodes[1].childNodes[0].style.display="none";
	n.childNodes[1].childNodes[1].innerText='\u00a0'+'Show Tabz Order...';
	document.body.appendChild(n);
	dovents(n)
	
	n=document.createElement('input');
	n.setAttribute('type','text');
	n.setAttribute('value','Search');
	document.body.appendChild(n);
	n.select();
	
}

document.addEventListener('DOMContentLoaded', function () {
	cl();
});
