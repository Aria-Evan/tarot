/**
 * 韦特塔罗占卜 V6
 * 真实牌面 + 弧形选牌 + 洗牌动画 + AI解读 + 持久整体解读 + 逆位旋转
 */
(function () {
  'use strict';

  const SPREADS = [
    { id: 'daily', name: '每日运势', icon: '☀️', category: '日常指引', count: 1, layout: 'single', positions: ['今日运势'], desc: '抽取一张牌，快速洞悉今日能量', overallTitle: '🌅 今日运势解读',
      generateOverall(d) { const x=d[0],r=x.isUpright?'正位':'逆位'; return `【今日运势】${x.card.name}（${r}）\n→ ${x.isUpright?x.card.upright_meaning:x.card.reversed_meaning}\n\n📜 综合解读：\n${x.card.description}`; }
    },
    { id: 'three-card', name: '三张无牌阵', icon: '🌙', category: '日常指引', count: 3, layout: 'horizontal', positions: ['过去','现在','未来'], desc: '经典三张牌，窥见时间之流', overallTitle: '📜 三张牌整体解读',
      generateOverall(d) { const p=['过去','现在','未来'],a=[]; for(let i=0;i<3;i++){ const x=d[i],r=x.isUpright?'正位':'逆位'; a.push(`【${p[i]}】${x.card.name}（${r}）\n→ ${x.isUpright?x.card.upright_meaning:x.card.reversed_meaning}`); } const mc=d.filter(x=>x.card.type==='major').length,rc=d.filter(x=>!x.isUpright).length; let s='\n\n📜 综合解读：\n'; if(mc===3)s+='三张大阿尔卡纳齐聚——命运之力深刻影响你的人生轨迹。\n'; else if(mc===2)s+='两张核心大牌揭示重要篇章。\n'; else if(mc===1)s+='一张大牌串联时间主线。\n'; else s+='三张小牌聚焦日常面向。\n'; s+=rc===0?'三张正位，能量通畅。':rc===3?'三张逆位，需深入内省。':`${rc}张逆位提示需注意内在课题。`; return a.join('\n\n')+s; }
    },
    { id: 'yes-no', name: '是否牌阵', icon: '⚖️', category: '决策抉择', count: 3, layout: 'horizontal', positions: ['正面因素','负面因素','综合建议'], desc: '面对二选一，看清两面后做出抉择', overallTitle: '⚖️ 是否牌阵解读', generateOverall: g(['正面因素','负面因素','综合建议'], '综合正反两面因素，建议结合内在直觉做出最适合当下的选择。') },
    { id: 'two-choices', name: '二选一', icon: '🔀', category: '决策抉择', count: 5, layout: 'v-shape', positions: ['自己现状','选项A发展','选项B发展','选项A结果','选项B结果'], desc: '面对两个选项，清晰对比各自路径', overallTitle: '🔀 二选一解读', generateOverall: g(['自己现状','选项A发展','选项B发展','选项A结果','选项B结果'], '对比两条路径的发展与结果，选择更符合你长远目标的那一条。') },
    { id: 'mind-body', name: '身心灵', icon: '🧘', category: '自我探索', count: 3, layout: 'horizontal', positions: ['身体层面','心理层面','灵魂层面'], desc: '从身心灵三个维度全面了解自己', overallTitle: '🧘 身心灵解读', generateOverall: g(['身体层面','心理层面','灵魂层面'], '身心灵的和谐统一是幸福的基础。') },
    { id: 'find-item', name: '寻物塔罗', icon: '🔍', category: '自我探索', count: 3, layout: 'horizontal', positions: ['物品状态','寻找方向','关键线索'], desc: '寻找遗失物品，获得方向指引', overallTitle: '🔍 寻物指引', generateOverall: g(['物品状态','寻找方向','关键线索'], '细心观察牌面关键词及符号。') },
    { id: 'career', name: '事业明灯', icon: '⭐', category: '事业方向', count: 4, layout: 'grid', positions: ['当前状况','挑战','机遇','未来建议'], desc: '工作事业方向，洞察机遇与挑战', overallTitle: '⭐ 事业明灯解读', generateOverall: g(['当前状况','挑战','机遇','未来建议'], '事业之路起起伏伏，挑战与机遇并存。') },
    { id: 'lover-pyramid', name: '恋人金字塔', icon: '💑', category: '情感关系', count: 4, layout: 'triangle', positions: ['自己','对方','关系基础','发展前景'], desc: '感情关系分析，看清彼此与未来', overallTitle: '💑 恋人金字塔解读', generateOverall: g(['自己','对方','关系基础','发展前景'], '感情需要双方的投入和理解。') },
    { id: 'lover-cross', name: '恋人十字', icon: '💕', category: '情感关系', count: 5, layout: 'cross', positions: ['自己的想法','对方的想法','关系现状','阻碍','未来'], desc: '感情关系深度解读', overallTitle: '💕 恋人十字解读', generateOverall: g(['自己的想法','对方的想法','关系现状','阻碍','未来'], '十字牌阵从五个维度揭示了感情关系的全貌。') }
  ];
  function g(p,c){ return function(d){ const a=d.map((x,i)=>{ const r=x.isUpright?'正位':'逆位'; return `【${p[i]}】${x.card.name}（${r}）\n→ ${x.isUpright?x.card.upright_meaning:x.card.reversed_meaning}`; }); return a.join('\n\n')+'\n\n📜 综合解读：\n'+c; }; }

  function getCardImageUrl(card) {
    if (card.type === 'major') { const num = String(card.id).padStart(2, '0'); return `https://www.sacred-texts.com/tarot/pkt/img/ar${num}.jpg`; }
    const suitCodes = { wands: 'wa', cups: 'cu', swords: 'sw', pentacles: 'pe' };
    const code = suitCodes[card.suit] || 'wa';
    const courtCodes = { 11: 'pa', 12: 'kn', 13: 'qu', 14: 'ki' };
    if (card.rank >= 11) { return `https://www.sacred-texts.com/tarot/pkt/img/${code}${courtCodes[card.rank]}.jpg`; }
    if (card.rank === 1) { return `https://www.sacred-texts.com/tarot/pkt/img/${code}ac.jpg`; }
    const num = String(card.rank).padStart(2, '0');
    return `https://www.sacred-texts.com/tarot/pkt/img/${code}${num}.jpg`;
  }

  const $ = s => document.querySelector(s);
  const coverPage=$('#coverPage'),spreadGrid=$('#spreadGrid'),pickPage=$('#pickPage'),pickTitle=$('#pickTitle'),pickGrid=$('#pickGrid'),pickProgressBar=$('#pickProgressBar'),pickProgressText=$('#pickProgressText'),btnPickConfirm=$('#btnPickConfirm'),btnPickBack=$('#btnPickBack'),shuffleOverlay=$('#shuffleOverlay'),shuffleCards=$('#shuffleCards'),drawPage=$('#drawPage'),drawTitle=$('#drawTitle'),cardsContainer=$('#cardsContainer'),positionsRow=$('#positionsRow'),btnRevealAll=$('#btnRevealAll'),btnRedraw=$('#btnRedraw'),btnBack=$('#btnBack'),readingModal=$('#readingModal'),modalTitleEl=$('#modalTitle'),modalTags=$('#modalTags'),modalSymbol=$('#modalSymbol'),modalMeaning=$('#modalMeaning'),modalDescription=$('#modalDescription'),btnCloseModal=$('#btnCloseModal'),modalOverlay=readingModal.querySelector('.modal-overlay'),overallPanel=$('#overallPanel'),overallTitleEl=$('#overallTitle'),overallText=$('#overallText'),btnCloseOverall=$('#btnCloseOverall'),btnShowOverall=$('#btnShowOverall'),btnAIReading=$('#btnAIReading'),aiLoading=$('#aiLoading'),aiResult=$('#aiResult'),aiError=$('#aiError'),aiSection=$('#aiSection'),starsCanvas=$('#starsCanvas');

  let currentSpread=null,drawnCards=[],flippedCount=0,selectedIndices=[],overallSaved='',aiRequested=false;

  function initStars() {
    const ctx=starsCanvas.getContext('2d'); let stars=[];
    function rs(){starsCanvas.width=window.innerWidth;starsCanvas.height=window.innerHeight;}
    function cs(){stars=[];for(let i=0;i<(starsCanvas.width*starsCanvas.height)/2000;i++)stars.push({x:Math.random()*starsCanvas.width,y:Math.random()*starsCanvas.height,r:Math.random()*1.5+0.3,tw:Math.random()*Math.PI*2,ts:Math.random()*0.02+0.005});}
    function dr(){ctx.clearRect(0,0,starsCanvas.width,starsCanvas.height);for(const s of stars){s.tw+=s.ts;const a=0.3+Math.sin(s.tw)*0.35+0.35;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(200,180,255,${a.toFixed(2)})`;ctx.fill();}if(Math.sin(Date.now()*0.001)*0.5+0.5>0.85){const s=stars[Math.floor(Math.random()*stars.length)];ctx.beginPath();ctx.arc(s.x,s.y,s.r*2.5,0,Math.PI*2);ctx.fillStyle='rgba(220,200,255,0.7)';ctx.fill();}requestAnimationFrame(dr);}
    rs();cs();dr();window.addEventListener('resize',()=>{rs();cs();});
  }

  function buildSpreadGrid() {
    const cats={};SPREADS.forEach(s=>{if(!cats[s.category])cats[s.category]=[];cats[s.category].push(s);});
    let h='';for(const[cat,spreads]of Object.entries(cats)){h+=`<div class="spread-category"><h3 class="spread-category-title">📌 ${cat}</h3><div class="spread-cards">`;spreads.forEach(s=>{h+=`<div class="spread-card" data-spread-id="${s.id}"><div class="spread-card-icon">${s.icon}</div><div class="spread-card-name">${s.name}</div><div class="spread-card-count">🃏 ${s.count} 张牌</div><div class="spread-card-desc">${s.desc}</div></div>`;});h+='</div></div>';}
    spreadGrid.innerHTML=h;
    spreadGrid.querySelectorAll('.spread-card').forEach(c=>{c.addEventListener('click',()=>showShuffleThenPick(c.getAttribute('data-spread-id')));});
  }

  function getCardFrontHTML(card, isUpright) {
    const dirClass=isUpright?'upright':'reversed',dirLabel=isUpright?'正位':'逆位',imgUrl=getCardImageUrl(card);
    const revClass=isUpright?'':' card-front-reversed';
    return `<div class="real-card-face${revClass}" style="background:#e8dcc8;"><img src="${imgUrl}" class="real-card-img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" alt="${card.name}"><div class="real-card-fallback" style="display:none;">${getVisualFallback(card,isUpright)}</div><div class="real-card-label ${dirClass}">${dirLabel}</div></div>`;
  }

  function getVisualFallback(card, isUpright) {
    if(card.type==='major'){return `<div class="vis-card vis-major"><div class="vis-card-border"></div><div class="vis-card-roman">${['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'][card.id]||''}</div><div class="vis-card-symbol">${card.symbol}</div><div class="vis-card-name">${card.name}</div></div>`;}
    const sc=`vis-${card.suit||'wands'}`,se=SUIT_EMOJIS[card.suit]||'✦',sn=SUIT_NAMES[card.suit]||'',rl=card.rank<=10?card.rank:['侍从','骑士','女王','国王'][card.rank-11],pips=card.rank>=11?`<div class="vis-court-symbol">${se}</div>`:genPipsHTML(card.suit,card.rank);
    return `<div class="vis-card vis-minor ${sc}"><div class="vis-card-border"></div><div class="vis-card-suit-top">${se}</div><div class="vis-card-pips">${pips}</div><div class="vis-card-name">${rl} ${sn}</div></div>`;
  }

  function genPipsHTML(suit,rank){const e=SUIT_EMOJIS[suit]||'✦',c=typeof rank==='number'?rank:0,pip={1:[[1]],2:[[1,1]],3:[[1,1,1]],4:[[1,1],[1,1]],5:[[1,0,1],[0,1,0],[1,0,1]],6:[[1,1],[1,1],[1,1]],7:[[1,1,1],[0,1,0],[1,1,1]],8:[[1,1,1],[1,0,1],[1,1,1]],9:[[1,1,1],[1,1,1],[1,1,1]],10:[[1,1],[1,1,1],[1,1,1],[1,1]]}[c]||(function(n){const r=[];let m=n;while(m>0){r.push(new Array(Math.min(m,3)).fill(1));m-=Math.min(m,3);}return r;})(c);return pip.map(r=>`<div class="pip-row">${r.map(x=>x?`<span class="pip">${e}</span>`:'').join('')}</div>`).join('');}

  function showShuffleThenPick(spreadId) {
    const spread=SPREADS.find(s=>s.id===spreadId);if(!spread)return;
    currentSpread=spread;selectedIndices=[];overallSaved='';aiRequested=false;btnShowOverall.style.display='none';
    shuffleOverlay.classList.add('active');shuffleCards.innerHTML='';
    const shuffled=shuffleDeck(),displayCards=shuffled.slice(0,20);
    for(let i=0;i<displayCards.length;i++){const card=displayCards[i],f=document.createElement('div');f.className='flying-card';f.style.setProperty('--x',`${Math.random()*80+10}vw`);f.style.setProperty('--y',`${Math.random()*60+20}vh`);f.style.setProperty('--rot',`${Math.random()*720-360}deg`);f.style.setProperty('--delay',`${i*0.05}s`);f.style.animationDelay=`${i*0.05}s`;f.innerHTML=`<img src="${getCardImageUrl(card)}" onerror="this.outerHTML='🔮'" alt="">`;shuffleCards.appendChild(f);}
    setTimeout(()=>{shuffleOverlay.classList.remove('active');goToPickPage();},1600);
  }

  function goToPickPage() {
    coverPage.classList.remove('active');drawPage.classList.remove('active');pickPage.classList.add('active');
    pickTitle.textContent=`${currentSpread.icon} ${currentSpread.name} — 请选择 ${currentSpread.count} 张牌`;
    updatePickProgress();pickGrid.innerHTML='';
    const totalCards=TAROT_DECK.length,center=(totalCards-1)/2,maxAngle=10,maxArcY=6;
    TAROT_DECK.forEach((card,i)=>{const offset=i-center,angle=(offset/center)*maxAngle,arcY=Math.abs(offset/center)*maxArcY,mini=document.createElement('div');mini.className='pick-mini-card';mini.setAttribute('data-card-id',i);mini.style.setProperty('--angle',`${angle.toFixed(2)}deg`);mini.style.setProperty('--arc-y',`${arcY.toFixed(1)}px`);mini.innerHTML=`<div class="pick-mini-back-inner"><div class="pick-mini-star">✦</div></div><div class="pick-mini-num"></div>`;mini.addEventListener('click',()=>togglePickCard(mini,i));pickGrid.appendChild(mini);});
    btnPickConfirm.disabled=true;pickGrid.scrollLeft=(pickGrid.scrollWidth-pickGrid.clientWidth)/2;
  }

  function togglePickCard(el,cardIndex){const max=currentSpread.count;if(selectedIndices.includes(cardIndex)){selectedIndices=selectedIndices.filter(i=>i!==cardIndex);el.classList.remove('selected');el.querySelector('.pick-mini-num').textContent='';}else if(selectedIndices.length<max){selectedIndices.push(cardIndex);el.classList.add('selected');el.querySelector('.pick-mini-num').textContent=selectedIndices.length;}updatePickProgress();}
  function updatePickProgress(){const max=currentSpread.count,sel=selectedIndices.length;pickProgressText.textContent=`已选 ${sel} / ${max} 张`;pickProgressBar.style.width=`${(sel/max)*100}%`;btnPickConfirm.disabled=sel!==max;}
  function confirmPick(){if(selectedIndices.length!==currentSpread.count)return;drawnCards=selectedIndices.map(i=>({card:TAROT_DECK[i],isUpright:Math.random()>=0.5}));flippedCount=0;pickPage.classList.remove('active');drawPage.classList.add('active');renderCards();}
  function pickBack(){pickPage.classList.remove('active');coverPage.classList.add('active');currentSpread=null;selectedIndices=[];}

  function shuffleDeck(){const deck=[...TAROT_DECK];for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}

  function createCardWrapper(draw,index){const wrapper=document.createElement('div');wrapper.className='card-wrapper';wrapper.setAttribute('data-index',index);wrapper.innerHTML=`<div class="card-inner" data-card="${draw.card.id}"><div class="card-face card-back"><div class="card-back-pattern"><div class="card-back-symbol">🔮</div></div><span class="card-hint">点击翻开</span></div><div class="card-face card-front">${getCardFrontHTML(draw.card,draw.isUpright)}</div></div>`;wrapper.addEventListener('click',()=>{const inner=wrapper.querySelector('.card-inner');if(inner.classList.contains('flipped'))showCardReading(index);else flipCard(wrapper,index);});return wrapper;}

  function renderCards(){cardsContainer.innerHTML='';const spread=currentSpread,layout=spread.layout;drawnCards.forEach((d,i)=>{d.cardWrapperEl=createCardWrapper(d,i);});cardsContainer.className='cards-container';if(layout==='single'){cardsContainer.classList.add('layout-single');const o=document.createElement('div');o.className='layout-single-wrap';o.appendChild(drawnCards[0].cardWrapperEl);cardsContainer.appendChild(o);}else if(layout==='horizontal'){cardsContainer.classList.add('layout-horizontal');drawnCards.forEach(d=>cardsContainer.appendChild(d.cardWrapperEl));}else if(layout==='grid'){cardsContainer.classList.add('layout-grid');const g_=document.createElement('div');g_.className='layout-grid-inner';for(let i=0;i<4;i++){const c=document.createElement('div');c.className='grid-cell';c.appendChild(drawnCards[i].cardWrapperEl);g_.appendChild(c);}cardsContainer.appendChild(g_);}else if(layout==='triangle'){cardsContainer.classList.add('layout-triangle');const t=document.createElement('div');t.className='layout-triangle-inner';const tr=document.createElement('div');tr.className='tri-row tri-row-top';tr.appendChild(drawnCards[0].cardWrapperEl);t.appendChild(tr);const br=document.createElement('div');br.className='tri-row tri-row-bot';br.appendChild(drawnCards[1].cardWrapperEl);br.appendChild(drawnCards[2].cardWrapperEl);br.appendChild(drawnCards[3].cardWrapperEl);t.appendChild(br);cardsContainer.appendChild(t);}else if(layout==='v-shape'){cardsContainer.classList.add('layout-vshape');const v=document.createElement('div');v.className='layout-vshape-inner';const rt=document.createElement('div');rt.className='v-row v-row-top';const cl=document.createElement('div');cl.className='v-col';cl.appendChild(drawnCards[1].cardWrapperEl);const cr=document.createElement('div');cr.className='v-col';cr.appendChild(drawnCards[2].cardWrapperEl);rt.appendChild(cl);rt.appendChild(cr);v.appendChild(rt);const rm=document.createElement('div');rm.className='v-row v-row-mid';const cl2=document.createElement('div');cl2.className='v-col';cl2.appendChild(drawnCards[3].cardWrapperEl);const cr2=document.createElement('div');cr2.className='v-col';cr2.appendChild(drawnCards[4].cardWrapperEl);rm.appendChild(cl2);rm.appendChild(cr2);v.appendChild(rm);const rb=document.createElement('div');rb.className='v-row v-row-bot';rb.appendChild(drawnCards[0].cardWrapperEl);v.appendChild(rb);cardsContainer.appendChild(v);}else if(layout==='cross'){cardsContainer.classList.add('layout-cross');const cr_=document.createElement('div');cr_.className='layout-cross-inner';const ct=document.createElement('div');ct.className='cross-slot cross-top';ct.appendChild(drawnCards[0].cardWrapperEl);cr_.appendChild(ct);const cm=document.createElement('div');cm.className='cross-row';const cl_=document.createElement('div');cl_.className='cross-slot cross-left';cl_.appendChild(drawnCards[2].cardWrapperEl);const cc=document.createElement('div');cc.className='cross-slot cross-center';cc.appendChild(drawnCards[4].cardWrapperEl);const cr__=document.createElement('div');cr__.className='cross-slot cross-right';cr__.appendChild(drawnCards[3].cardWrapperEl);cm.appendChild(cl_);cm.appendChild(cc);cm.appendChild(cr__);cr_.appendChild(cm);const cb=document.createElement('div');cb.className='cross-slot cross-bottom';cb.appendChild(drawnCards[1].cardWrapperEl);cr_.appendChild(cb);cardsContainer.appendChild(cr_);}positionsRow.innerHTML=spread.positions.map((p,i)=>`<span class="position-tag">${i+1}️⃣ ${p}</span>`).join('');flippedCount=0;overallPanel.classList.remove('active');drawTitle.textContent=`${spread.icon} ${spread.name}`;}

  function flipCard(wrapper,index){const inner=wrapper.querySelector('.card-inner');if(inner.classList.contains('flipped'))return;inner.classList.add('flipped');flippedCount++;const h=wrapper.querySelector('.card-hint');if(h)h.textContent='点击查看解读';if(flippedCount===currentSpread.count){setTimeout(()=>showOverallReading(),800);drawTitle.textContent='✨ 全部已翻开（点击牌面查看解读）';}}
  function revealAll(){const ws=cardsContainer.querySelectorAll('.card-wrapper');ws.forEach((w,i)=>{const inner=w.querySelector('.card-inner');if(!inner.classList.contains('flipped')){setTimeout(()=>{inner.classList.add('flipped');const h=w.querySelector('.card-hint');if(h)h.textContent='点击查看解读';},i*300);}});flippedCount=currentSpread.count;setTimeout(()=>showOverallReading(),currentSpread.count*300+600);drawTitle.textContent='✨ 全部已翻开（点击牌面查看解读）';}
  function showCardReading(index){const draw=drawnCards[index],card=draw.card,isUp=draw.isUpright,pos=currentSpread.positions[index]||`牌 ${index+1}`;modalTitleEl.textContent=`${pos} — ${card.name}`;modalSymbol.textContent=card.symbol;modalMeaning.innerHTML=`<strong>${isUp?'✨ 正位':'🔄 逆位'}</strong>: ${isUp?card.upright_meaning:card.reversed_meaning}`;modalDescription.textContent=card.description;modalTags.innerHTML=card.keywords.map(k=>`<span class="tag">${k}</span>`).join('');readingModal.classList.add('active');}
  function closeModal(){readingModal.classList.remove('active');}

  function showOverallReading(){overallTitleEl.textContent=currentSpread.overallTitle||'📜 整体解读';overallSaved=currentSpread.generateOverall(drawnCards);overallText.textContent=overallSaved;overallPanel.classList.add('active');btnShowOverall.style.display='inline-block';if(!aiRequested){aiResult.style.display='none';aiError.style.display='none';aiLoading.style.display='none';btnAIReading.style.display='inline-block';}aiSection.style.display='block';}
  function reopenOverall(){overallPanel.classList.add('active');}

  async function getAIReading(){if(!overallSaved)return;btnAIReading.style.display='none';aiLoading.style.display='block';aiError.style.display='none';aiResult.style.display='none';const spreadName=currentSpread.name;const promptLines=['【角色】你是一位资深韦特塔罗占卜师，擅长将牌义、正逆位与牌阵位置结合进行综合分析。你的语气温柔、有洞察力，像一位智慧长者。','','【任务】根据以下牌阵"'+spreadName+'"的结果，写一段200字以内的深度塔罗解读。','','【要求】1.先概括整体能量趋势（1句话） 2.挑出最关键的一两张牌，结合它们在牌阵中的位置，说明其寓意 3.给出两到三条具体可行的人生建议 4.语言优美温暖，避免说教和机械罗列牌义 5.请用中文回复','','【牌阵结果】',overallSaved];const prompt=promptLines.join('\n');try{const resp=await fetch('https://text.pollinations.ai/'+encodeURIComponent(prompt));if(!resp.ok)throw new Error('AI 服务暂不可用');const text=await resp.text();aiLoading.style.display='none';if(text&&text.trim()){aiResult.textContent=text.trim();aiResult.style.display='block';aiRequested=true;}else{throw new Error('空回复');}}catch(e){aiLoading.style.display='none';aiError.textContent='AI 解读暂时不可用，请稍后再试。';aiError.style.display='block';btnAIReading.style.display='inline-block';}}

  function redraw(){if(!currentSpread)return;drawPage.classList.remove('active');overallPanel.classList.remove('active');selectedIndices=[];overallSaved='';aiRequested=false;btnShowOverall.style.display='none';shuffleOverlay.classList.add('active');shuffleCards.innerHTML='';const shuffled=shuffleDeck();for(let i=0;i<20;i++){const card=shuffled[i],f=document.createElement('div');f.className='flying-card';f.style.setProperty('--x',`${Math.random()*80+10}vw`);f.style.setProperty('--y',`${Math.random()*60+20}vh`);f.style.setProperty('--rot',`${Math.random()*720-360}deg`);f.style.setProperty('--delay',`${i*0.05}s`);f.style.animationDelay=`${i*0.05}s`;f.innerHTML=`<img src="${getCardImageUrl(card)}" onerror="this.outerHTML='🔮'" alt="">`;shuffleCards.appendChild(f);}setTimeout(()=>{shuffleOverlay.classList.remove('active');goToPickPage();},1600);}
  function goBack(){drawPage.classList.remove('active');overallPanel.classList.remove('active');coverPage.classList.add('active');currentSpread=null;drawnCards=[];overallSaved='';aiRequested=false;btnShowOverall.style.display='none';}

  btnRevealAll.addEventListener('click',revealAll);btnRedraw.addEventListener('click',redraw);btnBack.addEventListener('click',goBack);
  btnPickConfirm.addEventListener('click',confirmPick);btnPickBack.addEventListener('click',pickBack);
  btnCloseModal.addEventListener('click',closeModal);modalOverlay.addEventListener('click',closeModal);
  btnCloseOverall.addEventListener('click',()=>overallPanel.classList.remove('active'));
  btnShowOverall.addEventListener('click',reopenOverall);
  btnAIReading.addEventListener('click',getAIReading);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

  initStars();buildSpreadGrid();
  console.log('🔮 韦特塔罗占卜 V6 就绪！AI解读已优化。');
})();