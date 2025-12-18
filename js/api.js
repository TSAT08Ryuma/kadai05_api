// APIコードは１４行目に入れてください。e-Statです

import { muni } from "./data/muni.js";
window.muni = muni;
window.APIsetup = async function APIsetup() {
    //データをしまうグローバル変数

    const dataList_area = {};
    const dataList_population = {};
    const cityStatsByCode = {};
    const prefectureSelect = document.getElementById("prefSelect").value;
    const industrySelect = document.getElementById("industrySelect").value;

    const appId = "";
    const statsDataId_area = "0000020202";      // 自然環境（市区町村データ／廃置分合処理済）
    const cdCat_areasize = "B1101";               // 総面積
    const cdTime_area = "2019100000";            // 例：2019年10月1日現在

    const cdAreaFrom = prefectureSelect + "001";               // 例：名古屋市（市区町村コードはメタ情報で確認推奨）
    const cdAreaTo = prefectureSelect + "999";
    console.log(cdAreaFrom, "cdAreaFromの中身確認");

    const statsDataId_population = "0000020201"; // 同じデータセットIDを使用
    const cdCat_population = "A1101";           // 総人口
    const cdTime_population = "2020100000";

    const fetchData_areasize = async () => {
        const url = new URL("https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData");
        url.searchParams.set("appId", appId);
        url.searchParams.set("statsDataId", statsDataId_area);
        url.searchParams.set("cdCat01", cdCat_areasize);
        url.searchParams.set("cdAreaFrom", cdAreaFrom);
        url.searchParams.set("cdAreaTo", cdAreaTo);
        url.searchParams.set("cdTime", cdTime_area);
        url.searchParams.set("metaGetFlg", "N"); // 説明書
        const response = await fetch(url);
        const data = await response.json();
        return data;
    };

    // ★ここが一番重要：returnしたdataを受け取る
    const data_area = await fetchData_areasize();
    const dataset_area = data_area?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF;

    for (let i = 0; i < dataset_area.VALUE.length; i++) {
        const row = dataset_area.VALUE[i];
        const area = row["@area"];   // ← 市区町村コードを入れてる
        const value = Number(row["$"]); // ← 数値を入れてる
        dataList_area[area] = value;
    }

    fetchData_areasize();

    // 人口データを取ってくる関数
    const fetchData_population = async () => {
        const url = new URL("https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData");
        url.searchParams.set("appId", appId);
        url.searchParams.set("statsDataId", statsDataId_population);
        url.searchParams.set("cdCat01", cdCat_population); // ← 人口
        url.searchParams.set("cdAreaFrom", cdAreaFrom);
        url.searchParams.set("cdAreaTo", cdAreaTo);
        url.searchParams.set("cdTime", cdTime_population);
        url.searchParams.set("metaGetFlg", "N");

        const response = await fetch(url);
        const data = await response.json();
        return data;
    };

    const data_population = await fetchData_population();
    const dataset_population = data_population?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF;

    for (let i = 0; i < dataset_population.VALUE.length; i++) {
        const row = dataset_population.VALUE[i];　//１行分のデータを取り出した
        const area = row["@area"];　// 市区町村コードでふつうは.areaとかで出せるのにe-Statは＠にしていてカッコが必要になった
        //             row = {
        //   "@area": "23100",
        //   "@time": "2020000000",
        //   "$": "2295638"
        // };
        const value = Number(row["$"]);　//これはrow.＄の意味。
        dataList_population[area] = value;　//データリストのareaオブジェクトにエリアコードをキーにして値を入れている
    }

    fetchData_population();
    console.log(dataList_population);



    const statsDataId_2 = "0004003263";
    const cdCat_retailer = industrySelect;               // 選べるのだ

    const url = new URL("https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData");
    url.searchParams.set("appId", appId);
    url.searchParams.set("statsDataId", statsDataId_2);
    url.searchParams.set("cdCat01", cdCat_retailer);
    url.searchParams.set("metaGetFlg", "N"); // 最初はYで中身を見る
    url.searchParams.set("cdAreaFrom", cdAreaFrom);
    url.searchParams.set("cdAreaTo", cdAreaTo);

    const res = await fetch(url);
    const data = await res.json();

    console.log("DATA:", data?.GET_STATS_DATA);
    console.log("RESULT:", data?.GET_STATS_DATA?.RESULT);
    console.log("VALUE sample:", data?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE?.[0]);

    const TAB_TO_KEY = {
        "701-2021": "stores",        // 事業所数
        "703-2021": "sales_million", // 年間商品販売額（百万円）
        "704-2021": "floor_m2"       // 売場面積（m2）
    };

    // 市区町村コード → {stores, employees, sales_million, floor_m2}
    const drugByCode = {};

    const values = data.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE ?? [];

    for (const row of values) {　//繰り返しを省略した　毎回バリューズの中身を取り出し続けていくが、それをとりあえずrowというところに入れてるだけでrow=~~~[i]と同じ意味になる
        //             {
        //     "@tab": "704-2021",
        //     "@cat01": "603",
        //     "@area": "23000",
        //     "@time": "2021000000",
        //     "@unit": "m2",
        //     "$": "733155"
        // }
        const code = row["@area"];      // 市区町村コードをまず
        const tab = row["@tab"];       // 701-2021 等
        const key = TAB_TO_KEY[tab];　　// 変換キー
        const v = Number(row["$"]);　　// 値を取り出す
        if (!drugByCode[code]) drugByCode[code] = {};
        drugByCode[code][key] = v;　//.code.keyと近く、オブジェクトのオブジェクトに処理してくれといっているが、[]の中に変数を入れるときは""なしで変数にできる　これをブラケット記法という手法でどっと手法より便利
    }
    console.log(drugByCode);

    // ここにコードを書く

    for (const code in drugByCode) {

        const area = dataList_area[code];
        const population = dataList_population[code] ?? null;
        const store = drugByCode[code]?.stores || 0;
        const floor = drugByCode[code]?.floor_m2 || 0;

        let storeSize = null;
        if (store && floor > 0) {
            storeSize = floor / store; // 店舗サイズ
            storeSize = Math.round(storeSize * 10) / 10; // 小数点以下2桁に丸める
        }

        let density = null;
        if (store && area > 0) {
            density = (store / area) // ㎡当たりの店舗数
            density = Math.round(density * 100) * 10 / 100
        }; // 小数点以下2桁に丸める  

        let tennposuu_zinko = null;
        if (store && population > 0) {
            tennposuu_zinko = (store / population) * 10000 // tennposuu/zinko（1万人当たり）
            tennposuu_zinko = Math.round(tennposuu_zinko * 10) / 10; // 小数点以下2桁に丸める
        }

        cityStatsByCode[code] = {
            name: window.muni[code]?.name || "不明な市区町村",
            area,
            population,
            store,
            floor,
            storeSize,
            density,
            tennposuu_zinko,
        }
    }
    for (const code in cityStatsByCode) {
        if (!cityStatsByCode[code].population) {
            delete cityStatsByCode[code];
        }
    }

    console.log("結果：", cityStatsByCode);
    const tbody = document.getElementById("data_area")
    let html = "";
    tbody.innerHTML = "";

    for (const code in cityStatsByCode) {
        const item = cityStatsByCode[code];
        // 行（HTML）を作る
        html += `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.area}</td>
                        <td>${item.population}</td>
                        <td>${item.store}</td>
                        <td>${item.storeSize}</td>
                        <td>${item.density}</td>
                        <td>${item.tennposuu_zinko}</td>

                    </tr>
                `};
    tbody.innerHTML = html;

    // ブラウザ全体で共有する変数の宣言　とりあえずwindowupdateMap（関数にする予定）に引数を入れる
    if (window.updateMapColor) {
        window.updateMapColor(cityStatsByCode);
    }
}

// --- 後半：マップ描画部分（Leafket起動呪文） ---　マップという変数に加えてる

const map = L.map("map").setView([35.68, 139.76], 10);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// GeoJSONを保持しておく変数
let geoData = null;
let geoLayer = null;

// GeoJSON読み込みして変数に入れた＆最初の描写でとりあえず色グレーで描写する
fetch("./js/data/n03.geojson")
    .then(r => r.json())
    .then(data => {
        geoData = data;
        // 最初は色なし描画
        drawMap({});
    });

// マップを描画する関数（データを受け取って色を塗る）
// グローバル(window)にして、APIsetupから呼べるようにする
//手前で cityStatsByCode を作って
// それを引数として関数に入れて
// その中で drawMap に渡している
window.updateMapColor = function (statsData) {
    if (!geoData) {
        alert("GeoJSON読込中...もう一度押してね");
        return;
    }
    drawMap(statsData);
};

function drawMap(statsData) {
    // 前のレイヤーがあれば消す　ジオレイヤーがあるかみて、何かあるならマップという変数の中のジオレイヤーを消してる
    if (geoLayer) {
        map.removeLayer(geoLayer);
    }
    // ジオレイヤーを定義してる。Lはライブラリで境界線を書いてくれる装置。geodata、ジェイソンのデータを使う。
    // ジェイソンデータを第一引数にして、それを処理してて、style:でその次にはどうかくか入れる必要性
    // 今回は、featureを受け取って見た目を返す関数を入れている。本当の基本形は以下の通り。今回は、アロー関数で一体化している。
    // function styleFeature(feature) {
    //     return {
    //         weight: 1,
    //         color: "#555",
    //         fillOpacity: 0.7,
    //         fillColor: "red"
    //     };
    // }

    // geoLayer = L.geoJSON(geoData, {
    //     style: styleFeature
    // }).addTo(map);
    geoLayer = L.geoJSON(geoData, {
        style: (feature) => {
            // 後ろのゲットコードでコードとってきてる
            const code = getCode(feature);
            // 密度を取っていて、密度により場合分けしている
            const v = statsData[code]?.density ?? null;
            return {
                weight: 1,
                color: "#555",
                fillOpacity: 0.7,
                fillColor: getColor(v)
            };
        },
        // ポップアップ用の別データ
        onEachFeature: (feature, layer) => {
            const code = getCode(feature);
            const s = statsData[code];
            // ポップアップ設定
            if (s) {
                layer.bindPopup(`
                        <b>${s.name}</b><br>
                        Code: ${code}<br>
                        密度: ${s.density} 店/10k㎡<br>
                        店舗数: ${s.store}<br>
                        人口: ${s.population}
                    `);
            }
        }
    }).addTo(map);
}

function getCode(feature) {
    return String(feature.properties?.N03_007 ?? "");
}

function getColor(v) {
    if (v == null || Number.isNaN(v)) return "#ccc";
    if (v >= 5) return "#800026";
    if (v >= 2) return "#BD0026";
    if (v >= 1) return "#E31A1C";
    if (v >= 0.5) return "#FC4E2A";
    if (v >= 0.2) return "#FD8D3C";
    if (v >= 0.1) return "#FEB24C";
    return "#FFEDA0";
}

APIsetup.window