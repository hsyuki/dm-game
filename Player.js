const { Card } = require('./Card');
const { CardDefinitions } = require('./CardDefinitions');
let gId = 1;

class Player {
    constructor(name, sId) {
        this.name = name; this.socketId = sId;
        this.deck = []; this.hand = []; this.manaZone = []; this.battleZone = []; this.shields = []; this.graveyard = [];
        this.nextShieldNum = 1;
    }

    reset() {
        this.deck = []; this.hand = []; this.manaZone = []; this.battleZone = []; this.shields = []; this.graveyard = [];
        this.nextShieldNum = 1;
    }

    setDeckList(list) {
        this.deck = [];
        if (!list || !Array.isArray(list)) return;

        list.forEach(cardName => {
            const def = CardDefinitions[cardName];
            if (def) {
                this.deck.push(new Card(
                    gId++,
                    def.name,
                    def.type,
                    def.race,
                    def.civilization,
                    def.cost,
                    def.power,
                    def.abilities,
                    def.isEvolution || false,
                    def.imgUrl || ""
                ));
            } else {
                console.warn(`Card definition not found for: ${cardName}`);
            }
        });
    }

    shuffleDeck() { this.deck.sort(() => Math.random() - 0.5); }
    drawCard(c) { for (let i = 0; i < c; i++) if (this.deck.length) this.hand.push(this.deck.pop()); }
    setInitialShields() {
        for (let i = 0; i < 5; i++) {
            if (this.deck.length) {
                const card = this.deck.pop();
                card.shieldNum = this.nextShieldNum++;
                this.shields.push(card);
            }
        }
    }

    moveCardToMana(i) {
        if (this.hand[i]) { this.manaZone.push(this.hand.splice(i, 1)[0]); return true; }
        return false;
    }

    moveCardToBattleZone(i) {
        if (!this.hand[i]) return false;
        const c = this.hand.splice(i, 1)[0];
        this.battleZone.push(c);
        return true;
    }

    moveCardFromBattleToGraveyard(i) {
        if (this.battleZone[i]) { this.graveyard.push(this.battleZone.splice(i, 1)[0]); return true; }
        return false;
    }

    moveShieldToHand(i) {
        if (this.shields[i]) { this.hand.push(this.shields.splice(i, 1)[0]); return true; }
        return false;
    }

    toggleTap(z, i) {
        const target = z === 'manaZone' ? this.manaZone : this.battleZone;
        if (target[i]) { target[i].isTapped = !target[i].isTapped; return true; }
        return false;
    }

    untapAll() {
        this.manaZone.forEach(c => c.isTapped = false);
        this.battleZone.forEach(c => c.isTapped = false);
    }

    getState() {
        return {
            deckCount: this.deck.length,
            handCount: this.hand.length,
            manaZone: this.manaZone,
            battleZone: this.battleZone,
            shields: this.shields,
            graveyard: this.graveyard,
            graveCount: this.graveyard.length
        };
    }
}
module.exports = Player;