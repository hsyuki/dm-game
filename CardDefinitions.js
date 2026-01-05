const CardDefinitions = {
    // --- 水文明 (Water) ---
    "アクア・ガード": {
        name: "アクア・ガード",
        civilization: "Water",
        type: "Creature",
        race: "リキッド・ピープル", 
        cost: 1,
        power: 2000,
        abilities: ["ブロッカー", "攻撃できない。"],
        isEvolution: false 
    },
    "マリン・フラワー": {
        name: "マリン・フラワー",
        civilization: "Water",
        type: "Creature",
        race: "サイバー・ウイルス", 
        cost: 1,
        power: 2000,
        abilities: ["ブロッカー", "攻撃できない。"],
        isEvolution: false 
    },
    "エレガント・ランプ": {
        name: "エレガント・ランプ",
        civilization: "Water",
        type: "Creature",
        race: "サイバー・ウイルス", 
        cost: 2,
        power: 1000,
        abilities: [],
        isEvolution: false
    },
    "アクア・ハルカス": {
        name: "アクア・ハルカス",
        civilization: "Water",
        type: "Creature",
        race: "リキッド・ピープル", 
        cost: 3,
        power: 2000,
        abilities: ["登場時：カードを1枚引いてよい。"],
        isEvolution: false 
    },
    "アストラル・リーフ": {
        name: "アストラル・リーフ",
        civilization: "Water",
        type: "Evolution Creature",
        race: "サイバー・ウイルス", 
        cost: 2,
        power: 4000,
        abilities: ["進化（サイバー・ウイルス1体の上に置く）", "登場時：カードを3枚引いてもよい。"],
        isEvolution: true 
    },
    "エメラル": {
        name: "エメラル",
        civilization: "Water",
        type: "Creature",
        race: "サイバー・ロード", 
        cost: 2,
        power: 1000,
        abilities: ["登場時：手札を1枚シールド化し、シールドを1枚手札に戻す。"],
        isEvolution: false
    },
    "ストリーミング・シェイパー": {
        name: "ストリーミング・シェイパー",
        civilization: "Water",
        type: "Spell",
        race: null, 
        cost: 3,
        power: null,
        abilities: ["自分の山札のカードを、上から4枚をすべてのプレイヤーに見せる。その中の水のカードをすべて自分の手札に加え、それ以外のカードを自分の墓地に置く。"],
        isEvolution: false 
    },
    "クリスタル・パラディン": {
        name: "クリスタル・パラディン",
        civilization: "Water",
        type: "Evolution Creature",
        race: "リキッド・ピープル", 
        cost: 4,
        power: 5000,
        abilities: ["W・ブレイカー", "進化（リキッド・ピープル1体の上に置く）", "登場時：バトルゾーンにある「ブロッカー」を持つクリーチャーをすべて、持ち主の手札に戻す。"],
        isEvolution: true 
    },
    "クリスタル・ランサー": {
        name: "クリスタル・ランサー",
        civilization: "Water",
        type: "Evolution Creature",
        race: "リキッド・ピープル", 
        cost: 6,
        power: 8000,
        abilities: ["W・ブレイカー", "進化（リキッド・ピープル1体の上に置く）", "このクリーチャーはブロックされない。"],
        isEvolution: true 
    },
    "クリスタル・メモリー": {
        name: "クリスタル・メモリー",
        civilization: "Water",
        type: "Spell",
        race: null,
        cost: 4,
        power: null,
        abilities: ["S・トリガー", "山札からカードを1枚探し、手札に加える"],
        isEvolution: false 
    },
    // --- 闇文明 ---
    "デーモン・ハンド": {
        name: "デーモン・ハンド",
        civilization: "Darkness",
        type: "Spell",
        race: null,
        cost: 6,
        power: null,
        abilities: ["S・トリガー", "相手クリーチャーを1体破壊する。"],
        isEvolution: false
    },
    // --- 光文明 ---
    "ホーリー・スパーク": {
        name: "ホーリー・スパーク",
        civilization: "Light",
        type: "Spell",
        race: null,
        cost: 6,
        power: null,
        abilities: ["S・トリガー", "相手のクリーチャーをすべてタップする。"],
        isEvolution: false
    },
};

module.exports = { CardDefinitions };