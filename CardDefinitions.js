const CardDefinitions = {
    // --- 火文明 (Fire) ---
    "クリムゾン・ハンマー": {
        name: "クリムゾン・ハンマー",
        civilization: "Fire",
        type: "Spell",
        race: null,
        cost: 2,
        power: null,
        abilities: ["相手のパワー2000以下のクリーチャーを1体破壊する。"],
        isEvolution: false
    },
    "エグゼズ・ワイバーン": {
        name: "エグゼズ・ワイバーン",
        civilization: "Fire",
        type: "Creature",
        race: "アーマード・ワイバーン",
        cost: 3,
        power: 5000,
        abilities: ["スピードアタッカー", "相手プレイヤーを攻撃できない。", "自分のターンが終わるとき、このクリーチャーを自分の手札に戻す。"],
        isEvolution: false
    },
    "バースト・ショット": {
        name: "バースト・ショット",
        civilization: "Fire",
        type: "Spell",
        race: null,
        cost: 6,
        power: null,
        abilities: ["S・トリガー", "パワー2000以下のクリーチャーをすべて破壊する。"],
        isEvolution: false
    },
    "バザガジール・ドラゴン": {
        name: "バザガジール・ドラゴン",
        civilization: "Fire",
        type: "Creature",
        race: "アーマード・ドラゴン",
        cost: 8,
        power: 8000,
        abilities: ["スピードアタッカー", "W・ブレイカー", "アンタップしているクリーチャーを攻撃できる。", "自分のターンが終わるとき、このクリーチャーを自分の手札に戻す。"],
        isEvolution: false
    },

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
        abilities: ["登場時：カードを1枚引いてもよい。"],
        isEvolution: false
    },
    "アクア・サーファー": {
        name: "アクア・サーファー",
        civilization: "Water",
        type: "Creature",
        race: "リキッド・ピープル",
        cost: 6,
        power: 2000,
        abilities: ["S・トリガー", "登場時：クリーチャーを1体選び、持ち主の手札に戻してもよい。"],
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
        abilities: ["S・トリガー", "山札からカードを1枚探し、手札に加える。"],
        isEvolution: false
    },
    "サイバー・ブレイン": {
        name: "サイバー・ブレイン",
        civilization: "Water",
        type: "Spell",
        race: null,
        cost: 4,
        power: null,
        abilities: ["S・トリガー", "カードを3枚まで引く。"],
        isEvolution: false
    },
    "ストーム・クロウラー": {
        name: "ストーム・クロウラー",
        civilization: "Water",
        type: "Creature",
        race: "アースイーター",
        cost: 4,
        power: 5000,
        abilities: ["ブロッカー", "登場時：マナゾーンからカードを1枚選び、手札に戻す。", "攻撃できない。"],
        isEvolution: false
    },
    "ミスティック・クリエーション": {
        name: "ミスティック・クリエーション",
        civilization: "Water",
        type: "Spell",
        race: null,
        cost: 4,
        power: null,
        abilities: ["S・トリガー", "カードを3枚まで、自分のマナゾーンから手札に戻す。"],
        isEvolution: false
    },

    // --- 自然文明 (Nature) ---
    "フェアリー・ライフ": {
        name: "フェアリー・ライフ",
        civilization: "Nature",
        type: "Spell",
        race: null,
        cost: 2,
        power: null,
        abilities: ["S・トリガー", "自分の山札の上から1枚をマナゾーンに置く。"],
        isEvolution: false
    },
    "シビレアシダケ": {
        name: "シビレアシダケ",
        civilization: "Nature",
        type: "Creature",
        race: "バルーン・マッシュルーム",
        cost: 2,
        power: 1000,
        abilities: ["登場時：自分の手札を1枚、マナゾーンに置いてもよい。"],
        isEvolution: false
    },
    "青銅の鎧": {
        name: "青銅の鎧",
        civilization: "Nature",
        type: "Creature",
        race: "ビーストフォーク",
        cost: 3,
        power: 1000,
        abilities: ["登場時：山札の上のカードを1枚マナゾーンに置く。"],
        isEvolution: false
    },
    "神秘の宝箱": {
        name: "神秘の宝箱",
        civilization: "Nature",
        type: "Spell",
        race: null,
        cost: 3,
        power: null,
        abilities: ["自分の山札を見る。その中から自然以外のカードを1枚選び、自分のマナゾーンに置いてもよい。"],
        isEvolution: false
    },
    "深緑の魔方陣": {
        name: "深緑の魔方陣",
        civilization: "Nature",
        type: "Spell",
        race: null,
        cost: 4,
        power: null,
        abilities: ["S・トリガー", "自分のマナゾーンのカードを1枚、シールド化する。"],
        isEvolution: false
    },
    "恵みの化身": {
        name: "恵みの化身",
        civilization: "Nature",
        type: "Creature",
        race: "ミステリー・トーテム",
        cost: 6,
        power: 5000,
        abilities: ["このクリーチャーで攻撃する代わりに、タップして自分の墓地からカードを3枚まで選び、自分のマナゾーンに置いてもよい。"],
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
    "ロスト・ソウル": {
        name: "ロスト・ソウル",
        civilization: "Darkness",
        type: "Spell",
        race: null,
        cost: 7,
        power: null,
        abilities: ["相手は手札をすべて捨てる。"],
        isEvolution: false
    },
    "ヘル・スラッシュ": {
        name: "ヘル・スラッシュ",
        civilization: "Darkness",
        type: "Spell",
        race: null,
        cost: 8,
        power: null,
        abilities: ["相手の山札を見る。その中から3枚選び、持ち主の墓地に置いてもよい。"],
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