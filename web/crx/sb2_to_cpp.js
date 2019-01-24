// for reporting
var unknown_command_set;
var name_of_answer_variable = 'buf_answer';

function sb2ProjectJsonToCpp(projectJsonString){
    let error_infos = [];
    const jsonobj = JSON.parse(projectJsonString);

    scr_variables = ('variables' in jsonobj) ? jsonobj['variables'] : [];
    scr_lists = ('lists' in jsonobj) ? jsonobj['lists'] : [];
    scr_scripts = [];

    let validAsSB2 = true;
    if ('children' in jsonobj){
        for (let element of jsonobj['children']){
            if ('scripts' in element){
                Array.prototype.push.apply(scr_scripts, element['scripts']);
            } 
        }
    }else{
        validAsSB2 = false;
    }

    unknown_command_set = new Set();
    var cpp_source = `/* converted by scratch2cpp (https://github.com/yos1up/scratch2cpp)
   This script is compatible with the following compilers:
   - GCC (unless every name of variables contains non-ascii characters)
   - Clang 
*/
#include <iostream>
#include <stdlib.h>
#include <string>
#include <vector>
#include <algorithm>
#include <math.h>
#define debug cerr << "--" << __LINE__ << "--" << "\\n"
using namespace std;

const double EPS = 1e-8;

static int roundToInt(double x){
    return (x < 0) ? -(int)(-x + 0.5) : (int)(x + 0.5);
}


class Var{
public:
    string sval;
    double dval;
    enum VarType {STRING = 0, NUMBER = 1};
    VarType type;
    enum NumericState {UNKNOWN = -1, STRINGY = 0, NUMERIC = 1};
    mutable NumericState numericState;

    Var(){sval = ""; type = STRING; numericState = STRINGY;} // represent null?
    Var(string s){
        sval = s; type = STRING; numericState = UNKNOWN;
    }
    Var(double d){dval = d; type = NUMBER; numericState = NUMERIC;}
    Var(const Var &v){
        sval = string(v.sval); dval = v.dval;
        type = v.type; numericState = v.numericState;
    }
    static bool isNumericString(const string &s) {
        char* ep;
        //cause side-effect: errno can be ERANGE after calling strtod
        strtod(s.c_str(), &ep);
        //Scratch 3.0 recognize the string cause underflows or overflows as Numeric
        return NULL != ep && '\\0' == ep[0] && s[0] != '\\0';
        // TODO: In Scratch '000' is regarded as non-numeric (but here regarded as numeric)
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
    static bool isNearInteger(const double &x){
        return fabs(round(x) - x) < EPS;
        // TODO: allow integer type in Var class
    }
    static bool isNearNumber(const double &x, const double &y){
        return fabs(x - y) < EPS;
    }
    string asString() const{
        if (type == STRING) return sval;
        if (isNearInteger(dval)) return to_string(roundToInt(dval));
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
    os << p.asString();
    return os;
}
istream& operator >> (istream& is, Var& p){
    string s; is >> s; p = Var(s);
    return is;
}

Var letterOf(Var index, Var sourceString){
    /* index: 1-origined */
    string str = sourceString.asString();
    int idx = (int)(index.asNumber() - 1);
    // seem to be dirty but Scratch seems to do like this.
    // ex. letterOf(0.01, "world") == "w", letterOf(1.99, "world") == "w", letterOf(5.99, "world") == "d"
    if (0 <= idx && idx < str.size()) return Var(str.substr(idx, 1));
    return Var();
}

// TODO: should we make a new class for vector<Var>?
Var getLineOfList(const Var &index, const vector<Var> &list){
    /* index: 1-origined */
    int idx = (int)index.asNumber() - 1;
    // (unlike 'letterOf', index==0.9 does not work.)
    if (0 <= idx && idx < list.size()) return list[idx];
    return Var();
}
void setLineOfListTo(const Var &index, vector<Var> &list, const Var &v){
    /* index: 1-origined */
    int idx = (int)index.asNumber() - 1;
    if (0 <= idx && idx < list.size()) list[idx] = v;
}
void deleteLineOfList(const Var &index, vector<Var> &list){
    /* index: 1-origined */
    int idx = (int)index.asNumber() - 1;
    if (0 <= idx && idx < list.size()) list.erase(list.begin() + idx);
}
void insertAtIndexOfList(const Var &item, const Var &index, vector<Var> &list){
    /* index: 1-origined */
    int idx = (int)index.asNumber() - 1;
    if (0 <= idx && idx <= list.size()) list.insert(list.begin() + idx, item);   
}
void insertAtRandomOfList(const Var &item, vector<Var> &list){
    int idx = rand() % (list.size() + 1);
    list.insert(list.begin() + idx, item);
}
Var contentsOfList(const vector<Var> &list){
    /* concatenate elements of list with space */
    string ret;
    for(int i=0;i<list.size();i++){
        if (i > 0) ret += ' ';
        ret += list[i].asString();
    }
    return Var(ret);
}

double randUniform(double x, double y){
    if (x > y) return randUniform(y, x);
    if (Var::isNearInteger(x) && Var::isNearInteger(y)){
        int xi = roundToInt(x), yi = roundToInt(y);
        return xi + rand() % (yi - xi + 1);
    }else{
        return x + (y - x) * (0.0 + rand()) / RAND_MAX;
    }
}

`;
    
    cpp_source += 'Var ' + name_of_answer_variable + '; // for "answer"\n\n';

    cpp_source += '// ============================= Scripts =============================\n';


    // declare variables (Var)
    for (let vari of scr_variables){
        cpp_source += 'Var '+modify_variable_name(vari['name'])+'('+process_literal(vari['value'])+');\n';
    }
    if (scr_variables.length > 0){
        cpp_source += '\n';
    }

    // declare variables (vector<Var>)
    for (let li of scr_lists){
        cpp_source += 'vector<Var> '+modify_variable_name(li['listName'])+' = {';
        cpp_source += li['contents'].map(item => 'Var('+process_literal(item)+')').join(', ');
        cpp_source += '};\n';
    }
    if (scr_lists.length > 0){
        cpp_source += '\n';
    }

    // define functions (prototype)
    cpp_source += '// prototype declaration\n';
    for (let script of scr_scripts){
        let rslt = convert_script_list(script[2]);
        let snippet = rslt[0];
        let func_signature = rslt[1];
        if (func_signature.length == 0){ // 無名のコードブロックの場合
            continue; //func_signature = [random_identifier_name()]; // ランダムな名前の0変数関数として扱う．
        }
        let args = func_signature.slice(1).map(v => 'const Var &'+v).join(', ');
        cpp_source += 'int '+func_signature[0]+'('+args+');\n'; 
    }
    cpp_source += '\n';


    // define functions (contents)
    let existsMain = false;
    for (let script of scr_scripts){
        let rslt = convert_script_list(script[2]);
        let snippet = rslt[0];
        let func_signature = rslt[1];
        if (func_signature.length == 0){ // 無名のコードブロックの場合
            continue; //func_signature = [random_identifier_name()]; // ランダムな名前の0変数関数として扱う．
        }
        let args = func_signature.slice(1).map(v => 'const Var &'+v).join(', ');
        cpp_source += 'int '+func_signature[0]+'('+args+'){\n'; 
        cpp_source += indent(snippet, 4);
        cpp_source += indent('return 0;\n', 4);
        cpp_source += '}\n\n';
        if (func_signature[0] === 'main') existsMain = true;
    }

    if (!validAsSB2){
        error_infos.push({'code':-1, 'message':'invalid as SB2'});
        cpp_source = '';
    } else if (!existsMain){
        error_infos.push({'code':2, 'message':'no entry point'});
    }
    if (unknown_command_set.size > 0){
        error_infos.push({'code':1, 'message':Array.from(unknown_command_set).join(',')});
    }
    return [cpp_source, error_infos];
}







function process_literal(obj){
    /*
    obj <str/int/float>
    returns <str>
    if [obj] is interpretable as integer, return the integer stringified.
    else if [obj] is interpretable as numerical value, return the value stringified.
    if not interpretable, return the string double-quoted.
    */
    if (typeof obj == 'string'){
        if ($.isNumeric(obj)){
            return obj;
        }else{
            return '"' + obj + '"';
        }
    }else{
        return '' + obj; 
    }
}

function modify_variable_name(name){
    /*
    variable name in Scratch is arbitrary,
    so there's need to change it so that
    C++ accepts.
    */
    return 'var_' + name;
}

function modify_function_name(name){
    return 'func_' + name;
}

function modify_argument_name(name){
    return 'arg_' + name;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function random_identifier_name(){
    var ret = '';
    for(let i=0;i<8;i++) ret += String.fromCharCode('a'.charCodeAt(0) + getRandomInt(26));
    return ret;
}

function indent(snippet, num_space){
    /*
    snippet <str> : every row in it has return code.
    num_space <int>: >= 0 
    */
    if (snippet == '') return '';
    var lines = snippet.split('\n');
    if (lines[lines.length-1] == '') lines.pop();
    var spaces = Array(num_space+1).join(' ');
    return lines.map(line => spaces + line + '\n').join('');
}

function convert_script_list(script_list){
    /*
    script_list <list>: its element is block
    returns:
        snippet <str>: code
        func_signature <list of str>:
            (if not method) []
            (if method) ['method_name', 'arg_name', 'arg_name', ...]
    '*/
    var func_signature = [];
    var snippet = '';
    var offset = 0;
    if (script_list[0][0] == 'whenGreenFlag'){
        func_signature = ['main'];
        offset = 1;
    }else if (script_list[0][0] == 'procDef'){
        func_signature = [modify_function_name(script_list[0][1].split(' ')[0])].concat(script_list[0][2].map(modify_argument_name));
        offset = 1;
    }

    for (var block of script_list.slice(offset)){
        snippet += convert_block(block);
    }

    // add semicolon to non-sentence snippet
    if (snippet != '' && snippet.charAt(snippet.length-1) != '\n') snippet += ';\n';

    return [snippet, func_signature];
}



function convert_block(block){
    /*
    block: ['name of command', args...]
    returns <str>: code snippet (C++)．

    list of opcode: https://en.scratch-wiki.info/wiki/Scratch_File_Format/Block_Selectors
    */
    if (['number', 'string'].indexOf(typeof block) >= 0){
        return 'Var(' + process_literal(block) + ')';
    }
    var com = block[0];
    if (com === 'setVar:to:'){
        // TODO: do we need to pass by value instead of pass by reference? <= ex. increment ??
        return modify_variable_name(block[1]) + ' = ' + convert_block(block[2]) + ';\n';
    }else if (com === 'readVariable'){
        return modify_variable_name(block[1]);
    }else if (['+','-','*','/','%','>','<'].indexOf(com) >= 0){
        return '(' + convert_block(block[1]) + com + convert_block(block[2]) + ')';
    }else if (com === '='){
        return '(' + convert_block(block[1]) + ' == ' + convert_block(block[2]) + ')';
    }else if (com === '&'){
        return '(' + convert_block(block[1]) + ' && ' + convert_block(block[2]) + ')';
    }else if (com === '|'){
        return '(' + convert_block(block[1]) + ' || ' + convert_block(block[2]) + ')';
    }else if (com === 'not'){
        return '(!' + convert_block(block[1]) + ')';
    }else if (com === 'doRepeat'){
        var counter_name = random_identifier_name();
        return 'for (int '+counter_name+'=0;'+counter_name+'<'+convert_block(block[1])+'.asNumber();'+counter_name+'++){\n'
                + indent(convert_script_list(block[2])[0], 4)
                + '}\n';
    }else if (com === 'doUntil'){
        return 'while (!('+convert_block(block[1])+')){\n'
                + indent(convert_script_list(block[2])[0], 4)
                + '}\n';
    }else if (com === 'doForever'){
        return 'while (1){\n'
                + indent(convert_script_list(block[1])[0], 4)
                + '}\n';
    }else if (com === 'changeVar:by:'){
        return modify_variable_name(block[1]) + '+=' + convert_block(block[2]) + ';\n';
    }else if (com === 'answer'){
        return name_of_answer_variable;
    }else if (com === 'rounded'){
        return 'Var(round(' + convert_block(block[1]) + '.asNumber()))';
    }else if (com === 'randomFrom:to:'){
        return 'Var(randUniform(' + convert_block(block[1]) + '.asNumber(), ' + convert_block(block[2]) + '.asNumber()))';
    }else if (com === 'computeFunction:of:'){
        var func_name = block[1];
        if (func_name === '10 ^'){
            return 'Var(pow(10.0, ' + convert_block(block[2]) + '.asNumber()))';
        }
        dic = {'abs':'fabs', 'ceiling':'ceil', 'ln':'log', 'log':'log10', 'e ^':'exp'};
        if (func_name in dic) func_name = dic[func_name];
        return 'Var(' + func_name + '(' + convert_block(block[2]) + '.asNumber()))';
    }else if (com === 'concatenate:with:'){
        return 'Var(' + convert_block(block[1]) + '.asString() + ' + convert_block(block[2]) + '.asString())';
    }else if (com === 'doIf'){
        return 'if ('+convert_block(block[1])+'){\n'
                + indent(convert_script_list(block[2])[0], 4)
                + '}\n';
    }else if (com === 'doIfElse'){
        return 'if ('+convert_block(block[1])+'){\n'
                + indent(convert_script_list(block[2])[0], 4)
                + '}else{\n'
                + indent(convert_script_list(block[3])[0], 4)
                + '}\n';
    }else if (com === 'doAsk'){
        return 'cin >> '+name_of_answer_variable+';\n';
    }else if (com === 'say:'){
        return 'cout << '+convert_block(block[1])+' << "\\n";\n';
    }else if (com === 'think:'){
        return 'cerr << '+convert_block(block[1])+' << "\\n";\n';
    }else if (com === 'lineCountOfList:'){
        return 'Var('+modify_variable_name(block[1])+'.size())';
    }else if (com === 'append:toList:'){ 
        return modify_variable_name(block[2])+'.push_back('+convert_block(block[1])+');\n';
    }else if (com === 'getLine:ofList:'){
        return 'getLineOfList(' + convert_block(block[1]) + ', ' + modify_variable_name(block[2]) + ')';
    }else if (com === 'setLine:ofList:to:'){
        return 'setLineOfListTo(' + convert_block(block[1]) + ', ' + modify_variable_name(block[2]) + ', ' + convert_block(block[3]) + ');\n';
    }else if (com === 'list:contains:'){
        var li = modify_variable_name(block[1]);
        return '(find('+li+'.begin(), '+li+'.end(), '+convert_block(block[2])+') != '+li+'.end())';
    }else if (com === 'deleteLine:ofList:'){
        if (block[1] === 'all'){
            return modify_variable_name(block[2])+'.clear();\n';
        }else if (block[1] === 'last'){
            return modify_variable_name(block[2])+'.pop_back();\n';
        }else{ // by index
            return 'deleteLineOfList(' + convert_block(block[1]) + ',' + modify_variable_name(block[2]) + ');\n';
        }
    }else if (com === 'insert:at:ofList:'){
        if (block[2] === 'last'){
            return modify_variable_name(block[3])+'.push_back('+convert_block(block[1])+');\n';
        }else if (block[2] === 'random'){
            return 'insertAtRandomOfList(' + convert_block(block[1]) + ',' + modify_variable_name(block[3]) + ');\n';
        }else{
            return 'insertAtIndexOfList(' + convert_block(block[1]) + ',' + convert_block(block[2]) + ',' + modify_variable_name(block[3]) + ');\n';
        } 
    }else if (com === 'contentsOfList:'){
        return 'contentsOfList(' + modify_variable_name(block[1]) + ')';
    }else if (com === 'stringLength:'){
        return 'Var(' + convert_block(block[1]) + '.asString().size())';
    }else if (com === 'letter:of:'){
        return 'letterOf(' + convert_block(block[1]) +  ',' + convert_block(block[2]) + ')';
    }else if (com === 'getParam'){
        return modify_argument_name(block[1]);
    }else if (com === 'call'){
        var func_name = block[1].split(' ')[0];
        var args = block.slice(2).map(convert_block).join(',');
        return modify_function_name(func_name)+'('+args+');\n';
    }else if (com === 'stopScripts'){
        return 'return 0;\n';
    }else{
        unknown_command_set.add(com);
        return '/* [unknown] ' + JSON.stringify(block) + ' *'+'/';
    }
}







