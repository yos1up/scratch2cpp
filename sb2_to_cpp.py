import argparse
import os, sys
import zipfile
import json
import numpy as np

parser = argparse.ArgumentParser(usage='convert .sb2 to .cpp')
parser.add_argument('infile', help='input file name (.sb2)')
parser.add_argument('-o', '--outfile', default='a.cpp', help='output file name (.cpp)')
parser.add_argument('-j', '--jsonfile', default='', help='json file name')
args = parser.parse_args()

if not os.path.exists(args.infile):
    raise FileNotFoundError

# extract project.json
with zipfile.ZipFile(args.infile) as myzip:
    with myzip.open('project.json') as myfile:
        jsonstr = myfile.read().decode(encoding='utf-8')

# output json file
if args.jsonfile != "":
    with open(args.jsonfile, 'w') as f:
        f.write(jsonstr)

# extract information needed for conversion
jsonobj = json.loads(jsonstr)
print('----------variables----------')
scr_variables = jsonobj['variables'] if 'variables' in jsonobj else []
for var in scr_variables:
    print(var['name'], var['value'], var['isPersistent'])
print('----------lists----------')
scr_lists = jsonobj['lists'] if 'lists' in jsonobj else []
for li in scr_lists:
    print(li['listName'], li['contents'], li['isPersistent'])
print('----------scripts----------')
scr_scripts = jsonobj['children'][0]['scripts']
for script in scr_scripts:
    print(script[2])


def random_identifier_name():
    return ''.join([chr(ord('a')+np.random.randint(26)) for i in range(6)])

def indent(snippet, num_space):
    '''
    snippet: 0行以上の str. 全ての行の末尾には改行がある．
    num_space: 非負整数
    '''
    if snippet == '': return ''
    lines = snippet.split('\n')
    if lines[-1] == '': lines.pop()
    spaces = ' ' * num_space
    return ''.join([spaces + line + '\n' for line in lines])

def convert_script_list(script_list):
    '''
    script_list: block のリスト．
    '''
    func_name = ''
    snippet = ''
    if script_list[0][0] == 'whenGreenFlag':
        func_name = 'main'
        script_list.pop(0)
    for block in script_list:
        snippet += convert_block(block)

    return snippet, func_name

def convert_block(block):
    '''
    block: ['コマンド名', 引数...]
    returns <str>: スニペット．
    '''
    if type(block) in [str, int]: return '"' + str(block) + '"'
    com = block[0]
    if com == 'setVar:to:':
        return '{!s} = {!s};\n'.format(block[1], convert_block(block[2]))
    elif com == 'readVariable':
        return str(block[1])
    elif com == 'doRepeat':
        counter_name = random_identifier_name()
        return 'for (int {0!s}=0;{0!s}<{1!s};{0!s}++){{\n'.format(counter_name, convert_block(block[1])) \
                + indent(convert_script_list(block[2])[0], 4) \
                + '}\n'
    elif com == 'doForever':
        return 'while (1){\n' \
                + indent(convert_script_list(block[1])[0], 4) \
                + '}\n'
    elif com in ['+','-','*','/','%','>','<']:
        return '(' + convert_block(block[1]) + com + convert_block(block[2]) + ')'
    elif com == '=':
        return '(' + convert_block(block[1]) + '==' + convert_block(block[2]) + ')'
    elif com == 'changeVar:by:':
        return block[1] + '+=' + convert_block(block[2]) + ';\n'
    elif com == 'answer':
        return name_of_answer_variable;
    elif com == 'rounded':
        return 'rounded(' + convert_block(block[1]) + ')'
    elif com == 'computeFunction:of:':
        return block[1] + '(' + convert_block(block[2]) + ')'
    elif com == 'concatenate:with:':
        return '(' + convert_block(block[1]) + '+' + convert_block(block[2]) + ')'
    elif com == 'doIf':
        return 'if ({!s}){{\n'.format(convert_block(block[1])) \
                + indent(convert_script_list(block[2])[0], 4) \
                + '}\n'
    elif com == 'doIfElse':
        return 'if ({!s}){{\n'.format(convert_block(block[1])) \
                + indent(convert_script_list(block[2])[0], 4) \
                + '}else{\n' \
                + indent(convert_script_list(block[3])[0], 4) \
                + '}\n'
    elif com == 'doAsk':
        return 'cin >> {!s};\n'.format(name_of_answer_variable)
    elif com == 'say:':
        return 'cout << {!s} << endl;\n'.format(convert_block(block[1]))
    elif com == 'append:toList:':
        return '{!s}.push_back({!s});\n'.format(block[2], convert_block(block[1]))
    elif com == 'getLine:ofList:':
        return '{!s}[{!s}]'.format(block[2], convert_block(block[1]))
    elif com == 'setLine:ofList:to:':
        return '{!s}[{!s}] = {!s};\n'.format(block[2], convert_block(block[1]), convert_block(block[3]))
    elif com == 'list:contains:':
        return 'contains({!s}, {!s})'.format(block[1], convert_block(block[2]))
    elif com == 'deleteLine:ofList:':
        if block[1] in ['all']:
            return '{!s}.clear();\n'.format(block[2])
        else:
            pass
    elif com == 'letter:of:':
        return convert_block(block[2]) + '.substr(' + convert_block(block[1]) + '-1, 1)';
    elif com == 'stopScripts':
        return 'return;\n'
    else:
        print('!!!' + com + '!!!')
    return ''


# convert to cpp
cpp_source = '/* converted by sb2_to_cpp */\n#include <bits/stdc++.h>\nusing namespace std;\n\n'

cpp_source += '''
class variable{
    



};
// overload every operator
// cin, cout

// every math function

'''

for var in scr_variables:
    cpp_source += 'string {!s} = "{!s}";\n'.format(var['name'], var['value'])
if scr_variables:
    cpp_source += '\n'

for li in scr_lists:
    cpp_source += 'vector<string> {!s} = {{'.format(li['listName'])
    cpp_source += ', '.join(list(map(str, li['contents'])))
    cpp_source += '};\n'
if scr_lists:
    cpp_source += '\n'


name_of_answer_variable = '_buf_answer'
cpp_source += 'string {!s}; // for "answer"\n\n'.format(name_of_answer_variable)
# TODO: escape reserved words of c++s


for script in scr_scripts:
    snippet, func_name = convert_script_list(script[2])
    cpp_source += 'int main(){\n' if func_name == 'main' else 'void {!s}(){{\n'.format(random_identifier_name()) 
    cpp_source += indent(snippet, 4)
    cpp_source += '}\n\n'


print('----------.cpp source----------')
print(cpp_source)


