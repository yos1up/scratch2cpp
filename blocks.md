English version is [here](#english).

<a name="japanese"></a>
# scratch2cpp で つかえる ブロック

### イベント

* `（はた）がクリックされたとき` : ここから しょりが はじまります

### みため

* `... という` : ひょうじゅんしゅつりょく に 1ぎょう しゅつりょくします

* `... とかんがえる` : ひょうじゅんエラーしゅつりょく に 1ぎょう しゅつりょくします

### せいぎょ

* `... かいくりかえす`

* `ずっと`

* `もし ... なら`

* `もし ... なら / でなければ`

* `... までくりかえす`

* `... をとめる` : しょりを しゅうりょうします（オプションは どれでも いっしょです）

### しらべる

* `... ときいてまつ` : ひょうじゅんにゅうりょく から あたい（スペース または かいぎょうで くぎられた かたまり）を 1つ にゅうりょくします

* `こたえ` : `... ときいてまつ` ブロックの こたえが はいります

### えんざん

（すべて つかえます）

### データ

（すべて つかえます）

* へんすうの なまえには アルファベットと すうじだけを つかって ください！ （[日本語の変数名を使いたい方へ](#japanesename)）

### そのた

* `ブロックをつくる` : しょりのまとまりを ていぎできます


<a name="japanesename"></a>
## 日本語の変数名を使いたい方へ

変数名に日本語が含まれる Scratch プロジェクトを変換すると，
出力されるC++ソースにも日本語の変数名が含まれ，その結果， GCC コンパイラでコンパイルできません（コンパイルエラーが生じます）．
そのような時は，以下の方法でコンパイルをすることができます．

* コンパイラを GCC から Clang に変更し（2018年9月現在の AtCoder の場合，「言語」を "C++14 (Clang 3.8.0)" に変更する），コンパイルを行う．


<a name="english"></a>
# Blocks supported in scratch2cpp

### Events

* `when :Flag: clicked` : specify entry point

### Looks

* `say ...` : output a line to standard output

* `think ...` : output a line to standard error

### Control

* `repeat ...`

* `forever`

* `if ... then`

* `if ... then / else`

* `repeat until ...`

* `stop ...` : terminate script (the option is ignored) 

### Sensing

* `ask ... and wait` : input a value from standard input (values are split by spaces and returns)

* `answer` : storage for `ask ... and wait` block

### Operators

(every operator is supported.)

* Make sure that names of variables consist of alphabets and digits!

### Data

(every manipulation of data is supported.)

### More Blocks

* `Make a Block` : define procedures





