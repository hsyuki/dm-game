/**
 * ゲーム内の全てのカードの基底となるクラス
 */
class Card {
    /**
     * @param {number} id - カードのユニークID
     * @param {string} name - カード名
     * @param {string} type - カードタイプ ("Creature", "Spell", "Evolution Creature"など)
     * @param {string} race - 種族 ("リキッド・ピープル", "サイバー・ウイルス"など)
     * @param {string} civilization - 文明 ("Fire", "Water"など)
     * @param {number} cost - コスト
     * @param {number} power - パワー (クリーチャー以外はnullまたは0)
     * @param {string[]} abilities - 特殊能力のリスト
     * @param {boolean} isEvolution - 進化カードかどうかのフラグ
     * @param {string} imgUrl - カード画像のURL
     */
    constructor(id, name, type, race, civilization, cost, power, abilities, isEvolution = false, imgUrl = "") {
        // --- 静的プロパティ ---
        this.id = id;
        this.name = name;
        this.type = type;
        this.race = race;
        this.civilization = civilization;
        this.cost = cost;
        this.power = power;
        this.abilities = abilities || [];
        this.isEvolution = isEvolution;
        this.imgUrl = imgUrl;

        // --- 動的プロパティ ---
        this.isTapped = false; // タップ状態
        this.evolvesFrom = null; // 進化元
    }
}

module.exports = { Card };