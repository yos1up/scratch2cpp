# scratch2cpp

for Scratchers who want to participate in programming contests

ここには，以下の 2 つのものがあります：

1. AtCoder に Scratch 3.0 で参加できるようになる Chrome 拡張．
Scratch 3.0 プロジェクトファイル (.sb3) を C++ ソース (.cpp) に変換する
JavaScript コードが含まれています．

2. ローカルで動作する，コード変換ツール． Scratch 2.0 プロジェクトファイル (.sb2) を C++ ソース (.cpp) に変換できます．（Python3 製です．）


1 については， 以下の記述は読まずに `./web/crx/` の階層の README をご覧ください．

2 については，以下の記述をご覧ください． 


## Installation

```
git clone https://github.com/yos1up/scratch2cpp.git
```

## Dependency

* python3

## How to participate in programming contests in Scratch 2.0

1. Create a Scratch 2.0 project which solves the problem.

    * Use `when [Flag] clicked` block to specify the entry point.
    
    * Use `ask ... and wait` block to get a value from standard input. (The value will be stored in `answer`.) (The asking message is arbitrary. )
    
    * Use `say ...` block to output a line to standard output. (Use `think ...` block to output a line to stderr.)
    
    * Use `stop ...` block to terminate your program in the middle of the script. (The option is arbitrary. )

2. Save your project as a .sb2 file.

3. `python sb2_to_cpp.py scratch_project_file.sb2 -o output_file.cpp`

4. submit the content of `output_file.cpp`.

## Example of Scratch projects

See https://scratch.mit.edu/studios/5346476/

## Blocks supported in scratch2cpp

See [here](./blocks.md).
