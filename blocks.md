English version is [here](#english).

<a name="japanese"></a>
# scratch2cpp で つかえる ブロック

### イベント

* `（はた）がクリックされたとき` : ここから しょりが はじまります

### みため

* `... という` : ひょうじゅんしゅつりょく に 1ぎょう しゅつりょくします

* `... と ... びょういう` : うえと おなじです（びょうすうは むしされます）

* `... とかんがえる` : ひょうじゅんエラーしゅつりょく に 1ぎょう しゅつりょくします

* `... と ... びょうかんがえる` : うえと おなじです（びょうすうは むしされます）

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

* Scratch では おおもじ と こもじ は くべつされませんが C++ では くべつされます！（"APPLE" と "apple" は ことなります）

* じょうけんを あらわす ろっかっけいの ブロックは かならず ろっかっけいの あなに いれるように してください！（まるい あなには いれないで）

### データ

（すべて つかえます）

### そのた

* `ブロックをつくる` : しょりのまとまりを ていぎできます


<a name="english"></a>
# Blocks supported in scratch2cpp

### Events

* `when :Flag: clicked` : specify entry point

### Looks

* `say ...` : output a line to standard output

* `say ... for ... secs` : same as above (secs is ignored)

* `think ...` : output a line to standard error

* `think ... for ... secs` : same as above (secs is ignored)

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

* Note that Scratch is case-insensitive, but C++ is case-sensitive (that is, "APPLE" is not equal to "apple".)

* Make sure that hexagonal blocks (condition blocks) are put in hexagonal holes only (not circular ones).

### Data

(every manipulation of data is supported.)

### More Blocks

* `Make a Block` : define procedures





