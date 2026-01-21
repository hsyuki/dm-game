import { DeckLists } from './DeckList.js';
const socket = io();
let localName = null;

// UI要素
const mySelect = document.getElementById('my-deck-select');
const readyBtn = document.getElementById('ready-btn');
const deckViewerModal = document.getElementById('deck-viewer-modal');
const deckContents = document.getElementById('deck-contents');
const p1Grave = document.getElementById('p1-graveyard');
const viewerTitle = document.getElementById('viewer-title');

// デッキ選択肢の初期化
Object.keys(DeckLists).forEach(name => {
    mySelect.add(new Option(name, name));
});

// プレイヤー割り当て受信
socket.on('playerAssigned', d => {
    localName = d.name;
    document.getElementById('lobby-msg').innerText = `あなたは ${localName} として接続中`;
});

// --- ロビー関連 ---
readyBtn.onclick = () => {
    const selectedDeck = DeckLists[mySelect.value];
    socket.emit('playerReady', { playerName: localName, deck: selectedDeck });
    readyBtn.disabled = true;
    readyBtn.innerText = "待機中...";
    readyBtn.style.background = "#555";
};

socket.on('readyUpdate', status => {
    const p1Status = document.getElementById('p1-status');
    const p2Status = document.getElementById('p2-status');
    p1Status.innerText = status.Player1 ? "READY" : "WAITING...";
    p1Status.style.color = status.Player1 ? "#2ed573" : "#ff4757";
    p2Status.innerText = status.Player2 ? "READY" : "WAITING...";
    p2Status.style.color = status.Player2 ? "#2ed573" : "#ff4757";
});

socket.on('gameStarted', () => {
    document.getElementById('start-modal').style.display = 'none';
});

// --- 描画ロジック ---
socket.on('gameStateUpdate', state => render(state));
socket.on('privateState', d => renderZone('p1-hand-zone', d.hand, true));

// ゲームリセット応答
socket.on('gameReset', () => {
    alert("ゲームが終了しました。ロビーに戻ります。");
    location.reload();
});

// 終了ボタン
document.getElementById('reset-btn').onclick = () => {
    if (confirm("本当にゲームを終了しますか？")) {
        socket.emit('resetGame');
    }
};

function render(state) {
    hidePreview(); // カードが動いたときに詳細ポップアップを消す
    const my = localName === 'Player1' ? state.p1 : state.p2;
    const opp = localName === 'Player1' ? state.p2 : state.p1;

    renderZone('p1-battle-zone', my.battleZone, true);
    renderZone('p1-shield-zone', my.shields, false);
    renderZone('p1-mana-zone', my.manaZone, true);

    renderZone('p2-battle-zone', opp.battleZone, true);
    renderZone('p2-shield-zone', opp.shields, false);
    renderZone('p2-mana-zone', opp.manaZone, true);
    renderZone('p2-hand-zone', Array(opp.handCount).fill({}), false);

    document.getElementById('p1-deck-disp').innerText = my.deckCount;
    document.getElementById('p2-deck-disp').innerText = opp.deckCount;

    // 墓地の描画更新
    renderGraveyard('p1-graveyard', my.graveyard);
    renderGraveyard('p2-graveyard', opp.graveyard);
}

function renderGraveyard(elementId, cards) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = '';

    // 墓地名表示
    const title = document.createElement('div');
    title.innerText = "GRAVEYARD";
    title.style.fontSize = "10px";
    title.style.color = "#aaa";
    title.style.position = "absolute";
    title.style.top = "-15px";
    title.style.width = "100%";
    title.style.textAlign = "center";
    el.appendChild(title);

    if (!cards || cards.length === 0) {
        el.innerHTML += `<div style="font-size:12px; color:#666;">0</div>`;
        return;
    }

    // 一番上のカード
    const topCard = cards[cards.length - 1];

    // カード描画
    const d = document.createElement('div');
    d.className = `card ${topCard.isTapped ? 'tapped' : ''}`;
    // 墓地なので少し小さく表示するか、そのままか。zone内なのでCSSで縮小されるかも確認。
    // CSS調整なしで一旦そのまま出す。

    let imgHtml = '';
    if (topCard.imgUrl) {
        // 画像がある場合は画像のみ
        d.classList.add('has-image');
        d.innerHTML = `<img src="${topCard.imgUrl}" class="card-image" alt="${topCard.name}">`;
    } else {
        // 画像がない場合はテキスト情報
        d.innerHTML = `
            <div class="card-name ${topCard.name && topCard.name.length >= 8 ? 'small-text' : ''}" style="font-size:9px;">${topCard.name}</div>
        `;
    }

    // クリックで一覧表示イベント (既存のonclick機能はindex.html等で定義されている？ -> main.jsのグローバルにはない。index.htmlのonclick属性か？)
    // 既存のHTMLでは `onclick="socket.emit('requestGraveList', ...)"` だった。
    // JSで中身を書き換えてしまうとそれが消えるので、ここで再設定が必要。
    const pName = elementId.includes('p1') ? 'Player1' : 'Player2';
    // 自分か相手か判定が必要。render関数内の my/opp ロジックと合わせる必要があるが、
    // ここでは elementId から推測するよりも、単純にクリックハンドラをつける。
    // ただし localName との照合が面倒なので、socket送信時に解決させる。
    // 実は p1-graveyard は常に「自分」か「相手」かは main.js の render 内で決まっている。
    // elementId = 'p1-graveyard' なら Player1の墓地。

    d.onclick = (e) => {
        e.stopPropagation();
        // 墓地リストリクエスト
        // 誰の墓地か？
        // 既存ロジック： p1-graveyard は常に Player1 の墓地、ではない。
        // render関数で: const my = localName === 'Player1' ? state.p1 : state.p2;
        // p1-graveyard には my.graveyard を入れている。
        // つまり p1-graveyard は常に「自分」の墓地。
        // p2-graveyard は常に「相手」の墓地。

        // サーバーへのリクエストには playerName が必要。
        const targetPlayer = elementId === 'p1-graveyard' ? localName : (localName === 'Player1' ? 'Player2' : 'Player1');
        socket.emit('requestGraveList', { playerName: targetPlayer, requestingPlayerName: localName });
    };

    // プレビュー
    d.onmouseenter = () => showPreview(topCard);
    d.onmouseleave = () => hidePreview();

    // 枚数バッジ
    const countBadge = document.createElement('div');
    countBadge.className = 'grave-count-badge';
    countBadge.innerText = cards.length;
    countBadge.style.position = "absolute";
    countBadge.style.bottom = "5px";
    countBadge.style.right = "5px";
    countBadge.style.background = "rgba(0,0,0,0.7)";
    countBadge.style.color = "white";
    countBadge.style.padding = "2px 6px";
    countBadge.style.borderRadius = "10px";
    countBadge.style.fontSize = "12px";
    countBadge.style.fontWeight = "bold";
    countBadge.style.zIndex = "10";
    countBadge.style.pointerEvents = "none";

    el.appendChild(d);
    el.appendChild(countBadge);
}

function renderZone(id, cards, isFace) {
    const el = document.getElementById(id);
    if (!el) return;

    el.innerHTML = ''; // ゾーンを空にする

    const title = document.createElement('span');
    title.className = 'zone-title';
    title.innerText = id.split('-')[1].toUpperCase().replace('ZONE', '');
    el.appendChild(title);

    cards.forEach((c, i) => {
        const cEl = document.createElement('div');
        cEl.className = `card ${c.isTapped ? 'tapped' : ''} ${!isFace ? 'facedown' : ''} ${c.evolvesFrom ? 'evolved' : ''}`;

        if (isFace && c.name) {
            if (c.imgUrl) {
                // 画像がある場: 画像のみ表示（テキスト情報は生成しない）
                cEl.classList.add('has-image');
                cEl.innerHTML = `<img src="${c.imgUrl}" class="card-image" alt="${c.name}">`;
                // コストバッジも画像にあると仮定して非表示（必要なら復活させる）
            } else {
                // 画像がない場合: テキスト情報を表示
                cEl.innerHTML = `
                    <div class="card-name ${c.name.length >= 8 ? 'small-text' : ''}" style="font-size:10px;">${c.name}</div>
                `;
            }

            if (id.includes('mana-zone') || id.includes('battle-zone')) {
                cEl.onclick = (e) => {
                    e.stopPropagation();
                    const zoneType = id.includes('mana') ? 'manaZone' : 'battleZone';

                    // 自分自身のカードのみタップ可能（自分のカードは常に p1- エリアに表示される）
                    if (id.startsWith('p1-')) {
                        socket.emit('toggleTap', { playerName: localName, zone: zoneType, index: i });
                    }
                };
            }
            cEl.onmouseenter = () => showPreview(c);
            cEl.onmouseleave = () => hidePreview();
        }

        // --- カード単体（進化用）のドラッグ＆ドロップ ---
        cEl.draggable = id.includes('p1');
        cEl.addEventListener('dragstart', (e) => {
            console.log(`Dragstart: index=${i}, source=${id}`); // ADDED LOG
            e.dataTransfer.setData('text', JSON.stringify({ index: i, source: id }));
        });

        cEl.addEventListener('dragover', (e) => {
            if (id.includes('battle-zone')) {
                e.preventDefault();
                cEl.style.outline = "3px solid #f1c40f";
            }
        });

        cEl.addEventListener('dragleave', () => { cEl.style.outline = ""; });

        cEl.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            cEl.style.outline = "";

            try {
                const data = JSON.parse(e.dataTransfer.getData('text'));
                socket.emit('evolveCard', {
                    playerName: localName,
                    source: data.source,
                    sourceIndex: data.index,
                    targetZone: id,
                    targetIndex: i
                });
            } catch (err) { console.error("Drop error:", err); }
        });

        if (id.includes('shield-zone')) {
            const numBadge = document.createElement('div');
            numBadge.className = 'shield-number';
            const sNum = c.shieldNum || (i + 1);
            numBadge.innerText = sNum;
            cEl.appendChild(numBadge);
        }

        el.appendChild(cEl);
    });
} // <-- Closing renderZone

// --- 山札・サーチ関連 ---
const p1DeckDisp = document.getElementById('p1-deck-disp');
const deckContextMenu = document.getElementById('deck-context-menu');
const menuDraw = document.getElementById('deck-menu-draw');
const menuBoost = document.getElementById('deck-menu-boost');
const menuToBattlezone = document.getElementById('deck-menu-to-battlezone');
const menuToGraveyard = document.getElementById('deck-menu-to-graveyard');
const menuViewTop = document.getElementById('deck-menu-view-top');
const menuViewTopPublic = document.getElementById('deck-menu-view-top-public');
const menuSearch = document.getElementById('deck-menu-search');

let hideTimeout;

function showDeckMenu() {
    clearTimeout(hideTimeout);
    const deckRect = p1DeckDisp.getBoundingClientRect(); // デッキ要素の位置とサイズを取得
    deckContextMenu.style.display = 'block'; // 先に表示してサイズを取得
    const menuWidth = deckContextMenu.offsetWidth;
    deckContextMenu.style.left = `${deckRect.left - menuWidth - 10}px`; // デッキの左側に10px空けて表示
    deckContextMenu.style.top = `${deckRect.top}px`;
}

function startHideTimer() {
    hideTimeout = setTimeout(() => {
        deckContextMenu.style.display = 'none';
    }, 300); // 300msの遅延
}

function clearHideTimer() {
    clearTimeout(hideTimeout);
}

function hideDeckMenu() {
    deckContextMenu.style.display = 'none';
}

// デッキにマウスが入ったらメニュー表示
p1DeckDisp.addEventListener('mouseenter', showDeckMenu);
// デッキからマウスが出たらタイマー開始（メニューが非表示になるまで）
p1DeckDisp.addEventListener('mouseleave', startHideTimer);
// メニューにマウスが入ったらタイマーをクリア（非表示をキャンセル）
deckContextMenu.addEventListener('mouseenter', clearHideTimer);
// メニューからマウスが出たらメニュー非表示
deckContextMenu.addEventListener('mouseleave', hideDeckMenu);

menuDraw.onclick = () => {
    socket.emit('drawCard', { playerName: localName });
    hideDeckMenu();
};

menuBoost.onclick = () => {
    socket.emit('moveTopCard', { playerName: localName, targetZone: 'manaZone' });
    hideDeckMenu();
};

menuToBattlezone.onclick = () => {
    socket.emit('moveTopCard', { playerName: localName, targetZone: 'battleZone' });
    hideDeckMenu();
};

menuToGraveyard.onclick = () => {
    socket.emit('moveTopCard', { playerName: localName, targetZone: 'graveyard' });
    hideDeckMenu();
};

menuViewTop.onclick = () => {
    hideDeckMenu();
    const numCards = prompt("山札の上から何枚見ますか？ (例: 5)");
    const N = parseInt(numCards, 10);
    if (!isNaN(N) && N > 0) {
        socket.emit('viewTopCards', { playerName: localName, N: N });
    } else if (numCards !== null) {
        alert("有効な数字を入力してください。");
    }
};

// menuViewTopPublic は上部で宣言済み
menuViewTopPublic.onclick = () => {
    hideDeckMenu(); // hideMenu is aliased to hideDeckMenu in previous steps? No, check hideMenu function.
    // wait, existing code uses hideMenu() but I used hideDeckMenu() in my previous apply.
    // I need to be consistent. Let's use hideDeckMenu() if I introduced it, or hideMenu() if it exists.
    // In the viewed snippet, hideMenu() is defined at line 274.
    // My previous replacement (Step 535) used hideDeckMenu().
    // I should probably stick to hideMenu() or rename it.
    // Let's check if hideDeckMenu exists. It wasn't in the snippet.
    // I will assume hideMenu() is the correct one based on lines 274-276.

    // Actually, looking at Step 535 input, I replaced lines 241-250 and added hideDeckMenu() calls in the onclicks?
    // No, I added default onclicks in Step 535 that called hideDeckMenu().
    // But hideDeckMenu() is NOT defined in the snippet I just viewed (lines 240-330).
    // The snippet shows hideMenu() at line 274.
    // So my previous edit in Step 535 might have introduced ReferenceErrors solely because hideDeckMenu() is undefined!
    // I need to define hideDeckMenu = hideMenu or replace calls.

    // Also, the lint error is about menuViewTopPublic redeclaration.
    // Line 249: const menuViewTopPublic = ...
    // Line 318: const menuViewTopPublic = ...

    // I will remove the redeclaration at 318 and update the onclick.

    const numCards = prompt("【公開】山札の上から何枚表にしますか？ (例: 3)");
    const N = parseInt(numCards, 10);
    if (!isNaN(N) && N > 0) {
        socket.emit('viewTopCards', { playerName: localName, N: N, isPublic: true });
    } else if (numCards !== null) {
        alert("有効な数字を入力してください。");
    }
    hideDeckMenu();
};

menuSearch.onclick = () => {
    socket.emit('viewDeck', { playerName: localName });
    hideDeckMenu();
};

// ドラッグ＆ドロップ操作を削除したので、p1DeckDisp.ondragstartは不要
// p1DeckDisp.ondragstart = ...

p1Grave.onclick = () => {
    viewerTitle.innerText = "GRAVEYARD (墓地)";
    socket.emit('requestGraveList', { playerName: localName });
};

// --- Viewer Context Menu ---
const cardViewerContextMenu = document.getElementById('card-viewer-context-menu');
const viewerMenuHand = document.getElementById('viewer-menu-hand');
const viewerMenuBattlezone = document.getElementById('viewer-menu-battlezone');
const viewerMenuMana = document.getElementById('viewer-menu-mana');
const viewerMenuGraveyard = document.getElementById('viewer-menu-graveyard');
let selectedCardInViewer = null;

function hideViewerMenu() {
    cardViewerContextMenu.style.display = 'none';
}

function moveCardFromViewer(targetZone) {
    if (!selectedCardInViewer) return;
    const { source, id } = selectedCardInViewer; // id を使用

    const eventName = (source === 'deck' || source === 'deckTop' || source === 'opponentDeck') ? 'moveCardFromDeck' : 'moveCardFromGrave';

    // ターゲットプレイヤーとデッキの持ち主を決定
    let targetPlayerName = localName;
    let deckOwnerName = null;

    if (source === 'opponentDeck') {
        deckOwnerName = selectedCardInViewer.ownerName;
        // ユーザー要望: 墓地以外もすべて持ち主へ移動
        targetPlayerName = deckOwnerName;
    }

    // ユーザー要望: シャッフルしたい
    // ソースがどこであれ、デッキからの移動ならシャッフルする（デフォルトtrue）
    socket.emit(eventName, {
        playerName: localName,
        cardId: id,
        targetZone,
        shouldShuffle: true,
        index: selectedCardInViewer.index, // 墓地からの移動にはindexが必要
        deckOwnerName,     // 追加: デッキの持ち主
        targetPlayerName   // 追加: 移動先プレイヤー
    });

    // ユーザー要望: モーダルは勝手に閉じない
    // 代わりに選んだカードを画面から消す（重複選択防止）
    if (selectedCardInViewer && selectedCardInViewer.element) {
        selectedCardInViewer.element.remove();
    }
    selectedCardInViewer = null;

    hideViewerMenu();
}

viewerMenuHand.onclick = () => moveCardFromViewer('hand');
viewerMenuBattlezone.onclick = () => moveCardFromViewer('battleZone');
viewerMenuMana.onclick = () => moveCardFromViewer('manaZone');
viewerMenuGraveyard.onclick = () => moveCardFromViewer('graveyard');

// --- ハンデス機能 (Discard) ---
const viewerMenuDiscard = document.getElementById('viewer-menu-discard');
viewerMenuDiscard.onclick = () => {
    if (selectedCardInViewer) {
        // 相手の手札を見ている場合のみ有効
        if (selectedCardInViewer.source === 'opponentHand') {
            socket.emit('discardAt', {
                requestingPlayerName: localName,
                targetPlayerName: selectedCardInViewer.ownerName, // ownerNameが必要
                index: selectedCardInViewer.index
            });
            // 画面から消す
            if (selectedCardInViewer.element) selectedCardInViewer.element.remove();
            selectedCardInViewer = null;
            hideViewerMenu();
        }
    }
};


// --- 相手の手札メニュー ---
const oppHandMenu = document.getElementById('opponent-hand-context-menu');
const oppMenuRandomDiscard = document.getElementById('opp-menu-random-discard');
const oppMenuViewHand = document.getElementById('opp-menu-view-hand');

// 相手の手札ゾーンをクリックしたときの処理
// ※ render関数内でイベントリスナーを付ける形にするか、グローバルで委譲するか。
// main.jsの既存構造ではrenderZoneで都度innerHTMLクリアしているため、
// renderZone呼び出し後にイベントを付ける必要があるが、
// ここではdelegationを使うか、renderZoneを修正する。
// 簡易的に document全体クリックでターゲットが相手ハンドゾーンなら表示、とする。

// --- 相手の手札メニュー (Hover) ---
let oppHandMenuTimeout;

function setupOpponentHandHover() {
    const oppHandMenu = document.getElementById('opponent-hand-context-menu');
    const zones = document.querySelectorAll('.zone');

    zones.forEach(zone => {
        if (!zone.id.includes('hand-zone')) return;

        zone.addEventListener('mouseenter', (e) => {
            // p1-hand-zone は常に自分、p2-hand-zone は常に相手の手札として描画されているため、
            // p2-hand-zone の場合のみメニューを表示する
            if (zone.id === 'p2-hand-zone') {
                clearTimeout(oppHandMenuTimeout);
                // マウスカーソルの近くに表示
                oppHandMenu.style.left = `${e.pageX}px`;
                oppHandMenu.style.top = `${e.pageY}px`;
                oppHandMenu.style.display = 'block';
            }
        });

        zone.addEventListener('mouseleave', () => {
            oppHandMenuTimeout = setTimeout(() => {
                oppHandMenu.style.display = 'none';
            }, 300); // 少し猶予を持たせる
        });
    });

    // メニュー自体にホバーしたときの処理
    oppHandMenu.addEventListener('mouseenter', () => {
        clearTimeout(oppHandMenuTimeout);
    });

    oppHandMenu.addEventListener('mouseleave', () => {
        oppHandMenu.style.display = 'none';
    });
}

// --- 相手の山札メニュー (Hover) ---
let oppDeckMenuTimeout;

function setupOpponentDeckHover() {
    const oppDeckMenu = document.getElementById('opponent-deck-context-menu');
    // デッキ表示要素は p1-deck-disp, p2-deck-disp の親の .deck-stack またはそれ自体
    // HTML構造を見ると、#p1-deck-stack, #p2-deck-stack がある。
    // id="p1-deck-stack" class="deck-stack"
    const stacks = document.querySelectorAll('.deck-stack');

    stacks.forEach(stack => {
        stack.addEventListener('mouseenter', (e) => {
            // p1-deck-disp は常に自分のデッキ（render関数でそのように描画されている）
            const isMyDeck = stack.id === 'p1-deck-disp';

            if (!isMyDeck) {
                clearTimeout(oppDeckMenuTimeout);
                oppDeckMenu.style.display = 'block';
                const rect = stack.getBoundingClientRect();
                const menuWidth = oppDeckMenu.offsetWidth;
                oppDeckMenu.style.left = `${rect.left - menuWidth - 10}px`;
                oppDeckMenu.style.top = `${rect.top}px`;
            }
        });

        stack.addEventListener('mouseleave', () => {
            oppDeckMenuTimeout = setTimeout(() => {
                oppDeckMenu.style.display = 'none';
            }, 300);
        });
    });

    oppDeckMenu.addEventListener('mouseenter', () => clearTimeout(oppDeckMenuTimeout));
    oppDeckMenu.addEventListener('mouseleave', () => oppDeckMenu.style.display = 'none');
}

// グローバルには setupOpponentHandHover を呼ぶ必要があるが、
// zone要素が動的に生成されるわけではない(index.htmlにある)のでDOMContentLoadedで呼べばよい。
// ただしここではタイミングが不明確なので、socket.on('playerAssigned')の後や
// renderの初回に行いたいところだが、zone自体は静的ならDOMContentLoadedでOK。
document.addEventListener('DOMContentLoaded', () => {
    setupOpponentHandHover();
    setupOpponentDeckHover();
});

const oppMenuViewDeck = document.getElementById('opp-menu-view-deck');
oppMenuViewDeck.onclick = () => {
    const targetPlayerName = localName === 'Player1' ? 'Player2' : 'Player1';
    socket.emit('viewOpponentDeck', { requestingPlayerName: localName, targetPlayerName });
    document.getElementById('opponent-deck-context-menu').style.display = 'none';
};

const oppMenuAllDiscard = document.getElementById('opp-menu-all-discard');
oppMenuAllDiscard.onclick = () => {
    if (confirm("相手の手札を全て捨てさせますか？")) {
        const targetPlayerName = localName === 'Player1' ? 'Player2' : 'Player1';
        socket.emit('discardAll', { targetPlayerName });
        oppHandMenu.style.display = 'none';
    }
};

oppMenuRandomDiscard.onclick = () => {
    // ターゲットプレイヤー名の特定
    const targetPlayerName = localName === 'Player1' ? 'Player2' : 'Player1';
    socket.emit('randomDiscard', { targetPlayerName });
    oppHandMenu.style.display = 'none';
};

oppMenuViewHand.onclick = () => {
    const targetPlayerName = localName === 'Player1' ? 'Player2' : 'Player1';
    socket.emit('viewOpponentHand', { requestingPlayerName: localName, targetPlayerName });
    oppHandMenu.style.display = 'none';
};

// --- Socket Event Handlers ---
function handleCardListResponse(data) {
    const { cards, source, ownerName, isPublicView } = data;
    deckContents.innerHTML = '';
    deckViewerModal.style.display = 'flex';
    hideViewerMenu(); // Ensure menu is hidden when list is re-rendered

    if (source === 'deckTop') {
        viewerTitle.innerText = "山札の上部 (TOP OF DECK)";
    } else if (source === 'deck') {
        viewerTitle.innerText = "山札を見る (VIEW DECK)";
    } else if (source === 'grave') {
        viewerTitle.innerText = "墓地 (GRAVEYARD)";
    } else if (source === 'opponentHand') {
        viewerTitle.innerText = "相手の手札 (OPPONENT HAND)";
    } else if (source === 'opponentDeck') {
        viewerTitle.innerText = "相手の山札 (OPPONENT DECK)";
    }

    // メニューの表示制御
    const discardMenu = document.getElementById('viewer-menu-discard');
    const graveMenu = document.getElementById('viewer-menu-graveyard');
    const handMenu = document.getElementById('viewer-menu-hand');
    const bzMenu = document.getElementById('viewer-menu-battlezone');
    const manaMenu = document.getElementById('viewer-menu-mana');

    if (source === 'opponentHand') {
        discardMenu.style.display = 'block';
        handMenu.style.display = 'none';
        bzMenu.style.display = 'none';
        manaMenu.style.display = 'none';
        graveMenu.style.display = 'none';
    } else {
        discardMenu.style.display = 'none';
        handMenu.style.display = 'block';
        bzMenu.style.display = 'block';
        manaMenu.style.display = 'block';
        // 既に墓地を表示している場合は「墓地に置く」を隠す
        graveMenu.style.display = (source === 'grave') ? 'none' : 'block';
    }

    cards.forEach((card, index) => {
        const d = document.createElement('div');
        d.className = `card ${card.civilization?.toLowerCase()}`;

        let imgHtml = '';
        if (card.imgUrl) {
            imgHtml = `<img src="${card.imgUrl}" class="card-image" alt="${card.name}">`;
            d.classList.add('has-image');
        }

        d.innerHTML = `
            ${imgHtml}
            <div class="card-name ${card.name && card.name.length >= 8 ? 'small-text' : ''}" style="font-size:10px;">${card.name}</div>
            ${card.race ? `<div class="card-race" style="font-size: 7px; color: rgba(255,255,255,0.7); margin-top: 12px; text-align: center; width: 100%;">${card.race}</div>` : ''}
            <div class="card-ability-icons">
                ${card.abilities?.includes('ブロッカー') ? '<div class="blocker-icon" style="width:16px;height:16px;margin-top:4px;"></div>' : ''}
                ${card.abilities?.includes('S・トリガー') ? '<div class="st-icon" style="width:14px;height:14px;margin-top:6px;"></div>' : ''}
            </div>
        `;

        // 公開ビューかつ他人のカードなら操作無効（ただしopponentHandの場合は操作したい＝捨てさせたい）
        // opponentHandの場合は専用の操作になるため、ここではクリック有効にする
        if (isPublicView && ownerName && ownerName !== localName && source !== 'opponentHand' && source !== 'opponentDeck') {
            d.style.cursor = 'default';
            // onclickを設定しない (メニューが出ない)
        } else {
            d.onclick = (e) => {
                e.stopPropagation();
                // ownerNameを保存しておく（Discard時に必要）
                selectedCardInViewer = { source, id: card.id, index: index, element: d, ownerName: ownerName };
                const cardRect = d.getBoundingClientRect();
                cardViewerContextMenu.style.left = `${cardRect.right + 5}px`;
                cardViewerContextMenu.style.top = `${cardRect.top}px`;
                cardViewerContextMenu.style.display = 'block';
            };
        }

        // ホバーでプレビュー表示
        d.onmouseenter = () => showPreview(card);
        d.onmouseleave = () => hidePreview();

        deckContents.appendChild(d);
    });
}

socket.on('cardListResponse', (data) => {
    handleCardListResponse(data);
});

socket.on('topCardsResponse', (data) => {
    // Re-use the main cardListResponse handler
    handleCardListResponse(data);
});

document.getElementById('close-deck-viewer').onclick = () => {
    deckViewerModal.style.display = 'none';
    const titleText = viewerTitle.innerText;
    // 自分自身の山札を見ていた場合のみシャッフル
    if (titleText.includes("VIEW DECK") || titleText.includes("山札を見る")) {
        socket.emit('shuffleDeck', { playerName: localName });
    } else if (titleText.includes("OPPONENT DECK") || titleText.includes("相手の山札")) {
        // 相手の山札を見ていた場合もシャッフル
        const targetPlayer = localName === 'Player1' ? 'Player2' : 'Player1';
        socket.emit('shuffleDeck', { playerName: targetPlayer });
    }
    hideViewerMenu();
};

// --- Global click to hide viewer menu ---
deckViewerModal.addEventListener('click', (e) => {
    // If the click is inside the modal but not on a card that would open the menu
    if (e.target === deckContents || e.target === document.getElementById('viewer-content')) {
        hideViewerMenu();
    }
});
document.getElementById('untap-btn').onclick = () => socket.emit('untapAll', { playerName: localName });

function showPreview(card) {
    const modal = document.getElementById('preview-modal');
    const nameEl = document.getElementById('pre-name');
    const textEl = document.getElementById('pre-text');
    let imgEl = document.getElementById('pre-image');

    if (!card) return;

    // 画像要素がなければ作成
    if (!imgEl) {
        imgEl = document.createElement('img');
        imgEl.id = 'pre-image';
        imgEl.className = 'preview-image';
        modal.appendChild(imgEl);
    }

    if (card.imgUrl) {
        // 画像がある場合は画像を表示し、テキストを隠す
        imgEl.src = card.imgUrl;
        imgEl.style.display = 'block';
        nameEl.style.display = 'none';
        textEl.style.display = 'none';
    } else {
        // 画像がない場合はテキストを表示し、画像を隠す
        imgEl.style.display = 'none';
        nameEl.style.display = 'block';
        textEl.style.display = 'block';

        nameEl.innerText = card.name;
        textEl.innerText = "(詳細データなし)";
    }

    modal.style.display = 'block';
}
function hidePreview() { document.getElementById('preview-modal').style.display = 'none'; }

// マウス追従ロジック
document.addEventListener('mousemove', (e) => {
    const modal = document.getElementById('preview-modal');
    if (modal.style.display === 'block') {
        const offset = 15; // カーソルからの距離
        let left = e.clientX + offset;
        let top = e.clientY + offset;

        // 画面端の調整
        const rect = modal.getBoundingClientRect();
        if (left + rect.width > window.innerWidth) {
            left = e.clientX - rect.width - offset;
        }
        if (top + rect.height > window.innerHeight) {
            top = e.clientY - rect.height - offset;
        }

        modal.style.left = `${left}px`;
        modal.style.top = `${top}px`;
    }
});

// --- グローバルなドラッグ＆ドロップハンドラの設定 ---
function setupGlobalDropHandlers() {
    document.querySelectorAll('.zone, .graveyard').forEach(el => {
        el.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        el.addEventListener('drop', (e) => {
            e.preventDefault();
            // ここが重要：カードの上でドロップされた場合は、上の stopPropagation でここには来ない
            try {
                const data = JSON.parse(e.dataTransfer.getData('text'));
                console.log("Global Drop event data:", data); // ADDED LOG

                // ゾーンIDを内部名にマップするヘルパー関数
                const mapZoneIdToInternalName = (domId) => {
                    if (domId.includes('hand-zone')) return 'hand';
                    if (domId.includes('mana-zone')) return 'manaZone';
                    if (domId.includes('battle-zone')) return 'battleZone';
                    if (domId.includes('shield-zone')) return 'shields';
                    if (domId.includes('graveyard')) return 'graveyard';
                    return null; // Should not happen with valid IDs
                };

                const fromZone = mapZoneIdToInternalName(data.source);
                const toZone = mapZoneIdToInternalName(el.id); // el.idがターゲットゾーンのID
                console.log(`Global Drop fromZone: ${fromZone}, toZone: ${toZone}`); // ADDED LOG

                // 特定のアクション
                if (fromZone === 'hand' && toZone === 'manaZone') {
                    console.log("Emitting chargeMana (global)"); // ADDED LOG
                    socket.emit('chargeMana', { playerName: localName, handIndex: data.index });
                } else if (fromZone === 'hand' && toZone === 'battleZone') {
                    console.log("Emitting summonCreature (global)"); // ADDED LOG
                    socket.emit('summonCreature', { playerName: localName, handIndex: data.index });
                } else if (fromZone === 'shields' && toZone === 'hand') {
                    console.log("Emitting pickUpShield (global)"); // ADDED LOG
                    socket.emit('pickUpShield', { playerName: localName, shieldIndex: data.index });
                } else {
                    // 汎用的な移動 (例: バトルゾーンから墓地、バトルゾーンから手札など)
                    console.log("Emitting moveCard (global)"); // ADDED LOG
                    socket.emit('moveCard', {
                        playerName: localName,
                        fromZone: fromZone,
                        toZone: toZone,
                        index: data.index
                    });
                }
            } catch (err) { console.error("Global Zone drop error:", err); }
        });
    });
}

// ページロード時に一度だけハンドラを設定
document.addEventListener('DOMContentLoaded', setupGlobalDropHandlers);