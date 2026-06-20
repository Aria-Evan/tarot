/**
 * 韦特塔罗占卜 - 主逻辑 V3
 * 9种牌阵 + 多种布局形状 + 翻牌后点击解读
 */
(function () {
  'use strict';

  // ==================== 牌阵配置 ====================
  const SPREADS = [
    // === 日常指引 ===
    {
      id: 'daily', name: '每日运势', icon: '☀️', category: '日常指引',
      count: 1, layout: 'single',
      positions: ['今日运势'],
      desc: '抽取一张牌，快速洞悉今日能量',
      overallTitle: '🌅 今日运势解读',
      generateOverall(drawn) {
        const d = drawn[0]; const dir = d.isUpright ? '正位' : '逆位';
        const meaning = d.isUpright ? d.card.upright_meaning : d.card.reversed_meaning;
        return `【今日运势】${d.card.name}（${dir}）\n→ ${meaning}\n\n📜 综合解读：\n${d.card.description}`;
      }
    },
    {
      id: 'three-card', name: '三张无牌阵', icon: '🌙', category: '日常指引',
      count: 3, layout: 'horizontal',
      positions: ['过去', '现在', '未来'],
      desc: '经典三张牌，窥见时间之流',
      overallTitle: '📜 三张牌整体解读',
      generateOverall(drawn) {
        const posNames = ['过去', '现在', '未来']; const parts = [];
        for (let i = 0; i < 3; i++) {
          const d = drawn[i]; const dir = d.isUpright ? '正位' : '逆位';
          parts.push(`【${posNames[i]}】${d.card.name}（${dir}）\n→ ${d.isUpright ? d.card.upright_meaning : d.card.reversed_meaning}`);
        }
        const majorCount = drawn.filter(d => d.card.type === 'major').length;
        const revCount = drawn.filter(d => !d.isUpright).length;
        let summary = '\n\n📜 综合解读：\n';
        if (majorCount === 3) summary += '三张大阿尔卡纳齐聚——命运之力深刻影响你的人生轨迹，请认真对待每一张牌的启示。\n';
        else if (majorCount === 2) summary += '两张核心大牌揭示重要篇章，小牌的补充提供具体行动方向。\n';
        else if (majorCount === 1) summary += '一张大牌串联起时间主线，周围小牌指明具体领域。\n';
        else summary += '三张小牌聚焦于日常生活的具体面向，实用和行动力是当前主题。\n';
        if (revCount === 0) summary += '三张均为正位，能量通畅，顺势而为的好时机。';
        else if (revCount === 3) summary += '三张均为逆位，内在有较多卡点——需要深入内省、调整方向的时刻。';
        else summary += `${revCount} 张逆位提示需注意内在课题，这是成长和调整的契机。`;
        return parts.join('\n\n') + summary;
      }
    },

    // === 决策抉择 ===
    {
      id: 'yes-no', name: '是否牌阵', icon: '⚖️', category: '决策抉择',
      count: 3, layout: 'horizontal',
      positions: ['正面因素', '负面因素', '综合建议'],
      desc: '面对二选一，看清两面后做出抉择',
      overallTitle: '⚖️ 是否牌阵解读',
      generateOverall(drawn) {
        const pos = ['正面因素', '负面因素', '综合建议'];
        const parts = drawn.map((d, i) => {
          const dir = d.isUpright ? '正位' : '逆位';
          return `【${pos[i]}】${d.card.name}（${dir}）\n→ ${d.isUpright ? d.card.upright_meaning : d.card.reversed_meaning}`;
        }).join('\n\n');
        return parts + '\n\n📜 综合解读：\n综合正反两面因素，建议结合内在直觉做出最适合当下的选择。任何一个决定都是成长的机会。';
      }
    },
    {
      id: 'two-choices', name: '二选一', icon: '🔀', category: '决策抉择',
      count: 5, layout: 'v-shape',
      // [0]底中=现状 [1]左上=A发展 [2]右上=B发展 [3]左中=A结果 [4]右中=B结果
      positions: ['自己现状', '选项A发展', '选项B发展', '选项A结果', '选项B结果'],
      desc: '面对两个选项，清晰对比各自路径',
      overallTitle: '🔀 二选一解读',
      generateOverall(drawn) {
        const pos = ['自己现状', '选项A发展', '选项B发展', '选项A结果', '选项B结果'];
        const parts = drawn.map((d, i) => {
          const dir = d.isUpright ? '正位' : '逆位';
          return `【${pos[i]}】${d.card.name}（${dir}）\n→ ${d.isUpright ? d.card.upright_meaning : d.card.reversed_meaning}`;
        }).join('\n\n');
        return parts + '\n\n📜 综合解读：\n对比两条路径的发展与结果，选择更符合你长远目标的那一条。记住——没有绝对的对错，每条路都带来独特的收获。';
      }
    },

    // === 自我探索 ===
    {
      id: 'mind-body', name: '身心灵', icon: '🧘', category: '自我探索',
      count: 3, layout: 'horizontal',
      positions: ['身体层面', '心理层面', '灵魂层面'],
      desc: '从身心灵三个维度全面了解自己',
      overallTitle: '🧘 身心灵解读',
      generateOverall(drawn) {
        const pos = ['身体层面', '心理层面', '灵魂层面'];
        const parts = drawn.map((d, i) => {
          const dir = d.isUpright ? '正位' : '逆位';
          return `【${pos[i]}】${d.card.name}（${dir}）\n→ ${d.isUpright ? d.card.upright_meaning : d.card.reversed_meaning}`;
        }).join('\n\n');
        return parts + '\n\n📜 综合解读：\n身心灵的和谐统一是幸福的基础。注意三个层面的平衡——照顾好身体，聆听内心，保持精神的通透。';
      }
    },
    {
      id: 'find-item', name: '寻物塔罗', icon: '🔍', category: '自我探索',
      count: 3, layout: 'horizontal',
      positions: ['物品状态', '寻找方向', '关键线索'],
      desc: '寻找遗失物品，获得方向指引',
      overallTitle: '🔍 寻物指引',
      generateOverall(drawn) {
        const pos = ['物品状态', '寻找方向', '关键线索'];
        const parts = drawn.map((d, i) => {
          const dir = d.isUpright ? '正位' : '逆位';
          return `【${pos[i]}】${d.card.name}（${dir}）\n→ ${d.isUpright ? d.card.upright_meaning : d.card.reversed_meaning}`;
        }).join('\n\n');
        return parts + '\n\n📜 寻物提示：\n细心观察牌面关键词及符号，结合日常动线回忆。有时候物品就在你经常忽略的地方——换个角度搜一搜。';
      }
    },

    // === 事业方向 ===
    {
      id: 'career', name: '事业明灯', icon: '⭐', category: '事业方向',
      count: 4, layout: 'grid',
      positions: ['当前状况', '挑战', '机遇', '未来建议'],
      desc: '工作事业方向，洞察机遇与挑战',
      overallTitle: '⭐ 事业明灯解读',
      generateOverall(drawn) {
        const pos = ['当前状况', '挑战', '机遇', '未来建议'];
        const parts = drawn.map((d, i) => {
          const dir = d.isUpright ? '正位' : '逆位';
          return `【${pos[i]}】${d.card.name}（${dir}）\n→ ${d.isUpright ? d.card.upright_meaning : d.card.reversed_meaning}`;
        }).join('\n\n');
        return parts + '\n\n📜 综合解读：\n事业之路起起伏伏，挑战与机遇并存。清晰地看到当前立足点，把握未来的方向，稳健前行。';
      }
    },

    // === 情感关系 ===
    {
      id: 'lover-pyramid', name: '恋人金字塔', icon: '💑', category: '情感关系',
      count: 4, layout: 'triangle',
      // [0]上=自己 [1]左下=对方 [2]下中=关系基础 [3]右下=发展前景
      positions: ['自己', '对方', '关系基础', '发展前景'],
      desc: '感情关系分析，看清彼此与未来',
      overallTitle: '💑 恋人金字塔解读',
      generateOverall(drawn) {
        const pos = ['自己', '对方', '关系基础', '发展前景'];
        const parts = drawn.map((d, i) => {
          const dir = d.isUpright ? '正位' : '逆位';
          return `【${pos[i]}】${d.card.name}（${dir}）\n→ ${d.isUpright ? d.card.upright_meaning : d.card.reversed_meaning}`;
        }).join('\n\n');
        return parts + '\n\n📜 综合解读：\n感情需要双方的投入和理解。看清楚自己与对方的状态，稳固关系基础，未来的前景自然明朗。';
      }
    },
    {
      id: 'lover-cross', name: '恋人十字', icon: '💕', category: '情感关系',
      count: 5, layout: 'cross',
      // [0]上=自己的想法 [1]下=对方的想法 [2]左=关系现状 [3]右=阻碍 [4]中=未来
      positions: ['自己的想法', '对方的想法', '关系现状', '阻碍', '未来'],
      desc: '感情关系深度解读，十字牌阵全面剖析',
      overallTitle: '💕 恋人十字解读',
      generateOverall(drawn) {
        const pos = ['自己的想法', '对方的想法', '关系现状', '阻碍', '未来'];
        const parts = drawn.map((d, i) => {
          const dir = d.isUpright ? '正位' : '逆位';
          return `【${pos[i]}】${d.card.name}（${dir}）\n→ ${d.isUpright ? d.card.upright_meaning : d.card.reversed_meaning}`;
        }).join('\n\n');
        return parts + '\n\n📜 综合解读：\n十字牌阵从五个维度揭示了感情关系的全貌。阻碍并非不可逾越，它往往是让关系更深刻的契机。用爱与理解面对一切。';
      }
    }
  ];

  // ==================== DOM 引用 ====================
  const $ = (sel) => document.querySelector(sel);
  const coverPage = $('#coverPage');
  const spreadGrid = $('#spreadGrid');
  const drawPage = $('#drawPage');
  const drawTitle = $('#drawTitle');
  const cardsContainer = $('#cardsContainer');
  const positionsRow = $('#positionsRow');
  const btnRevealAll = $('#btnRevealAll');
  const btnRedraw = $('#btnRedraw');
  const btnBack = $('#btnBack');
  const readingModal = $('#readingModal');
  const modalTitleEl = $('#modalTitle');
  const modalTags = $('#modalTags');
  const modalSymbol = $('#modalSymbol');
  const modalMeaning = $('#modalMeaning');
  const modalDescription = $('#modalDescription');
  const btnCloseModal = $('#btnCloseModal');
  const modalOverlay = readingModal.querySelector('.modal-overlay');
  const overallPanel = $('#overallPanel');
  const overallTitleEl = $('#overallTitle');
  const overallText = $('#overallText');
  const btnCloseOverall = $('#btnCloseOverall');
  const starsCanvas = $('#starsCanvas');

  // ==================== 状态 ====================
  let currentSpread = null;
  let drawnCards = [];
  let flippedCount = 0;

  // ==================== 星空背景 ====================
  function initStars() {
    const ctx = starsCanvas.getContext('2d');
    let stars = [];
    function resize() {
      starsCanvas.width = window.innerWidth;
      starsCanvas.height = window.innerHeight;
    }
    function createStars() {
      const count = Math.floor((starsCanvas.width * starsCanvas.height) / 2000);
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * starsCanvas.width,
          y: Math.random() * starsCanvas.height,
          r: Math.random() * 1.5 + 0.3,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
      for (const star of stars) {
        star.twinkle += star.twinkleSpeed;
        const alpha = 0.3 + Math.sin(star.twinkle) * 0.35 + 0.35;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 180, 255, ${alpha.toFixed(2)})`;
        ctx.fill();
      }
      const bigStarPhase = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
      if (bigStarPhase > 0.85) {
        const idx = Math.floor(Math.random() * stars.length);
        const s = stars[idx];
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220, 200, 255, 0.7)'; ctx.fill();
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180, 140, 255, 0.15)'; ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    resize(); createStars(); draw();
    window.addEventListener('resize', () => { resize(); createStars(); });
  }

  // ==================== 构建牌阵选择网格 ====================
  function buildSpreadGrid() {
    const categories = {};
    SPREADS.forEach(s => {
      if (!categories[s.category]) categories[s.category] = [];
      categories[s.category].push(s);
    });
    let html = '';
    for (const [cat, spreads] of Object.entries(categories)) {
      html += `<div class="spread-category">
        <h3 class="spread-category-title">📌 ${cat}</h3>
        <div class="spread-cards">`;
      spreads.forEach(s => {
        html += `
          <div class="spread-card" data-spread-id="${s.id}">
            <div class="spread-card-icon">${s.icon}</div>
            <div class="spread-card-name">${s.name}</div>
            <div class="spread-card-count">🃏 ${s.count} 张牌</div>
            <div class="spread-card-desc">${s.desc}</div>
          </div>`;
      });
      html += `</div></div>`;
    }
    spreadGrid.innerHTML = html;
    spreadGrid.querySelectorAll('.spread-card').forEach(card => {
      card.addEventListener('click', () => {
        startDivination(card.getAttribute('data-spread-id'));
      });
    });
  }

  // ==================== 洗牌 ====================
  function shuffleDeck() {
    const deck = [...TAROT_DECK];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  // ==================== 抽牌 ====================
  function drawCards(count) {
    const shuffled = shuffleDeck();
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push({ card: shuffled[i], isUpright: Math.random() >= 0.5 });
    }
    return result;
  }

  // ==================== 构建牌面 HTML ====================
  function getCardFrontHTML(card, isUpright) {
    const meaning = isUpright ? card.upright_meaning : card.reversed_meaning;
    const directionClass = isUpright ? 'upright' : 'reversed';
    const directionLabel = isUpright ? '✨ 正位' : '🔄 逆位';
    let suitLine = '';
    if (card.type === 'major') {
      suitLine = '<span class="card-suit">🌟 大阿尔卡纳</span>';
    } else {
      const suitName = SUIT_NAMES[card.suit] || card.suit;
      const suitEmoji = SUIT_EMOJIS[card.suit] || '';
      suitLine = `<span class="card-suit">${suitEmoji} 小阿尔卡纳 · ${suitName} ${card.rank}</span>`;
    }
    return `
      <div class="card-name">${card.name}</div>
      <div class="card-name" style="font-size:0.65em;color:#8b6f4e;">${card.nameEn}</div>
      ${suitLine}
      <span class="card-direction ${directionClass}">${directionLabel}</span>
      <p class="card-meaning">${meaning}</p>
    `;
  }

  // ==================== 创建一张牌的 DOM ====================
  function createCardWrapper(draw, index) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-wrapper';
    wrapper.setAttribute('data-index', index);
    wrapper.innerHTML = `
      <div class="card-inner" data-card="${draw.card.id}">
        <div class="card-face card-back">
          <div class="card-back-pattern">
            <div class="card-back-symbol">🔮</div>
          </div>
          <span class="card-hint">点击翻开</span>
        </div>
        <div class="card-face card-front">
          ${getCardFrontHTML(draw.card, draw.isUpright)}
        </div>
      </div>
    `;

    // 统一点击逻辑：未翻→翻，已翻→弹解读
    wrapper.addEventListener('click', () => {
      const inner = wrapper.querySelector('.card-inner');
      if (inner.classList.contains('flipped')) {
        showCardReading(index);
      } else {
        flipCard(wrapper, index);
      }
    });

    return wrapper;
  }

  // ==================== 渲染牌卡（按布局） ====================
  function renderCards() {
    cardsContainer.innerHTML = '';
    const spread = currentSpread;
    const layout = spread.layout;
    drawnCards.forEach((draw, index) => {
      draw.cardWrapperEl = createCardWrapper(draw, index);
    });

    if (layout === 'single') {
      // 单张居中
      cardsContainer.className = 'cards-container layout-single';
      const outer = document.createElement('div');
      outer.className = 'layout-single-wrap';
      outer.appendChild(drawnCards[0].cardWrapperEl);
      cardsContainer.appendChild(outer);
    } else if (layout === 'horizontal') {
      // 横向直线
      cardsContainer.className = 'cards-container layout-horizontal';
      drawnCards.forEach(d => cardsContainer.appendChild(d.cardWrapperEl));
    } else if (layout === 'grid') {
      // 2×2 网格 [0]左上 [1]右上 [2]左下 [3]右下
      cardsContainer.className = 'cards-container layout-grid';
      const grid = document.createElement('div');
      grid.className = 'layout-grid-inner';
      for (let i = 0; i < 4; i++) {
        const cell = document.createElement('div');
        cell.className = `grid-cell grid-cell-${i}`;
        cell.appendChild(drawnCards[i].cardWrapperEl);
        grid.appendChild(cell);
      }
      cardsContainer.appendChild(grid);
    } else if (layout === 'triangle') {
      // 倒三角 [0]上 [1]左下 [2]下中 [3]右下
      cardsContainer.className = 'cards-container layout-triangle';
      const tri = document.createElement('div');
      tri.className = 'layout-triangle-inner';
      // 顶行
      const topRow = document.createElement('div');
      topRow.className = 'tri-row tri-row-top';
      topRow.appendChild(drawnCards[0].cardWrapperEl);
      tri.appendChild(topRow);
      // 底行
      const botRow = document.createElement('div');
      botRow.className = 'tri-row tri-row-bot';
      botRow.appendChild(drawnCards[1].cardWrapperEl);
      botRow.appendChild(drawnCards[2].cardWrapperEl);
      botRow.appendChild(drawnCards[3].cardWrapperEl);
      tri.appendChild(botRow);
      cardsContainer.appendChild(tri);
    } else if (layout === 'v-shape') {
      // V字形 [0]底中 [1]左上 [2]右上 [3]左中 [4]右中
      cardsContainer.className = 'cards-container layout-vshape';
      const v = document.createElement('div');
      v.className = 'layout-vshape-inner';
      // 顶行：A发展 + 空隙 + B发展
      const rowTop = document.createElement('div');
      rowTop.className = 'v-row v-row-top';
      const colL = document.createElement('div'); colL.className = 'v-col v-col-left'; colL.appendChild(drawnCards[1].cardWrapperEl);
      const colR = document.createElement('div'); colR.className = 'v-col v-col-right'; colR.appendChild(drawnCards[2].cardWrapperEl);
      rowTop.appendChild(colL); rowTop.appendChild(colR);
      v.appendChild(rowTop);
      // 中行：A结果 + 空隙 + B结果
      const rowMid = document.createElement('div');
      rowMid.className = 'v-row v-row-mid';
      const colL2 = document.createElement('div'); colL2.className = 'v-col v-col-left'; colL2.appendChild(drawnCards[3].cardWrapperEl);
      const colR2 = document.createElement('div'); colR2.className = 'v-col v-col-right'; colR2.appendChild(drawnCards[4].cardWrapperEl);
      rowMid.appendChild(colL2); rowMid.appendChild(colR2);
      v.appendChild(rowMid);
      // 底行：现状居中
      const rowBot = document.createElement('div');
      rowBot.className = 'v-row v-row-bot';
      rowBot.appendChild(drawnCards[0].cardWrapperEl);
      v.appendChild(rowBot);
      cardsContainer.appendChild(v);
    } else if (layout === 'cross') {
      // 十字形 [0]上 [1]下 [2]左 [3]右 [4]中
      cardsContainer.className = 'cards-container layout-cross';
      const cross = document.createElement('div');
      cross.className = 'layout-cross-inner';
      // 顶
      const cTop = document.createElement('div'); cTop.className = 'cross-slot cross-top';
      cTop.appendChild(drawnCards[0].cardWrapperEl); cross.appendChild(cTop);
      // 中行：左 + 中 + 右
      const cMid = document.createElement('div'); cMid.className = 'cross-row';
      const cLeft = document.createElement('div'); cLeft.className = 'cross-slot cross-left';
      cLeft.appendChild(drawnCards[2].cardWrapperEl);
      const cCenter = document.createElement('div'); cCenter.className = 'cross-slot cross-center';
      cCenter.appendChild(drawnCards[4].cardWrapperEl);
      const cRight = document.createElement('div'); cRight.className = 'cross-slot cross-right';
      cRight.appendChild(drawnCards[3].cardWrapperEl);
      cMid.appendChild(cLeft); cMid.appendChild(cCenter); cMid.appendChild(cRight);
      cross.appendChild(cMid);
      // 底
      const cBot = document.createElement('div'); cBot.className = 'cross-slot cross-bottom';
      cBot.appendChild(drawnCards[1].cardWrapperEl); cross.appendChild(cBot);
      cardsContainer.appendChild(cross);
    }

    // 位置标签
    positionsRow.innerHTML = spread.positions
      .map((p, i) => `<span class="position-tag">${i + 1}️⃣ ${p}</span>`)
      .join('');

    flippedCount = 0;
    overallPanel.classList.remove('active');
    drawTitle.textContent = `${spread.icon} ${spread.name}`;
  }

  // ==================== 翻转单张牌（不自动弹窗） ====================
  function flipCard(wrapper, index) {
    const inner = wrapper.querySelector('.card-inner');
    if (inner.classList.contains('flipped')) return;
    inner.classList.add('flipped');
    flippedCount++;

    // 更新牌背提示文字
    const hint = wrapper.querySelector('.card-hint');
    if (hint) hint.textContent = '点击查看解读';

    if (flippedCount === currentSpread.count) {
      setTimeout(() => showOverallReading(), 800);
      drawTitle.textContent = '✨ 全部已翻开（点击牌面查看解读）';
    }
  }

  // ==================== 全部翻开 ====================
  function revealAll() {
    const wrappers = cardsContainer.querySelectorAll('.card-wrapper');
    wrappers.forEach((wrapper, index) => {
      const inner = wrapper.querySelector('.card-inner');
      if (!inner.classList.contains('flipped')) {
        setTimeout(() => {
          inner.classList.add('flipped');
          const hint = wrapper.querySelector('.card-hint');
          if (hint) hint.textContent = '点击查看解读';
        }, index * 300);
      }
    });
    flippedCount = currentSpread.count;
    setTimeout(() => showOverallReading(), currentSpread.count * 300 + 600);
    drawTitle.textContent = '✨ 全部已翻开（点击牌面查看解读）';
  }

  // ==================== 显示单张牌解读弹窗 ====================
  function showCardReading(index) {
    const draw = drawnCards[index];
    const card = draw.card;
    const isUpright = draw.isUpright;
    const position = currentSpread.positions[index] || `牌 ${index + 1}`;
    modalTitleEl.textContent = `${position} — ${card.name}`;
    modalSymbol.textContent = card.symbol;
    modalMeaning.innerHTML = `
      <strong>${isUpright ? '✨ 正位' : '🔄 逆位'}</strong>: ${isUpright ? card.upright_meaning : card.reversed_meaning}
    `;
    modalDescription.textContent = card.description;
    modalTags.innerHTML = card.keywords.map(k => `<span class="tag">${k}</span>`).join('');
    readingModal.classList.add('active');
  }

  // ==================== 关闭弹窗 ====================
  function closeModal() {
    readingModal.classList.remove('active');
  }

  // ==================== 整体解读 ====================
  function showOverallReading() {
    overallTitleEl.textContent = currentSpread.overallTitle || '📜 整体解读';
    overallText.textContent = currentSpread.generateOverall(drawnCards);
    overallPanel.classList.add('active');
  }

  // ==================== 开始占卜 ====================
  function startDivination(spreadId) {
    const spread = SPREADS.find(s => s.id === spreadId);
    if (!spread) return;
    currentSpread = spread;
    drawnCards = drawCards(spread.count);
    flippedCount = 0;
    coverPage.classList.remove('active');
    drawPage.classList.add('active');
    renderCards();
  }

  // ==================== 重新抽牌 ====================
  function redraw() {
    if (!currentSpread) return;
    drawnCards = drawCards(currentSpread.count);
    flippedCount = 0;
    overallPanel.classList.remove('active');
    renderCards();
  }

  // ==================== 返回选择 ====================
  function goBack() {
    drawPage.classList.remove('active');
    overallPanel.classList.remove('active');
    coverPage.classList.add('active');
    currentSpread = null;
    drawnCards = [];
  }

  // ==================== 事件绑定 ====================
  btnRevealAll.addEventListener('click', revealAll);
  btnRedraw.addEventListener('click', redraw);
  btnBack.addEventListener('click', goBack);
  btnCloseModal.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);
  btnCloseOverall.addEventListener('click', () => overallPanel.classList.remove('active'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // ==================== 初始化 ====================
  initStars();
  buildSpreadGrid();
  console.log('🔮 韦特塔罗占卜 V3 就绪！');
  console.log(`已加载 ${TAROT_DECK.length} 张牌，支持 ${SPREADS.length} 种牌阵`);
})();