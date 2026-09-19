// @name unlock
// @description サイトが仕込んでいるコピー・右クリック・テキスト選択の禁止を解除する
// @version 1.0.0
// @license MIT License
// @author securecat
// @updated 2026-09-19
(function(){var PROPS=['user-select','-webkit-user-select','-moz-user-select','-ms-user-select','-webkit-touch-callout'];var EVENTS=['mousedown','selectstart','copy','contextmenu','keydown','keypress','keyup'];var stop=function(e){e.stopPropagation();};function unlockEl(el){PROPS.forEach(function(p){el.style.setProperty(p,'auto','important');});EVENTS.forEach(function(n){el.addEventListener(n,stop,true);});if(el.shadowRoot)unlockTree(el.shadowRoot);}function unlockTree(root){Array.prototype.forEach.call(root.querySelectorAll('*'),unlockEl);}EVENTS.forEach(function(n){document.addEventListener(n,stop,true);});unlockTree(document);var observer=new MutationObserver(function(mutations){mutations.forEach(function(m){m.addedNodes.forEach(function(node){if(node.nodeType===1){unlockEl(node);unlockTree(node);}});});});observer.observe(document.body,{childList:true,subtree:true});console.log('[unlock] 起動 ✓');})();
