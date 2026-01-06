const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Player = require('./Player');
const GameManager = require('./GameManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = { Player1: null, Player2: null };
let readyStatus = { Player1: false, Player2: false };
let chosenDecks = { Player1: null, Player2: null };
let gameManager = null;

app.use(express.static('src'));

io.on('connection', (socket) => {
    let role = !players.Player1 ? 'Player1' : (!players.Player2 ? 'Player2' : null);

    if (role) {
        players[role] = new Player(role, socket.id);
        socket.emit('playerAssigned', { name: role });
    }

    // ロビー：準備完了
    socket.on('playerReady', (data) => {
        readyStatus[data.playerName] = true;
        chosenDecks[data.playerName] = data.deck;
        io.emit('readyUpdate', readyStatus);

        if (readyStatus.Player1 && readyStatus.Player2) {
            gameManager = new GameManager(players.Player1, players.Player2, io);
            gameManager.startGame(chosenDecks.Player1, chosenDecks.Player2);
            io.emit('gameStarted');
            // リセット
            readyStatus = { Player1: false, Player2: false };
        }
    });

    // ゲームアクション
    socket.on('drawCard', d => gameManager?.drawCard(d.playerName));
    socket.on('chargeMana', d => { console.log("Server received chargeMana:", d); gameManager?.chargeMana(d.playerName, d.handIndex); });
    socket.on('summonCreature', d => { console.log("Server received summonCreature:", d); gameManager?.summonCreature(d.playerName, d.handIndex); });
    socket.on('evolveCard', d => gameManager?.evolveCard(d.playerName, d, socket.id));
    socket.on('toggleTap', d => gameManager?.toggleTap(d.playerName, d.zone, d.index));
    socket.on('destroyCard', d => gameManager?.destroyCard(d.playerName, d.battleZoneIndex));
    socket.on('moveBattleCard', d => gameManager?.moveBattleCardToZone(d.playerName, d.index, d.targetZone, socket.id));
    socket.on('pickUpShield', d => gameManager?.pickUpShield(d.playerName, d.shieldIndex));
    socket.on('untapAll', d => gameManager?.untapAll(d.playerName));
    socket.on('moveCard', d => { console.log("Server received moveCard:", d); gameManager?.moveCard(d.playerName, d.fromZone, d.toZone, d.index, socket.id); });

    // サーチ・トップ移動
    socket.on('requestDeckList', d => gameManager?.requestDeckList(d.playerName));
    socket.on('moveCardFromDeck', d => gameManager?.moveCardFromDeck(d.playerName, d.cardId, d.targetZone, d.shouldShuffle, d.deckOwnerName, d.targetPlayerName));
    socket.on('moveTopCard', d => gameManager?.moveTopCard(d.playerName, d.targetZone));
    socket.on('shuffleDeck', d => gameManager?.shuffleDeck(d.playerName));
    socket.on('viewTopCards', d => gameManager?.viewTopCards(d.playerName, d.N, d.isPublic));
    socket.on('viewDeck', d => gameManager?.viewDeck(d.playerName));

    socket.on('requestGraveList', d => gameManager?.requestGraveList(d.playerName));

    // ハンデス関連
    socket.on('randomDiscard', d => gameManager?.randomDiscard(d.targetPlayerName));
    socket.on('viewOpponentHand', d => gameManager?.viewOpponentHand(d.requestingPlayerName, d.targetPlayerName));
    socket.on('viewOpponentDeck', d => gameManager?.viewOpponentDeck(d.requestingPlayerName, d.targetPlayerName));
    socket.on('discardAt', d => gameManager?.discardAt(d.targetPlayerName, d.index));
    // 墓地からカードを移動
    socket.on('moveCardFromGrave', d => gameManager?.moveCardFromGrave(d.playerName, d.index, d.targetZone));

    socket.on('disconnect', () => {
        if (role) {
            players[role] = null;
            readyStatus[role] = false;
            io.emit('readyUpdate', readyStatus);
        }
    });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));