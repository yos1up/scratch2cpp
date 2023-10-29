The description in English is provided [below Japanese one](#eng).

# sb2-tool

Scratch 2.0 のコードを C++ ソース (.cpp) に変換できるコード変換ツール

## インストール

```
git clone https://github.com/yos1up/scratch2cpp.git
```

## 依存ライブラリ

- Python3

## Scratch 2.0 でプログラミングコンテストに参加する方法

1. Create a Scratch 2.0 project which solves the problem.

   - Use `when [Flag] clicked` block to specify the entry point.

   - Use `ask ... and wait` block to get a value from standard input. (The value will be stored in `answer`.) (The asking message is arbitrary. )

   - Use `say ...` block to output a line to standard output. (Use `think ...` block to output a line to stderr.)

   - Use `stop ...` block to terminate your program in the middle of the script. (The option is arbitrary. )

2. Save your project as a .sb2 file.

3. `python sb2_to_cpp.py scratch_project_file.sb2 -o output_file.cpp`

4. submit the content of `output_file.cpp`.

## Scratch での解答例

こちらをどうぞ． https://scratch.mit.edu/studios/5346476/

## scratch2cpp が対応しているブロック

[こちら](/blocks.md)をどうぞ.

---

<a name="eng"></a>

# sb2-tool

Code converting tool which works offline. You can convert Scratch 2.0 project file (.sb2) into C++ source code (.cpp)

## Installation

```
git clone https://github.com/yos1up/scratch2cpp.git
```

## Dependency

- Python3

## How to participate in programming contests in Scratch 2.0

1. Create a Scratch 2.0 project which solves the problem.

   - Use `when [Flag] clicked` block to specify the entry point.

   - Use `ask ... and wait` block to get a value from standard input. (The value will be stored in `answer`.) (The asking message is arbitrary. )

   - Use `say ...` block to output a line to standard output. (Use `think ...` block to output a line to stderr.)

   - Use `stop ...` block to terminate your program in the middle of the script. (The option is arbitrary. )

2. Save your project as a .sb2 file.

3. `python sb2_to_cpp.py scratch_project_file.sb2 -o output_file.cpp`

4. submit the content of `output_file.cpp`.

## Example of Scratch projects

See https://scratch.mit.edu/studios/5346476/

## Blocks supported in scratch2cpp

See [here](/blocks.md).
