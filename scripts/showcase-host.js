/* The website selects scenes; the isolated product windows render native HTML views. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const scenes = {
    discover:{location:'需求 · AI 探索',title:'先发现问题，再提出改进。',state:'发现值得推进的问题',kind:'normal',description:'围绕“更快找到笔记”的项目目标，查阅外部检索与交互资料，结合现有搜索方式提出正文匹配的候选需求，并保留依据与待验证事项。',ai:'围绕项目目标探索外部资料，结合项目现状整理候选与依据。',human:'明确项目目标与边界，决定哪些方向值得继续。'},
    review:{location:'需求 · 全部需求',title:'把价值、范围与验收条件说清楚。',state:'评估完成，等待你的判断',kind:'attention',description:'明确这项改进的价值、实施范围与验收条件，将中文匹配、标题优先级、边界状态和长笔记响应速度纳入核对。',ai:'分析预期价值与风险，明确实施范围，整理验收条件。',human:'审阅后接受、延后或不采用，保留决定的理由。'},
    build:{location:'执行 · 验证与验收',title:'CLI 负责推进，过程始终看得见。',state:'变更与检查已完成，等待验收',kind:'attention',description:'按已确认的目标与范围完成修改，核对中文匹配、标题优先级、边界状态与长笔记响应速度，保留执行记录、代码变更和检查结果。',ai:'完成修改与验证，保留执行记录和代码变更。',human:'只读观察 CLI，必要时补充指导，核对最终结果。'},
    deliver:{location:'版本 · 发布与交付',title:'交付改进，也留下可追溯的结果。',state:'交付已核对，继续收集反馈',kind:'normal',description:'将正文搜索纳入本次交付，关联原始需求、代码变更与验证结果。后续使用中的反馈继续进入下一轮改进。',ai:'整理交付内容与验证结果，保留与需求及执行记录的关联。',human:'按项目规则确认交付，决定下一步需要改进什么。'}
  };
  const tabs = [...document.querySelectorAll('.tour-step')], frames=[...document.querySelectorAll('[data-showcase-frame]')];
  const workflow=$('workflow-frame'), nav=document.querySelector('.tour-navigation');
  let current='discover';
  const platform=()=>document.documentElement.dataset.previewPlatform||'mac';
  function post(frame,extra={}) { frame.contentWindow?.postMessage({channel:'selfme-showcase',platform:platform(),...extra},'*'); }
  function sizeShowcase(frame){
    const image=frame.closest('.showcase-frame');
    const sourceWidth=Number(getComputedStyle(image).getPropertyValue('--showcase-source-width'));
    image.style.setProperty('--showcase-scale',image.clientWidth/sourceWidth);
  }
  function positionIndicator(){const selected=tabs.find(tab=>tab.dataset.scene===current);if(!selected)return;nav.style.setProperty('--tour-x',selected.offsetLeft+'px');nav.style.setProperty('--tour-width',selected.offsetWidth+'px');}
  function setScene(id,notify=true){
    if(!scenes[id])return;current=id;const scene=scenes[id];
    tabs.forEach(button=>{const active=button.dataset.scene===id;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
    $('scene-panel').setAttribute('aria-labelledby','step-'+id);document.querySelector('.workflow-showcase').setAttribute('aria-label','SelfMe '+scene.location+'界面预览');$('scene-location').textContent=scene.location;$('scene-title').textContent=scene.title;$('scene-description').textContent=scene.description;$('scene-ai').textContent=scene.ai;$('scene-human').textContent=scene.human;
    $('scene-state').dataset.state=scene.kind;$('scene-state').querySelector('span:last-child').textContent=scene.state;
    positionIndicator();if(notify)post(workflow,{scene:id});
  }
  tabs.forEach((button,index)=>{
    button.addEventListener('click',()=>setScene(button.dataset.scene));
    button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next===undefined)return;event.preventDefault();setScene(tabs[next].dataset.scene);tabs[next].focus({preventScroll:true});});
  });
  new ResizeObserver(positionIndicator).observe(nav);positionIndicator();
  frames.forEach(frame=>{
    new ResizeObserver(()=>sizeShowcase(frame)).observe(frame.closest('.showcase-frame'));
    frame.addEventListener('load',()=>post(frame,frame===workflow?{scene:current}:{}));
    sizeShowcase(frame);
  });
  addEventListener('selfme:platform',()=>frames.forEach(frame=>post(frame)));
  addEventListener('message',event=>{
    const frame=frames.find(item=>item.contentWindow===event.source);if(!frame||event.data?.channel!=='selfme-showcase'||event.data.kind!==frame.dataset.showcaseFrame)return;
    if(event.data.action==='ready'){post(frame,frame===workflow?{scene:current}:{});return;}
  });
})();
