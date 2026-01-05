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
    document.getElementById('p1-graveyard').innerText = my.graveCount;
    document.getElementById('p2-graveyard').innerText = opp.graveCount;
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
        cEl.className = `card ${c.civilization?.toLowerCase() || ''} ${c.isTapped ? 'tapped' : ''} ${!isFace ? 'facedown' : ''}`;

        if (isFace && c.name) {
            cEl.innerHTML = `
                <div class="card-name">${c.name}</div>
                ${c.race ? `<div class="card-race" style="font-size: 8px; color: rgba(255,255,255,0.7); margin-top: 2px;">${c.race}</div>` : ''}
                <div style="position:absolute;bottom:5px;right:5px;font-size:12px;">${c.power || ''}</div>
            `;
            const costBadge = document.createElement('div');
            costBadge.className = 'card-cost';
            costBadge.innerText = c.cost !== undefined ? c.cost : '?';
            if (c.isTapped) costBadge.style.transform = "rotate(-90deg)";
            cEl.appendChild(costBadge);

            if (id.includes('mana-zone') || id.includes('battle-zone')) {
                cEl.onclick = (e) => {
                    e.stopPropagation();
                    const zoneType = id.includes('mana') ? 'manaZone' : 'battleZone';
                    socket.emit('toggleTap', { playerName: localName, zone: zoneType, index: i });
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
const menuDraw = document.getElementById('menu-draw');
const menuBoost = document.getElementById('menu-boost');
const menuToBattlezone = document.getElementById('menu-to-battlezone');
const menuToGraveyard = document.getElementById('menu-to-graveyard');
const menuViewTop = document.getElementById('menu-view-top');
const menuSearch = document.getElementById('menu-search');

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

function hideMenu() {
    deckContextMenu.style.display = 'none';
}

// デッキにマウスが入ったらメニュー表示
p1DeckDisp.addEventListener('mouseenter', showDeckMenu);
// デッキからマウスが出たらタイマー開始（メニューが非表示になるまで）
p1DeckDisp.addEventListener('mouseleave', startHideTimer);
// メニューにマウスが入ったらタイマーをクリア（非表示をキャンセル）
deckContextMenu.addEventListener('mouseenter', clearHideTimer);
// メニューからマウスが出たらメニュー非表示
deckContextMenu.addEventListener('mouseleave', hideMenu);

menuDraw.onclick = () => {
    socket.emit('drawCard', { playerName: localName });
    hideMenu();
};

menuBoost.onclick = () => {
    socket.emit('moveTopCard', { playerName: localName, targetZone: 'manaZone' });
    hideMenu();
};

menuToBattlezone.onclick = () => {
    socket.emit('moveTopCard', { playerName: localName, targetZone: 'battleZone' });
    hideMenu();
};

menuToGraveyard.onclick = () => {
    socket.emit('moveTopCard', { playerName: localName, targetZone: 'graveyard' });
    hideMenu();
};

menuViewTop.onclick = () => {
    hideMenu();
    const numCards = prompt("山札の上から何枚見ますか？ (例: 5)");
    const N = parseInt(numCards, 10);
    if (!isNaN(N) && N > 0) {
        socket.emit('viewTopCards', { playerName: localName, N: N });
    } else if (numCards !== null) {
        alert("有効な数字を入力してください。");
    }
};

menuSearch.onclick = () => {
    hideMenu();
    socket.emit('requestDeckList', { playerName: localName });
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

    const eventName = (source === 'deck' || source === 'deckTop') ? 'moveCardFromDeck' : 'moveCardFromGrave';
    // ユーザー要望: シャッフルしたい
    // ソースがどこであれ、デッキからの移動ならシャッフルする（デフォルトtrue）
    socket.emit(eventName, {
        playerName: localName,
        cardId: id,
        targetZone,
        shouldShuffle: true,
        index: selectedCardInViewer.index // 墓地からの移動にはindexが必要
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

// --- Socket Event Handlers ---
function handleCardListResponse(data) {
    const { cards, source } = data;
    deckContents.innerHTML = '';
    deckViewerModal.style.display = 'flex';
    hideViewerMenu(); // Ensure menu is hidden when list is re-rendered

    if (source === 'deckTop') {
        viewerTitle.innerText = "山札の上部 (TOP OF DECK)";
    } else if (source === 'deck') {
        viewerTitle.innerText = "デッキ検索 (DECK SEARCH)";
    } else if (source === 'grave') {
        viewerTitle.innerText = "墓地 (GRAVEYARD)";
    }

    cards.forEach((card, index) => {
        const d = document.createElement('div');
        d.className = `card ${card.civilization?.toLowerCase()}`;
        d.innerHTML = `<div style="font-size:9px;">${card.name}</div>`;

        d.onclick = (e) => {
            e.stopPropagation();
            selectedCardInViewer = { source, id: card.id, index: index, element: d }; // elementも保存
            const cardRect = d.getBoundingClientRect();
            cardViewerContextMenu.style.left = `${cardRect.right + 5}px`;
            cardViewerContextMenu.style.top = `${cardRect.top}px`;
            cardViewerContextMenu.style.display = 'block';
        };
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
    if (viewerTitle.innerText.includes("DECK SEARCH")) {
        socket.emit('shuffleDeck', { playerName: localName });
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

    if (!card) return;

    nameEl.innerText = card.name;

    // スペック行（コスト・種族・パワーなどを1行に集約）
    let specs = [];
    if (card.cost !== undefined) specs.push(`【${card.cost}】`);
    if (card.civilization) specs.push(card.civilization);
    if (card.race) specs.push(card.race);
    if (card.power) specs.push(`${card.power}`);

    let detailText = specs.join(' / ') + "\n\n";

    // アビリティ部分
    if (card.abilities && card.abilities.length > 0) {
        detailText += card.abilities.join('\n');
    } else {
        detailText += "(特殊能力なし)";
    }

    textEl.innerText = detailText;
    modal.style.display = 'block';
}
function hidePreview() { document.getElementById('preview-modal').style.display = 'none'; }

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