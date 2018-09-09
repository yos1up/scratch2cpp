import os, sys
import zipfile
import json
import random
import logging


def sb2_to_cpp(infilename_sb2):
    '''
    infilename_sb2: input file name
    returns <str>,<str>,<str>:
        * conversion result (C++ script)
        * json script (extracted from sb2)
        * error message (empty if no error)
    '''
    if not os.path.exists(infilename_sb2):
        raise FileNotFoundError

    # extract project.json
    with zipfile.ZipFile(infilename_sb2) as myzip:
        with myzip.open('project.json') as myfile:
            json_source = myfile.read().decode(encoding='utf-8')


    # extract information needed for conversion
    jsonobj = json.loads(json_source)
    logging.info('----------variables----------')
    scr_variables = jsonobj['variables'] if 'variables' in jsonobj else []
    for var in scr_variables:
        logging.info(var['name'], var['value'], var['isPersistent'])
    logging.info('----------lists----------')
    scr_lists = jsonobj['lists'] if 'lists' in jsonobj else []
    for li in scr_lists:
        logging.info(li['listName'], li['contents'], li['isPersistent'])
    logging.info('----------scripts----------')
    scr_scripts = jsonobj['children'][0]['scripts']
    for script in scr_scripts:
        logging.info(script[2])

    # for reporting
    unknown_command_set = set()



    def try_int(s):
        try:
            return int(s)
        except:
            return None

    def try_float(s):
        try:
            return float(s)
        except:
            return None

    def process_literal(obj):
        '''
        obj <str/int/float>
        returns <str>
        if [obj] is interpretable as integer, return the integer stringified.
        else if [obj] is interpretable as numerical value, return the value stringified.
        if not interpretable, return the string double-quoted.
        '''
        if type(obj) == str:
            val = try_int(obj)
            if val is not None: return str(val)
            val = try_float(obj)
            if val is not None: return str(val)
            return '"' + obj + '"'
        else:
            return str(obj)


    def modify_identifier_name(name):
        '''
        variable name in Scratch is arbitrary,
        so there's need to change it so that
        C++ accepts.
        '''
        return 'var_' + name


    def random_identifier_name():
        return ''.join([chr(ord('a')+random.randrange(26)) for i in range(6)])

    def indent(snippet, num_space):
        '''
        snippet <str> : every row in it has return code.
        num_space <int>: >= 0 
        '''
        if snippet == '': return ''
        lines = snippet.split('\n')
        if lines[-1] == '': lines.pop()
        spaces = ' ' * num_space
        return ''.join([spaces + line + '\n' for line in lines])

    def convert_script_list(script_list):
        '''
        script_list <list>: its element is block
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
        block: ['name of command', args...]
        returns <str>: code snippet (C++)．
        '''
        if type(block) in [str, int, float]:
            return 'Var({!s})'.format(process_literal(block))
        com = block[0]
        if com == 'setVar:to:':
            return '{!s} = {!s};\n'.format(modify_identifier_name(block[1]), convert_block(block[2]))
        elif com == 'readVariable':
            return modify_identifier_name(block[1])
        elif com == 'doRepeat':
            counter_name = random_identifier_name()
            return 'for (int {0!s}=0;{0!s}<{1!s}.asNumber();{0!s}++){{\n'.format(counter_name, convert_block(block[1])) \
                    + indent(convert_script_list(block[2])[0], 4) \
                    + '}\n'
        elif com == 'doForever':
            return 'while (1){\n' \
                    + indent(convert_script_list(block[1])[0], 4) \
                    + '}\n'
        elif com in ['+','-','*','/','%','>','<']:
            return '(' + convert_block(block[1]) + com + convert_block(block[2]) + ')'
        elif com == '=':
            return '(' + convert_block(block[1]) + ' == ' + convert_block(block[2]) + ')'
        elif com == '&':
            return '(' + convert_block(block[1]) + ' && ' + convert_block(block[2]) + ')'
        elif com == '|':
            return '(' + convert_block(block[1]) + ' || ' + convert_block(block[2]) + ')'
        elif com == 'changeVar:by:':
            return modify_identifier_name(block[1]) + '+=' + convert_block(block[2]) + ';\n'
        elif com == 'answer':
            return name_of_answer_variable;
        elif com == 'rounded':
            return 'Var(round(' + convert_block(block[1]) + '.asNumber()))'
        elif com == 'computeFunction:of:':
            return block[1] + '(' + convert_block(block[2]) + '.asNumber())'
        elif com == 'concatenate:with:':
            return 'Var(' + convert_block(block[1]) + '.asString() + ' + convert_block(block[2]) + '.asString())'
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
        elif com == 'append:toList:': # TODO: out-of-range access 
            return '{!s}.push_back({!s});\n'.format(modify_identifier_name(block[2]), convert_block(block[1]))
        elif com == 'getLine:ofList:': # TODO: out-of-range access 
            return '{!s}[(int){!s}.asNumber()]'.format(modify_identifier_name(block[2]), convert_block(block[1]))
        elif com == 'setLine:ofList:to:':
            return '{!s}[(int){!s}.asNumber()] = {!s};\n'.format(modify_identifier_name(block[2]), convert_block(block[1]), convert_block(block[3]))
        elif com == 'list:contains:':
            return '(find({0!s}.begin(), {0!s}.end(), {1!s}) != {0!s}.end())'.format(modify_identifier_name(block[1]), convert_block(block[2]))
        elif com == 'deleteLine:ofList:':
            if block[1] in ['all']:
                return '{!s}.clear();\n'.format(modify_identifier_name(block[2]))
            else:
                pass
        elif com == 'letter:of:':
            return 'Var(' + convert_block(block[2]) + '.asString().substr((int)' + convert_block(block[1]) + '.asNumber()-1, 1))'
        elif com == 'stopScripts':
            return 'return 0;\n'
        else:
            logging.warning('!!! WARNING: unknown command: ' + com + ' !!!')
            unknown_command_set.add(com)
            return '/* [unknown] ' + com + ' */'


    # convert to cpp
    cpp_source = '/* converted by sb2_to_cpp */\n#include <bits/stdc++.h>\n#define debug cerr << "--" << __LINE__ << "--" << endl\nusing namespace std;\n\n'
    error_message = ''

    cpp_source += '''
class Var{
public:
    string sval;
    double dval;
    enum VarType {STRING = 0, NUMBER = 1};
    VarType type;
    enum NumericState {UNKNOWN = -1, STRINGY = 0, NUMERIC = 1};
    mutable NumericState numericState;

    Var(){sval = ""; type = STRING; numericState = STRINGY;}
    Var(string s){
        sval = s; type = STRING; numericState = UNKNOWN;
    }
    Var(double d){dval = d; type = NUMBER; numericState = NUMERIC;}

    static bool isNumericString(const string &s) { // very costly. (> 0.5 ms/call)
        regex re ("^[-+]?[0-9]*\\\\.?[0-9]+([eE][-+]?[0-9]+)?$");
        return regex_match(s, re);
        // TODO: In Scratch '000' is regarded as non-numeric.
    }
    bool isNumeric() const{
        if (type == NUMBER) return true;
        if (numericState != UNKNOWN) return numericState == NUMERIC;
        bool numeric = isNumericString(sval);
        numericState = (numeric) ? NUMERIC : STRINGY;
        return numeric;
    }
    double asNumber() const{
        if (type == NUMBER) return dval;
        return (isNumeric()) ? atof(sval.c_str()) : 0.0;
    }
    string asString() const{
        if (type == STRING) return sval;
        return to_string(dval);
    }
    Var operator+(const Var &y) const{
        return Var(this->asNumber() + y.asNumber());
    }
    Var operator+=(const Var &y){
        *this = *this + y;
        return *this;
    }
    Var operator-(const Var &y) const{
        return Var(this->asNumber() - y.asNumber());
    }
    Var operator*(const Var &y) const{
        return Var(this->asNumber() * y.asNumber());
    }
    Var operator/(const Var &y) const{
        return Var(this->asNumber() / y.asNumber());
    }
    Var operator%(const Var &y) const{
        return Var(fmod(this->asNumber(), y.asNumber()));
    }
    bool operator<(const Var &y) const{
        if (this->isNumeric() && y.isNumeric()){
            return this->asNumber() < y.asNumber();
        }// compare as number if both can be interpreted as numeric
        return this->asString() < y.asString();
    }
    bool operator>(const Var &y) const{
        return y < *this;
    }
    bool operator==(const Var &y) const{
        if (this->isNumeric() && y.isNumeric()){
            return this->asNumber() == y.asNumber();
        }// compare as numeric if both are numeric
        return this->asString() == y.asString();
    }
    friend ostream& operator << (ostream& os, const Var& p);
    friend istream& operator >> (istream& is, const Var& p);
};
ostream& operator << (ostream& os, const Var& p){
    if (p.isNumeric()) os << p.asNumber();
    else os << p.asString();
    return os;
}
istream& operator >> (istream& is, Var& p){
    string s; is >> s; p = Var(s);
    return is;
}
'''
    name_of_answer_variable = 'buf_answer'
    cpp_source += 'Var {!s}; // for "answer"\n\n'.format(name_of_answer_variable)

    cpp_source += '// ==================== Scripts ====================\n'



    for var in scr_variables:
        cpp_source += 'Var {!s}({!s});\n'.format(modify_identifier_name(var['name']), process_literal(var['value']))
    if scr_variables:
        cpp_source += '\n'

    for li in scr_lists:
        cpp_source += 'vector<Var> {!s} = {{'.format(modify_identifier_name(li['listName']))
        cpp_source += ', '.join(['Var({!s})'.format(process_literal(item)) for item in li['contents']])
        cpp_source += '};\n'
    if scr_lists:
        cpp_source += '\n'


    for script in scr_scripts:
        snippet, func_name = convert_script_list(script[2])
        cpp_source += 'int main(){\n' if func_name == 'main' else 'int {!s}(){{\n'.format(random_identifier_name()) 
        cpp_source += indent(snippet, 4)
        cpp_source += '}\n\n'


    logging.info('----------.cpp source----------')
    logging.info(cpp_source)
    logging.info('===============================')

    if unknown_command_set:
        error_message += 'WARNING: the following commands are not converted: ' + ', '.join(unknown_command_set)

    return cpp_source, json_source, error_message


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(usage='convert .sb2 to .cpp')
    parser.add_argument('infile', help='input file name (.sb2)')
    parser.add_argument('-o', '--outfile', default='a.cpp', help='output file name (.cpp)')
    parser.add_argument('-j', '--jsonfile', default='', help='json file name to output')
    args = parser.parse_args()

    cpp_source, json_source, error_message = sb2_to_cpp(args.infile)

    if error_message != '':
        print(error_message)
    else:
        print('conversion successful')

    if args.jsonfile != '':
        with open(args.jsonfile, 'w') as f:
            f.write(json_source)

    with open(args.outfile, 'w') as f:
        f.write(cpp_source)





