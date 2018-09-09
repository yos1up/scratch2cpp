# scratch2cpp

for Scratchers who want to participate in programming contests

## Installation

```
git clone https://github.com/yos1up/scratch2cpp.git
```

## Dependency

* python3

## How to participate in programming contests

1. Create a Scratch project which solves the problem.

    * use `when [Flag] clicked` block to specify the entry point.
    
    * use `ask ... and wait` block to get a value from standard input. (The value will be stored in `answer` )
    
    * use `say ...` block to output a value to standard output.
    
    * use `stop ...` block to terminate your program in the middle of the script.

2. Download your project as a .sb2 file.

3. `python sb2_to_cpp.py scratch_project_file.sb2 -o output_file.cpp`

4. submit the C++ source in `output_file.cpp`.

## Limitation

Many types of blocks are not implementated yet!!
