# カード将棋

> 将棋はそのまま。カードで局面が変わる。

▶️ **プレイはこちら**: https://yoshitetsusuzuki.github.io/card-shogi/

このリポジトリは配信用のビルド成果物のみを含みます。

## エンジンのクレジット

CPU対戦のレベル9・10には、以下のオープンソース将棋エンジンを改変せずに使用しています（GPLv3）。

- [やねうら王 (YaneuraOu)](https://github.com/yaneurao/YaneuraOu) — WCSC29 優勝エンジン
- WASM ビルド: [mizar/YaneuraOu.wasm](https://github.com/mizar/YaneuraOu.wasm)（`@mizarjp/yaneuraou.k-p`）
- 評価関数: 水匠ペティット (SuishoPetite 2021-11) by たややん＠水匠

ライセンス全文は `engine/LICENSE.md` を参照してください。

さらに、カードによって駒数が通常将棋の範囲を超えた局面では、以下のエンジンを改変せずに使用しています（GPLv3）。

- [Fairy-Stockfish](https://github.com/fairy-stockfish/fairy-stockfish.wasm)（`fairy-stockfish-nnue.wasm`）— 変則将棋対応エンジン

ライセンス全文は `engine2/LICENSE.txt` を参照してください。
