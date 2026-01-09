class GameManager {
    constructor(p1, p2, io) {
        this.p1 = p1; // Player1のインスタンス
        this.p2 = p2; // Player2のインスタンス
        this.io = io; // Socket.ioのサーバーインスタンス
    }

    // ゲームの初期化と開始
    startGame(d1, d2) {
        if (!this.p1 || !this.p2) return;

        // デッキの設定
        // デッキの設定前にリセット
        [this.p1, this.p2].forEach(p => p.reset());

        this.p1.setDeckList(d1);
        this.p2.setDeckList(d2);

        // 共通の準備（シャッフル、シールド展開、初期ドロー5枚）
        [this.p1, this.p2].forEach(p => {
            p.shuffleDeck();
            p.setInitialShields();
            p.drawCard(5);
        });

        this.emitState();
    }

    // 最新のゲーム状況を全プレイヤーに同期
    emitState() {
        const state = {
            p1: this.p1.getState(),
            p2: this.p2.getState()
        };
        // 全員に全体像を送信
        this.io.emit('gameStateUpdate', state);

        // 各プレイヤーに「自分だけが見える手札」を個別に送信
        this.io.to(this.p1.socketId).emit('privateState', { hand: this.p1.hand });
        this.io.to(this.p2.socketId).emit('privateState', { hand: this.p2.hand });
    }

    // 名前からプレイヤーオブジェクトを探すヘルパー
    findP(name) {
        return name === 'Player1' ? this.p1 : this.p2;
    }

    // --- 基本アクション ---

    drawCard(name) {
        this.findP(name).drawCard(1);
        this.emitState();
    }

    chargeMana(name, index) {
        console.log(`GM: chargeMana called for ${name}, index ${index}`); // ADDED LOG
        const p = this.findP(name);
        if (p && p.hand[index]) { // Check if player and card exist
            console.log(`GM: chargeMana - Player hand has card at index ${index}. Moving...`); // ADDED LOG
            p.moveCardToMana(index);
            this.emitState();
            return true;
        }
        console.log(`GM: chargeMana - Invalid player or index ${index}.`); // ADDED LOG
        return false;
    }

    summonCreature(name, index) {
        console.log(`GM: summonCreature called for ${name}, index ${index}`); // ADDED LOG
        const p = this.findP(name);
        if (p && p.hand[index]) { // Check if player and card exist
            console.log(`GM: summonCreature - Player hand has card at index ${index}. Summoning...`); // ADDED LOG
            p.moveCardToBattleZone(index);
            this.emitState();
            return true;
        }
        console.log(`GM: summonCreature - Invalid player or index ${index}.`); // ADDED LOG
        return false;
    }

    toggleTap(name, zone, index) {
        const p = this.findP(name);
        if (zone === 'battleZone') {
            const card = p.battleZone[index];
            // 呪文はタップできないようにする
            if (card && card.type && card.type.trim().toLowerCase() === 'spell') {
                console.log(`GM: Spell tap blocked for ${card.name}`);
                return;
            }
        }

        if (p.toggleTap(zone, index)) {
            this.emitState();
        }
    }

    destroyCard(name, index) {
        if (this.findP(name).moveCardFromBattleToGraveyard(index)) {
            this.emitState();
        }
    }

    pickUpShield(name, index) {
        if (this.findP(name).moveShieldToHand(index)) {
            this.emitState();
        }
    }

    untapAll(name) {
        this.findP(name).untapAll();
        this.emitState();
    }

    // --- デッキ操作（サンドボックス拡張） ---

    // デッキの中身をリクエストしたプレイヤーにだけ送る
    requestDeckList(name) {
        const p = this.findP(name);
        this.io.to(p.socketId).emit('deckListResponse', p.deck);
    }

    // デッキの特定位置からカードを移動（サーチ用）
    moveCardFromDeck(name, cardId, targetZone, shouldShuffle = true, deckOwnerName = null, targetPlayerName = null) {
        // カードの持ち主（山札の持ち主）
        const ownerName = deckOwnerName || name;
        const owner = this.findP(ownerName);
        if (!owner) return;

        // カードを探す
        const cardIndex = owner.deck.findIndex(c => c.id === cardId);

        if (cardIndex !== -1) {
            const card = owner.deck.splice(cardIndex, 1)[0];

            // 移動先プレイヤー
            const destPlayerName = targetPlayerName || name;
            const destPlayer = this.findP(destPlayerName);
            if (!destPlayer) return; // Should not happen

            card.isTapped = false; // Reset tap state

            // 指定のゾーンへ追加
            if (targetZone === 'hand') destPlayer.hand.push(card);
            else if (targetZone === 'manaZone') destPlayer.manaZone.push(card);
            else if (targetZone === 'battleZone') destPlayer.battleZone.push(card);
            else if (targetZone === 'graveyard') destPlayer.graveyard.push(card);
            else if (targetZone === 'shields') {
                card.shieldNum = destPlayer.nextShieldNum++;
                destPlayer.shields.push(card);
            }

            if (shouldShuffle) owner.shuffleDeck();
            this.emitState();
        }
    }

    // 山札の一番上を特定のゾーンへ直接移動（ドラッグ用）
    moveTopCard(name, targetZone) {
        const p = this.findP(name);
        if (p.deck.length > 0) {
            const card = p.deck.pop(); // 一番上を引く

            // targetZoneは 'manaZone', 'battleZone', 'graveyard' など
            if (p[targetZone]) {
                if (targetZone === 'shields') card.shieldNum = p.nextShieldNum++;
                p[targetZone].push(card);
            }
            this.emitState();
        }
    }

    // 墓地の中身を送信
    requestGraveList(name) {
        const p = this.findP(name);
        // 墓地は公開情報なので、誰でも見れるように作ることも可能ですが
        // 今回はリクエストした本人に送ります
        this.io.to(p.socketId).emit('cardListResponse', { cards: p.graveyard, source: 'grave' });
    }

    // デッキサーチの応答も形式を合わせる
    requestDeckList(name) {
        const p = this.findP(name);
        this.io.to(p.socketId).emit('cardListResponse', { cards: p.deck, source: 'deck' });
    }

    // デッキをシャッフルする
    shuffleDeck(name) {
        const p = this.findP(name);
        p.shuffleDeck();
        this.emitState();
    }

    // デッキの上からN枚のカードを表示（デッキは変更しない）
    viewTopCards(name, N, isPublic = false) {
        const p = this.findP(name);
        const topCards = p.deck.slice(Math.max(p.deck.length - N, 0)); // デッキの末尾が山札の上

        const data = {
            cards: topCards,
            source: 'deckTop',
            ownerName: name,
            isPublicView: isPublic
        };
        if (isPublic) {
            this.io.emit('topCardsResponse', data);
        } else {
            this.io.to(p.socketId).emit('topCardsResponse', data);
        }
    }

    // 墓地から特定のカードを移動
    moveCardFromGrave(name, index, targetZone) {
        const p = this.findP(name);
        if (p.graveyard[index]) {
            const card = p.graveyard.splice(index, 1)[0]; // 墓地から抜く

            if (p[targetZone]) {
                if (targetZone === 'shields') card.shieldNum = p.nextShieldNum++;
                p[targetZone].push(card);
            }
            // 墓地からの移動はシャッフル不要
            this.emitState();
        }
    }

    evolveCard(name, data, sId) {
        const p = this.findP(name);
        // セキュリティ：操作しているプレイヤーが本人かチェック
        if (!p || p.socketId !== sId) return;

        // ゾーン名の正規化
        let sourceZone = data.source.includes('hand') ? 'hand' :
            data.source.includes('mana') ? 'manaZone' :
                data.source.includes('battle') ? 'battleZone' : null;

        if (!sourceZone) return;

        const fromArr = p[sourceZone];
        const toArr = p.battleZone;

        if (fromArr && fromArr[data.sourceIndex] && toArr && toArr[data.targetIndex]) {
            const movingCard = fromArr.splice(data.sourceIndex, 1)[0];
            const baseCard = toArr[data.targetIndex];

            // 進化スタック作成
            movingCard.evolvesFrom = baseCard;
            movingCard.isTapped = baseCard.isTapped;

            toArr[data.targetIndex] = movingCard;

            this.emitState();
        }
    }

    moveCard(name, fromZoneName, toZoneName, index, sId) {
        const p = this.findP(name);
        if (!p || p.socketId !== sId) return;

        const fromZone = p[fromZoneName];
        const toZone = p[toZoneName];

        if (fromZone && fromZone[index]) {
            // バトルゾーンからの移動かチェック
            if (fromZoneName === 'battleZone') {
                // スタックごと抜く
                const stackTop = fromZone.splice(index, 1)[0];
                // 再帰的に全ての重なりを移動先へ送る
                this._recursiveMove(p, stackTop, toZoneName);
            } else {
                // 通常の移動（手札からマナなど）
                const card = fromZone.splice(index, 1)[0];
                if (toZone) {
                    if (toZoneName === 'shields') card.shieldNum = p.nextShieldNum++;
                    toZone.push(card);
                }
            }
            this.emitState();
        }
    }

    // ヘルパー（再帰移動）
    _recursiveMove(player, card, targetZoneName) {
        if (card.evolvesFrom) {
            this._recursiveMove(player, card.evolvesFrom, targetZoneName);
            delete card.evolvesFrom;
        }
        const targetArr = player[targetZoneName];
        if (targetArr) {
            card.isTapped = false;
            if (targetZoneName === 'shields') card.shieldNum = player.nextShieldNum++;
            targetArr.push(card);
        }
    }

    // 自分の山札を見る
    viewDeck(playerName) {
        const p = this.findP(playerName);
        if (p) {
            // クライアントへ送信。source='deck'
            // isPublicView=false, ownerName=playerName
            const data = {
                cards: p.deck,
                source: 'deck',
                ownerName: playerName,
                isPublicView: false
            };
            this.io.to(p.socketId).emit('cardListResponse', data);
        }
    }

    // --- ハンデス関連 ---

    // 対象プレイヤーの手札からランダムに1枚墓地へ
    randomDiscard(targetPlayerName) {
        const p = this.findP(targetPlayerName);
        if (p && p.hand.length > 0) {
            const index = Math.floor(Math.random() * p.hand.length);
            const card = p.hand.splice(index, 1)[0];
            p.graveyard.push(card);
            this.emitState();
        }
    }

    // 対象プレイヤーの手札をリクエスト元に公開
    viewOpponentHand(requestingPlayerName, targetPlayerName) {
        const reqP = this.findP(requestingPlayerName);
        const targetP = this.findP(targetPlayerName);

        if (reqP && targetP) {
            const data = {
                cards: targetP.hand,
                source: 'opponentHand',
                ownerName: targetPlayerName,
                isPublicView: false // 個別の公開なのでpublicViewではない扱いで良いか？ -> クライアント側でopponentHandなら操作可能にするロジックにしたのでOK
            };
            this.io.to(reqP.socketId).emit('cardListResponse', data);
        }
    }

    // 相手の山札を見る
    viewOpponentDeck(requestingPlayerName, targetPlayerName) {
        const reqP = this.findP(requestingPlayerName);
        const targetP = this.findP(targetPlayerName);

        if (reqP && targetP) {
            const data = {
                cards: targetP.deck,
                source: 'opponentDeck',
                ownerName: targetPlayerName,
                isPublicView: false
            };
            this.io.to(reqP.socketId).emit('cardListResponse', data);
        }
    }

    // 指定位置の手札を墓地へ（ピーピングハンデス用）
    discardAt(targetPlayerName, index) {
        const p = this.findP(targetPlayerName);
        if (p && p.hand[index]) {
            const card = p.hand.splice(index, 1)[0];
            p.graveyard.push(card);
            this.emitState();
        }
    }
}

module.exports = GameManager;