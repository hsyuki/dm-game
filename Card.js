/**
 * ゲーム内の全てのカードの基底となるクラス
 */
class Card {
    /**
     * @param {number} id - カードのユニークID
     * @param {string} name - カード名
     * @param {string} type - カードタイプ ("Creature", "Spell", "Evolution Creature"など)
     * @param {string} imgUrl - カード画像のURL
     */
    constructor(id, name, type, imgUrl = "") {
        // --- 静的プロパティ ---
        this.id = id;
        this.name = name;
        this.type = type;
        this.imgUrl = imgUrl;

        // --- 動的プロパティ ---
        this.isTapped = false; // タップ状態
        this.evolvesFrom = null; // 進化元
    }
}

module.exports = { Card };