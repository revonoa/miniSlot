(() => {
    const SYMBOLS = [
        { icon: '🍒', weight: 40, payout3: 60, payout2: 8 },
        { icon: '🍋', weight: 35, payout3: 40, payout2: 6 },
        { icon: '🔔', weight: 18, payout3: 120, payout2: 15 },
        { icon: '⭐', weight: 6, payout3: 300, payout2: 40 },
        { icon: '💎', weight: 3, payout3: 1500, payout2: 120 },
    ];

    let coins = 0;
    let isSpinning = false;
    let clickCooldown = false;

    const coinCountEl = document.getElementById('coinCount');
    const mineBtn = document.getElementById('mineBtn');
    const spinBtn = document.getElementById('spinBtn');
    const reelEls = [1, 2, 3].map(i => document.getElementById(`reel${i}`));
    const payoutMsgEl = document.getElementById('payoutMsg');
    const historyList = document.getElementById('historyList');
    const betSel = document.getElementById('bet');

    function loadCoins() {
        const saved = localStorage.getItem('slotmini_coins');
        coins = Number.isFinite(+saved) ? Math.max(0, Math.floor(+saved)) : 0; // ← floor 추가
        renderCoins();
    }

    function saveCoins() {
        localStorage.setItem('slotmini_coins', String(coins));
    }
    function renderCoins() {
        coinCountEl.textContent = coins;
        updateSpinBtn();
    }

    function updateSpinBtn() {
        const cost = getBet();
        spinBtn.disabled = isSpinning || coins < cost;
    }
    function getBet() { return Math.max(1, +betSel.value || 10); }

    function randomSymbol() {
        const total = SYMBOLS.reduce((s, x) => s + x.weight, 0);
        let r = Math.random() * total;
        for (const s of SYMBOLS) {
            if ((r -= s.weight) <= 0) return s;
        }
        return SYMBOLS[SYMBOLS.length - 1];
    }

    function animateReel(el, durationMs) {
        el.classList.add('spin');
        const t0 = performance.now();
        let rafId = 0;
        function frame(t) {
            if (t - t0 < durationMs) {
                if ((t | 0) % 60 === 0) {
                    el.textContent = SYMBOLS[(Math.random() * SYMBOLS.length) | 0].icon;
                }
                rafId = requestAnimationFrame(frame);
            } else {
                el.classList.remove('spin');
            }
        }
        rafId = requestAnimationFrame(frame);
        return new Promise(resolve => setTimeout(resolve, durationMs));
    }

    function settleResult(s1, s2, s3, cost) {
        const a = s1.icon, b = s2.icon, c = s3.icon;
        let payout = 0;
        let text = '';

        const symEq = (x, y) => x === y;

        const scale = cost / 10;
        if (symEq(a, b) && symEq(b, c)) {
            payout = Math.floor(s1.payout3 * scale);
            text = `🎉 3개 일치! ${a}${b}${c} x3 → +${payout}`;
        } else if (symEq(a, b) || symEq(a, c) || symEq(b, c)) {
            const two = symEq(a, b) ? s1 : symEq(a, c) ? s1 : s2;
            payout = Math.floor(two.payout2 * scale);
            text = `2개 일치 → +${payout}`;
        } else {
            text = `꽝! -${cost}`;
        }

        coins += payout;
        renderCoins();
        payoutMsgEl.textContent = text;

        const item = document.createElement('li');
        item.textContent = `[베팅 ${cost}] 결과: ${a} | ${b} | ${c} → ${text}`;
        historyList.prepend(item);
        while (historyList.children.length > 50) historyList.removeChild(historyList.lastChild);
        saveCoins();
    }

    async function spin() {
        if (isSpinning) return;
        const cost = getBet();
        if (coins < cost) return;

        isSpinning = true;
        updateSpinBtn();
        payoutMsgEl.textContent = '';

        coins -= cost;
        renderCoins();

        const d1 = 1200, d2 = 1450, d3 = 1700;
        await Promise.all([
            animateReel(reelEls[0], d1),
            animateReel(reelEls[1], d2),
            animateReel(reelEls[2], d3),
        ]);

        const s1 = randomSymbol();
        const s2 = randomSymbol();
        const s3 = randomSymbol();
        reelEls[0].textContent = s1.icon;
        reelEls[1].textContent = s2.icon;
        reelEls[2].textContent = s3.icon;

        settleResult(s1, s2, s3, cost);
        isSpinning = false;
        updateSpinBtn();
    }

    function mineCoin() {
        if (clickCooldown) return;
        clickCooldown = true;
        coins += 1;
        renderCoins();
        saveCoins();
        setTimeout(() => { clickCooldown = false; }, 120);
    }

    mineBtn.addEventListener('click', mineCoin, { passive: true });
    spinBtn.addEventListener('click', spin);
    betSel.addEventListener('change', updateSpinBtn);

    loadCoins();
    if (coins === 0 && !localStorage.getItem('slotmini_boot')) {
        coins = 25;
        localStorage.setItem('slotmini_boot', '1');
        renderCoins();
        saveCoins();
    }
})();
