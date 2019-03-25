
class Sb3ToCppConverter {

    initialize(){
        // for reporting
        this.unknownCommandSet = new Set();
        this.nonAsciiIdentifierSet = new Set();
        this.usedVariableSet = new Set();
        this.usedListSet = new Set();
        this.loopCounterIndex = 0;
        this.nameOfAnswerVariable = 'buf_answer';
    }

    convert(projectJsonString, compiler='GCC') {
        /*
        convert `project.json` string to C++ script string.

        Args:
            projectJsonString (str):
                content of file `project.json`, obtained by unzipping .sb3

            compiler (str, optional):
                Specify the compiler. The output C++ code can be compiled with it.
                    'GCC' (default)
                        All non-ascii characters in identifier names are escaped.
                    'Clang'
                        All non-ascii characters in identifier names are not escaped. 

        Returns:
            [
                - cppSource (str):
                    self-contained C++ script.

                - errorInfos (Array of strings):
                    [
                        {
                            - 'code' (int):
                                error code.
                            - 'message' (str):
                                support message.
                        }, ...
                    ]
            ]
        */
        this.compiler = compiler;


        let cppSource = `/*
    Converted from Scratch by scratch2cpp (https://github.com/yos1up/scratch2cpp).
*/
#include <iostream>
#include <stdlib.h>
#include <string>
#include <vector>
#include <algorithm>
#include <math.h>
#define debug cerr << "--" << __LINE__ << "--" << "\\n"
typedef long long ll;
using namespace std;

const double EPS = 1e-8;

class Var{ // NOTE: immutable
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
    /*
    static bool isNearInteger(const double &x){
        return fabs(round(x) - x) < EPS;
        // TODO: allow integer type in Var class
    }
    static bool isNearNumber(const double &x, const double &y){
        return fabs(x - y) < EPS;
    }
    */
    string asString() const{
        if (type == STRING) return sval;
        if (floor(dval) == dval) return to_string((ll)round(dval));
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

class VarList{
public:
    vector<Var> data;
    VarList(const vector<Var> &x) { data = x; }
    void push_back(const Var &x){ data.push_back(x); }
    void pop_back(){ data.pop_back(); }
    void clear(){ data.clear(); }
    int size(){ return (int) data.size(); }
    Var getLineOfList(const Var &index) const{
        /* index: 1-origined */
        int idx = (int)index.asNumber() - 1;
        // (unlike 'letterOf', index==0.9 does not work.)
        if (0 <= idx && idx < data.size()) return data[idx];
        return Var();
    }
    void setLineOfListTo(const Var &index, const Var &v){
        /* index: 1-origined */
        int idx = (int)index.asNumber() - 1;
        if (0 <= idx && idx < data.size()) data[idx] = v;
    }
    void deleteLineOfList(const Var &index){
        /* index: 1-origined */
        string kwd = index.asString();
        if (kwd == "all"){
            data.clear();
        }else if (kwd == "last"){
            data.pop_back();
        }else{
            int idx = (int)index.asNumber() - 1;
            if (0 <= idx && idx < data.size()) data.erase(data.begin() + idx);
        }
    }
    void insertAtIndexOfList(const Var &item, const Var &index){
        /* index: 1-origined */
        int idx = (int)index.asNumber() - 1;
        if (0 <= idx && idx <= data.size()) data.insert(data.begin() + idx, item);   
    }
    void insertAtRandomOfList(const Var &item){
        int idx = rand() % (data.size() + 1);
        data.insert(data.begin() + idx, item);
    }
    string asString() const{
        /* concatenate elements of list with space */
        // TODO: concatenated without spaces only if all elements are single characters.
        // (Is it an official bug? (or feature?))
        string ret;
        for(int i=0;i<data.size();i++){
            if (i > 0) ret += ' ';
            ret += data[i].asString();
        }
        return ret;        
    }
    int itemNumOfList(const Var &item) const{
        auto itr = find(data.begin(), data.end(), item);
        if (itr == data.end()) return 0;
        return 1 + (int)(itr - data.begin());
        /* index: 1-origined */
    }
    friend ostream& operator << (ostream& os, const VarList& p);
};
ostream& operator << (ostream& os, const VarList& p){
    os << p.asString();
    return os;
}

double randUniform(double x, double y){
    if (x > y) return randUniform(y, x);
    if (floor(x) == x && floor(y) == y){
        ll xi = (ll)round(x), yi = (ll)round(y);
        return xi + rand() % (yi - xi + 1);
    }else{
        return x + (y - x) * (0.0 + rand()) / RAND_MAX;
    }
}

`;

        let errorInfos = [];
        const jsonobj = JSON.parse(projectJsonString);

        let validAsSB3 = true;
        let variables, lists, blocks;
        if ('targets' in jsonobj) {
            variables = jsonobj['targets'][0]['variables'];
            lists = jsonobj['targets'][0]['lists'];

            blocks = jsonobj['targets'][1]['blocks']; // 配置されている全てのブロックの一覧．
        } else {
            validAsSB3 = false;
        }

        // このクラスのメンバ変数の初期化．
        this.initialize();

        cppSource += 'Var ' + this.nameOfAnswerVariable + '; // for "answer"\n\n';
        cppSource += '// ============================= Scripts =============================\n\n';


        // These are appended to cppSource finally.．
        let variableDeclareSource = "// variable declaration\n";
        let listDeclareSource = "// list declaration\n";
        let funcPrototypeSource = "// prototype declaration of functions\n";
        let funcContentSource = "// contents of functions\n";


        let mainCnt = 0;
        for (let blockID in blocks){
            switch (blocks[blockID]['opcode']) {
                case 'event_whenflagclicked':
                    mainCnt++;
                case 'procedures_definition':
                    let rslt = this.convertFrom(blockID, blocks);
                    let snippet = rslt[0];
                    let funcSignature = rslt[1];
                    let args = funcSignature.slice(1).map(v => 'const Var &'+v).join(', ');
                    funcPrototypeSource += 'int '+funcSignature[0]+'('+args+');\n'; 
                    funcContentSource += 'int '+funcSignature[0]+'('+args+'){\n'; 
                    funcContentSource += Sb3ToCppConverter.indent(snippet, 4);
                    funcContentSource += Sb3ToCppConverter.indent('return 0;\n', 4);
                    funcContentSource += '}\n\n';
                    break;
            }
        }


        // declare variables (Var)
        for (let varID in variables) {
            let name = variables[varID][0];
            if (!this.usedVariableSet.has(name)) continue;
            let initialValue = variables[varID][1];
            variableDeclareSource += 'Var ' + this.modifyVariableName(name) + '(' + Sb3ToCppConverter.processLiteral(initialValue) + ');\n';
        }

        // declare variables (vector<Var>)
        for (let listID in lists) {
            let name = lists[listID][0];
            if (!this.usedListSet.has(name)) continue;
            let initialValue = lists[listID][1];
            listDeclareSource += 'VarList ' + this.modifyListName(name) + '({';
            listDeclareSource += initialValue.map(item => 'Var(' + Sb3ToCppConverter.processLiteral(item) + ')').join(', ');
            listDeclareSource += '});\n';
        }

        // NOTE: 未使用変数は C++ コード上では宣言されないようになっている．
        //（Scratch3.0 ではデフォルトで "つくったへんすう" という名前の変数が宣言だけされているが，
        // この名前の変数が C++ コードに毎回登場するのを避けたい（非ascii文字がありGCCでコンパイルできなくなる）

        cppSource +=  variableDeclareSource + '\n'
                    + listDeclareSource + '\n'
                    + funcPrototypeSource + '\n'
                    + funcContentSource;

        // AtCoder 上での「バイト数」を 100 の倍数に正規化する処理
        //（「提出一覧」から scratch2cpp で生成されたコードを発見しやすくするための処置です）
        cppSource = Sb3ToCppConverter.makeByteLengthNice(cppSource);

        if (!validAsSB3){
            errorInfos.push({'code':-1, 'message':'invalid as SB3'});
            cppSource = '';
        } else if (mainCnt === 0){
            errorInfos.push({'code':2, 'message':'no entry point'});
        } else if (mainCnt > 1){
            errorInfos.push({'code':3, 'message':'multiple entry points'});
        }
        if (this.unknownCommandSet.size > 0){
            errorInfos.push({'code':1, 'message':Array.from(this.unknownCommandSet).join(',')});
        }
        if (this.nonAsciiIdentifierSet.size > 0){
            errorInfos.push({'code':4, 'message':Array.from(this.nonAsciiIdentifierSet).join(',')});
        }
        return [cppSource, errorInfos];
    }

    modifyVariableName(name){
        /*
        variable name in Scratch is arbitrary,
        so there's need to change it so that
        C++ accepts.
        */
        this.usedVariableSet.add(name);
        if (Sb3ToCppConverter.hasNonAscii(name)) this.nonAsciiIdentifierSet.add(name);
        const escapeNonAscii = (this.compiler === 'GCC');
        return 'var_' + Sb3ToCppConverter.escapeInvalidCharacter(name, escapeNonAscii);
    }

    modifyListName(name){
        this.usedListSet.add(name);
        if (Sb3ToCppConverter.hasNonAscii(name)) this.nonAsciiIdentifierSet.add(name);
        const escapeNonAscii = (this.compiler === 'GCC');
        return 'list_' + Sb3ToCppConverter.escapeInvalidCharacter(name, escapeNonAscii);
    }

    modifyFunctionName(name){
        if (Sb3ToCppConverter.hasNonAscii(name)) this.nonAsciiIdentifierSet.add(name);
        const escapeNonAscii = (this.compiler === 'GCC');
        return 'func_' + Sb3ToCppConverter.escapeInvalidCharacter(name, escapeNonAscii);
    }

    modifyArgumentName(name){
        if (Sb3ToCppConverter.hasNonAscii(name)) this.nonAsciiIdentifierSet.add(name);
        const escapeNonAscii = (this.compiler === 'GCC');
        return 'arg_' + Sb3ToCppConverter.escapeInvalidCharacter(name, escapeNonAscii);
    }

    convertFrom(blockID, allBlocksInfo) {
        /*
        Args:
            blockID (str)
                its element is block
            allBlocksInfo (dict)
                dict-object which contains all blocks information

        Returns:
            [
                snippet <str>: code (if method, method signature is not included)
                funcSignature <list of str>:
                    (if not method) []
                    (if method) ['method_name', 'arg_name', 'arg_name', ...]
            ]
        '*/
        let snippet = '';
        let funcSignature = [];
        if (blockID) {
            try {
                const blockInfo = allBlocksInfo[blockID];
                const opcode = blockInfo['opcode'];

                let variableName, listName, conditionBlockID, substackBlockID, innerSnippet, value, value2,
                    procProtoBlockID, funcName, argNames;
                
                switch (opcode) {
                    case 'argument_reporter_string_number':
                        snippet = this.modifyArgumentName(blockInfo['fields']['VALUE'][0]);
                        break;
                    case 'control_forever':
                        innerSnippet = this.processValueInfo(blockInfo['inputs']['SUBSTACK'], allBlocksInfo);
                        snippet = 'while (1){\n' + Sb3ToCppConverter.indent(innerSnippet, 4) + '}\n';
                        break;
                    case 'control_repeat':
                        innerSnippet = this.processValueInfo(blockInfo['inputs']['SUBSTACK'], allBlocksInfo);
                        // let cntName = randomIdentifierName();
                        let cntName = `cnt_${this.loopCounterIndex}`;
                        this.loopCounterIndex++;
                        snippet = `for (int ${cntName}=0;${cntName}<${this.processValueInfo(blockInfo['inputs']['TIMES'], allBlocksInfo)}.asNumber();${cntName}++){\n` + Sb3ToCppConverter.indent(innerSnippet, 4) + '}\n';
                        break;
                    case 'control_repeat_until':
                        innerSnippet = this.processValueInfo(blockInfo['inputs']['SUBSTACK'], allBlocksInfo);
                        snippet = `while (!${this.processValueInfo(blockInfo['inputs']['CONDITION'], allBlocksInfo)}){\n` + Sb3ToCppConverter.indent(innerSnippet, 4) + '}\n';
                        break;
                    case 'control_if':
                        innerSnippet = this.processValueInfo(blockInfo['inputs']['SUBSTACK'], allBlocksInfo);
                        snippet = `if (${this.processValueInfo(blockInfo['inputs']['CONDITION'], allBlocksInfo)}){\n` + Sb3ToCppConverter.indent(innerSnippet, 4) + '}\n';
                        break;
                    case 'control_if_else':
                        innerSnippet = this.processValueInfo(blockInfo['inputs']['SUBSTACK'], allBlocksInfo); // not SUBSTACK1
                        snippet = `if (${this.processValueInfo(blockInfo['inputs']['CONDITION'], allBlocksInfo)}){\n` + Sb3ToCppConverter.indent(innerSnippet, 4) + '} else {\n';
                        innerSnippet = this.processValueInfo(blockInfo['inputs']['SUBSTACK2'], allBlocksInfo);
                        snippet += Sb3ToCppConverter.indent(innerSnippet, 4) + '}\n';
                        break;
                    case 'control_stop':
                        snippet = 'return 0;\n';
                        break;
                    case 'event_whenflagclicked':
                        funcSignature = ['main'];
                        break;
                    case 'data_setvariableto':
                        variableName = this.modifyVariableName(blockInfo['fields']['VARIABLE'][0]);
                        value = this.processValueInfo(blockInfo['inputs']['VALUE'], allBlocksInfo);
                        snippet = `${variableName} = ${value};\n`;
                        break;
                    case 'data_changevariableby':
                        variableName = this.modifyVariableName(blockInfo['fields']['VARIABLE'][0]);
                        value = this.processValueInfo(blockInfo['inputs']['VALUE'], allBlocksInfo);
                        snippet = `${variableName} += ${value};\n`;
                        break;
                    case 'data_deleteoflist':
                        listName = this.modifyListName(blockInfo['fields']['LIST'][0]);
                        value = this.processValueInfo(blockInfo['inputs']['INDEX'], allBlocksInfo);
                        // NOTE: 「"all" 番目を削除する」が動的に生じうる
                        // （「("a"と"ll")番目を削除」で全削除の挙動になった．）
                        // （「("las"と"t")番目を削除」で最終要素削除の挙動になった．）
                        snippet = `${listName}.deleteLineOfList(${value});\n`;
                        break;
                    case 'data_deletealloflist':
                        listName = this.modifyListName(blockInfo['fields']['LIST'][0]);
                        snippet = `${listName}.clear();\n`;
                        break;
                    case 'data_insertatlist':
                        listName = this.modifyListName(blockInfo['fields']['LIST'][0]);
                        value = this.processValueInfo(blockInfo['inputs']['INDEX'], allBlocksInfo);
                        value2 = this.processValueInfo(blockInfo['inputs']['ITEM'], allBlocksInfo);
                        snippet = `${listName}.insertAtIndexOfList(${value}, ${value2});\n`;
                        break;
                    // case 'data_contentsoflist': // .sb3 で消えた？（.sb2 から引き継がれたプロジェクトにのみ残存しうる？）
                    case 'data_itemnumoflist': // .sb3 で新登場
                        listName = this.modifyListName(blockInfo['fields']['LIST'][0]);
                        value = this.processValueInfo(blockInfo['inputs']['ITEM'], allBlocksInfo);
                        snippet = `Var(${listName}.itemNumOfList(${value}))`;                   
                        break;
                    case 'data_addtolist':
                        listName = this.modifyListName(blockInfo['fields']['LIST'][0]);
                        value = this.processValueInfo(blockInfo['inputs']['ITEM'], allBlocksInfo);
                        snippet = `${listName}.push_back(${value});\n`;
                        break;
                    case 'data_lengthoflist':
                        listName = this.modifyListName(blockInfo['fields']['LIST'][0]);
                        snippet = `Var(${listName}.size())`;
                        break;
                    case 'data_itemoflist':
                        listName = this.modifyListName(blockInfo['fields']['LIST'][0]);
                        value = this.processValueInfo(blockInfo['inputs']['INDEX'], allBlocksInfo);
                        snippet = `${listName}.getLineOfList(${value})`;
                        break;
                    case 'data_replaceitemoflist':
                        listName = this.modifyListName(blockInfo['fields']['LIST'][0]);
                        value = this.processValueInfo(blockInfo['inputs']['INDEX'], allBlocksInfo);
                        value2 = this.processValueInfo(blockInfo['inputs']['ITEM'], allBlocksInfo);
                        snippet = `${listName}.setLineOfListTo(${value}, ${value2});\n`;
                        break;
                    case 'data_listcontainsitem':
                        listName = this.modifyListName(blockInfo['fields']['LIST'][0]);
                        value = this.processValueInfo(blockInfo['inputs']['ITEM'], allBlocksInfo);
                        snippet = `(${listName}.itemNumOfList(${value}) != 0)`;
                        break;
                    case 'looks_say':
                        value = this.processValueInfo(blockInfo['inputs']['MESSAGE'], allBlocksInfo);
                        snippet = `cout << ${value} << endl;\n`;
                        break;
                    case 'looks_think':
                        value = this.processValueInfo(blockInfo['inputs']['MESSAGE'], allBlocksInfo);
                        snippet = `cerr << ${value} << endl;\n`;
                        break;
                    case 'operator_add':
                        value = this.processValueInfo(blockInfo['inputs']['NUM1'], allBlocksInfo);
                        value2 = this.processValueInfo(blockInfo['inputs']['NUM2'], allBlocksInfo);
                        snippet = `(${value} + ${value2})`;
                        break;
                    case 'operator_subtract':
                        value = this.processValueInfo(blockInfo['inputs']['NUM1'], allBlocksInfo);
                        value2 = this.processValueInfo(blockInfo['inputs']['NUM2'], allBlocksInfo);
                        snippet = `(${value} - ${value2})`;
                        break;
                    case 'operator_multiply':
                        value = this.processValueInfo(blockInfo['inputs']['NUM1'], allBlocksInfo);
                        value2 = this.processValueInfo(blockInfo['inputs']['NUM2'], allBlocksInfo);
                        snippet = `(${value} * ${value2})`;
                        break;
                    case 'operator_divide':
                        value = this.processValueInfo(blockInfo['inputs']['NUM1'], allBlocksInfo);
                        value2 = this.processValueInfo(blockInfo['inputs']['NUM2'], allBlocksInfo);
                        snippet = `(${value} / ${value2})`;
                        break;
                    case 'operator_mod':
                        value = this.processValueInfo(blockInfo['inputs']['NUM1'], allBlocksInfo);
                        value2 = this.processValueInfo(blockInfo['inputs']['NUM2'], allBlocksInfo);
                        snippet = `(${value} % ${value2})`;
                        break;
                    case 'operator_round':
                        value = this.processValueInfo(blockInfo['inputs']['NUM'], allBlocksInfo);
                        snippet = `Var(round(${value}.asNumber()))`;
                        break;
                    case 'operator_mathop':
                        value = this.processValueInfo(blockInfo['inputs']['NUM'], allBlocksInfo);
                        let opName = blockInfo['fields']['OPERATOR'][0];
                        if (opName === '10 ^'){
                            snippet = `Var(pow(10.0, ${value}.asNumber()))`;
                        } else {
                            let dic = {'abs':'fabs', 'ceiling':'ceil', 'ln':'log', 'log':'log10', 'e ^':'exp'};
                            if (opName in dic) opName = dic[opName];
                            snippet = `Var(${opName}(${value}.asNumber()))`;
                        }
                        break;
                    case 'operator_random':
                        value = this.processValueInfo(blockInfo['inputs']['FROM'], allBlocksInfo);
                        value2 = this.processValueInfo(blockInfo['inputs']['TO'], allBlocksInfo);
                        snippet = `Var(randUniform(${value}.asNumber(), ${value2}.asNumber()))`;
                        break;
                    case 'operator_or':
                        value = this.processValueInfo(blockInfo['inputs']['OPERAND1'], allBlocksInfo);
                        value2 = this.processValueInfo(blockInfo['inputs']['OPERAND2'], allBlocksInfo);
                        snippet = `(${value} || ${value2})`;
                        break;
                    case 'operator_and':
                        value = this.processValueInfo(blockInfo['inputs']['OPERAND1'], allBlocksInfo);
                        value2 = this.processValueInfo(blockInfo['inputs']['OPERAND2'], allBlocksInfo);
                        snippet = `(${value} && ${value2})`;
                        break; 
                    case 'operator_not':
                        value = this.processValueInfo(blockInfo['inputs']['OPERAND'], allBlocksInfo);
                        snippet = `(!${value})`;
                        break; 
                    case 'operator_join':
                        value = this.processValueInfo(blockInfo['inputs']['STRING1'], allBlocksInfo);
                        value2 = this.processValueInfo(blockInfo['inputs']['STRING2'], allBlocksInfo);
                        snippet = `Var(${value}.asString() + ${value2}.asString())`;
                        break;
                    case 'operator_letter_of':
                        value = this.processValueInfo(blockInfo['inputs']['LETTER'], allBlocksInfo);
                        value2 = this.processValueInfo(blockInfo['inputs']['STRING'], allBlocksInfo);
                        snippet = `letterOf(${value}, ${value2})`;
                        break;
                    case 'operator_length': // 文字列変数の長さ
                        // NOTE: Var にも VarList にも .asString() がある．
                        value = this.processValueInfo(blockInfo['inputs']['STRING'], allBlocksInfo);
                        snippet = `Var(${value}.asString().size())`;
                        break;
                    case 'operator_contains': // 文字列が文字列を連続部分文字列として含むか否か
                        // NOTE: Var にも VarList にも .asString() がある．
                        value = this.processValueInfo(blockInfo['inputs']['STRING1'], allBlocksInfo);
                        value2 = this.processValueInfo(blockInfo['inputs']['STRING2'], allBlocksInfo);
                        snippet = `(${value}.asString().find(${value2}.asString()) != string::npos)`;
                        break;
                    case 'operator_equals':
                        value = this.processValueInfo(blockInfo['inputs']['OPERAND1'], allBlocksInfo);
                        value2 = this.processValueInfo(blockInfo['inputs']['OPERAND2'], allBlocksInfo);
                        snippet = `(${value} == ${value2})`;
                        break;
                    case 'operator_lt':
                        value = this.processValueInfo(blockInfo['inputs']['OPERAND1'], allBlocksInfo);
                        value2 = this.processValueInfo(blockInfo['inputs']['OPERAND2'], allBlocksInfo);
                        snippet = `(${value} < ${value2})`;
                        break;
                    case 'operator_gt':
                        value = this.processValueInfo(blockInfo['inputs']['OPERAND1'], allBlocksInfo);
                        value2 = this.processValueInfo(blockInfo['inputs']['OPERAND2'], allBlocksInfo);
                        snippet = `(${value} > ${value2})`;
                        break;
                    case 'sensing_askandwait':
                        snippet = `cin >> ${this.nameOfAnswerVariable};\n`;
                        break;
                    case 'sensing_answer':
                        snippet = this.nameOfAnswerVariable;
                        break;
                    case 'procedures_call':
                        funcName = this.modifyFunctionName(blockInfo['mutation']['proccode'].split(' ')[0]);
                        value = [];
                        const argIDs = JSON.parse(blockInfo['mutation']['argumentids']);
                        for(let i=0;i<argIDs.length;i++){
                            console.log(blockInfo['inputs'][argIDs[i]]);
                            value.push(this.processValueInfo(blockInfo['inputs'][argIDs[i]], allBlocksInfo));
                        }
                        snippet = funcName + '(' + value.join(', ') + ');\n';
                        break;
                    case 'procedures_definition':
                        procProtoBlockID = blockInfo['inputs']['custom_block'][1];
                        funcName = this.modifyFunctionName(allBlocksInfo[procProtoBlockID]['mutation']['proccode'].split(' ')[0]);
                        argNames = JSON.parse(allBlocksInfo[procProtoBlockID]['mutation']['argumentnames']);
                        argNames = argNames.map(this.modifyArgumentName);
                        funcSignature = [funcName].concat(argNames);
                        break;
                    // case 'procedures_prototype': // procedures_definition の中で処理されるためここでは記述不要．
                    default:
                        snippet = `/* UNKNOWN: ${opcode} */`;
                        console.log(snippet);
                        console.log(blockInfo);
                        this.unknownCommandSet.add(opcode);
                        break;
                }
            } catch (e) {
                console.error("[Error] " + e.message);
                console.log(`blockID: ${blockID}`);
                console.log(allBlocksInfo[blockID]);
                snippet = `/* ERROR: ${allBlocksInfo[blockID]['opcode']} */`;
            }

            //「次の処理」が存在する場合
            let nextBlockID = allBlocksInfo[blockID]['next'];
            if (nextBlockID) {
                snippet += this.convertFrom(nextBlockID, allBlocksInfo)[0];
            }
        }
        return [snippet, funcSignature];
    }


    processValueInfo(valueInfo, allBlocksInfo) {
        if (!valueInfo) return '';
        switch (valueInfo[0]) {
            case 3: // other block, or variable
            case 2: // CONDITION だとこのパターンもある？
                if (typeof valueInfo[1] === 'string'){ // other block
                    return this.convertFrom(valueInfo[1], allBlocksInfo)[0];
                } else { // variable
                    return this.modifyVariableName(valueInfo[1][1]);
                }
            case 1: // literal
                return `Var(${Sb3ToCppConverter.processLiteral(valueInfo[1][1])})`;
            default:
                console.log(`UNKNOWN VALUE TYPE: ${valueInfo[0]}`);
        }  
    }

    static processLiteral(obj){
        /*
            obj <str/int/float>
            returns <str>
            if [obj] is interpretable as integer, return the integer stringified.
            else if [obj] is interpretable as numerical value, return the value stringified.
            if not interpretable, return the string double-quoted.
        */
        if (typeof obj == 'string'){
            if ($.isNumeric(obj)){
                // ここで obj === "0431" の時，文字列 0431 が返るとマズい
                // C++ はリテラル "0431" を八進数として解釈するが，Scratch は十進数として解釈する．
                // 一方 Scratch でも C++ でもリテラル "0xFF" は 255 と解釈される．

                // use Number() ?

                return obj;
            }else{
                return '"' + obj + '"';
            }
        }else{
            return '' + obj; 
        }
    }    

    /*
    static getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }
    static randomIdentifierName(){
        var ret = '';
        for(let i=0;i<8;i++) ret += String.fromCharCode('a'.charCodeAt(0) + getRandomInt(26));
        return ret;
    }
    */

    static indent(snippet, num_space){
        /*
        Args:
            snippet <str> : every row in it has return code.
            num_space <int>: >= 0 
        Returns:
            (str) indented snippet.
        */
        if (snippet == '') return '';
        var lines = snippet.split('\n');
        if (lines[lines.length-1] == '') lines.pop();
        var spaces = Array(num_space+1).join(' ');
        return lines.map(line => spaces + line + '\n').join('');
    }    


    static hasNonAscii(name) {
        /* returns whether the string contains non-ascii characters */
        return !name.match(/^[\x20-\x7e]*$/);
    }

    static escapeInvalidCharacter(name, escapeNonAscii=false){
        /* 
            (If escapeNonAscii==false)
                Escape ascii characters invalid for C++ identifier name, as following:
                    ' ' => "_20"
                    '~' => "_7e" (and so on)
                Non-ascii characters are untouched.
                The underscore is also escaped, for preventing collisions:
                    '_' => "__"            

            (If escapeNonAscii==true)
                Escape ascii characters invalid for C++ identifier name, as well as non-ascii characters:
                    ' ' => "_0020"
                    '~' => "_007e"
                    'あ' => "_3042"
                The underscore is also escaped, for preventing collisions:
                    '_' => "__"
        */

        let ret = '';
        for(let c of name){
            if (c === '_'){
                ret += '__';
            } else {
                const code = c.charCodeAt(0);
                if (escapeNonAscii){
                    if (('0' <= c && c <= '9') || ('A' <= c && c <= 'Z') || ('a' <= c && c <= 'z')){
                        ret += c;
                    } else {
                        ret += '_' + ('000' + code.toString(16)).substr(-4);
                    }
                }else{
                    if (('0' <= c && c <= '9') || ('A' <= c && c <= 'Z') || ('a' <= c && c <= 'z') || 256 <= code){
                        ret += c;
                    } else {
                        ret += '_' + ('0' + code.toString(16)).substr(-2);
                    }
                }
            }
        }
        return ret;
    }

    static getUTF8Length(s) {
        var len = 0;
        for (var i = 0; i < s.length; i++) {
            var code = s.charCodeAt(i);
            if (code <= 0x7f) {
                len += 1;
            } else if (code <= 0x7ff) {
                len += 2;
            } else if (code >= 0xd800 && code <= 0xdfff) {
                // Surrogate pair: These take 4 bytes in UTF-8 and 2 chars in UCS-2
                // (Assume next char is the other [valid] half and just skip it)
                len += 4; i++;
            } else if (code < 0xffff) {
                len += 3;
            } else {
                len += 4;
            }
        }
        return len;
    }

    static makeByteLengthNice(src){
        /*
            与えられた文字列 src に対して以下の処理を施します
            ・改行コードを \r\n に変更する．（AtCoder の web から提出するとソース中の改行コードが \r\n になる関係で）
            ・その上で，バイト数が 100 の倍数になるように半角スペースを付け加える．
        */
        src = src.replace(new RegExp('\r\n', 'g'), '\n').replace(new RegExp('\n', 'g'), `\r\n`);
        const padSize = (-Sb3ToCppConverter.getUTF8Length(src) % 100 + 100) % 100;
        for(let i=0;i<padSize;i++) src += ' ';
        return src;
    }
}


