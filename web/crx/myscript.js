// create <input type='file'> (hidden)
var inputElem = document.createElement("input");
inputElem.type = 'file';
inputElem.id = 'file-upload-scratch-project';
inputElem.accept = ['.sb3'];
inputElem.style.display = 'none';
document.body.appendChild(inputElem);

//fetch language setting
var lang = 'en';
if (document.body.innerText.indexOf('言語') >= 0) lang = 'ja';

// place some elements
var div = document.getElementsByClassName("col-sm-3 editor-buttons")[0];
if (typeof div !== 'undefined' && div !== null){
    // create a button to navigate to Scratch online editor
    var buttonText = {'ja':'Scratch 3.0 オンラインエディタ', 'en':'Scratch 3.0 online editor'}[lang];
    div.insertAdjacentHTML('beforeend', `<p><button type="button" class="btn btn-default btn-sm " style="background-color: orange; color: white" onclick="window.open('https://scratch.mit.edu/projects/editor/');">` + buttonText + `</button></p>`);
    
    // create and place the button for upload
    buttonText = {'ja':'Scratch 3.0 プロジェクトをロード', 'en':'Load Scratch 3.0 project'}[lang];
    div.insertAdjacentHTML('beforeend', `<p><button id="btn-upload-scratch-project" type="button" class="btn btn-default btn-sm " style="background-color: orange; color: white">` + buttonText + `</button></p>`);

    //create and place the link to usage (https://chrome.google.com/webstore/detail/scratchers-atcoder/hackndbjgkehhjinjjoldifbhnfddklh)
    var text = {'ja':'※つかいかた', 'en':'[Usage]'}[lang];
    div.insertAdjacentHTML('beforeend', `<a href="https://chrome.google.com/webstore/detail/scratchers-atcoder/hackndbjgkehhjinjjoldifbhnfddklh" target="_blank">` + text + `</a>&nbsp;&nbsp;&nbsp;&nbsp;`);

    //create and place the link to example project ()
    var text = {'ja':'※かいとうれい', 'en':'[Example project]'}[lang];
    div.insertAdjacentHTML('beforeend', `<a href="https://scratch.mit.edu/projects/245115351/" target="_blank">` + text + `</a>`);

    //create and place the link to blocks information (https://github.com/yos1up/scratch2cpp/blob/master/blocks.md)
    var text = {'ja':'※つかえるブロックは？', 'en':'[Which blocks are supported?]'}[lang];
    div.insertAdjacentHTML('beforeend', `<p><a href="https://github.com/yos1up/scratch2cpp/blob/master/blocks.md" target="_blank">` + text + `</a></p>`);

    // var text = {'ja':'Scratch 3.0 へのたいおうについて', 'en':'Is Scratch 3.0 supported?'}[lang];
    // div.insertAdjacentHTML('beforeend', `<p><b><a href="https://github.com/yos1up/scratch2cpp/blob/master/README.md" target="_blank">` + text + `</a></b></p>`);
}

// button for upload => trigger <input type='file'>
document.getElementById("btn-upload-scratch-project").onclick = function(){
    document.getElementById("file-upload-scratch-project").click();
};

// when file is selected
document.getElementById("file-upload-scratch-project").addEventListener("change",function(e){
    var files = e.target.files;
    if (typeof files[0] !== 'undefined'){
        var zip = new JSZip();
        if (typeof zip === 'undefined'){
            alert({
                'en':'ERROR: JSZip load failed...',
                'ja':'エラー: JSZip のロードにしっぱいしました！'
            }[lang]);
        }else{
            zip.loadAsync(files[0]).then(
                function(zip) {
                    if (typeof zip.files['project.json'] !== 'undefined'){
                        zip.files['project.json'].async('string').then(
                            function (fileData) {
                                // convert project.json -> cpp
                                var rslt = sb3ProjectJsonToCpp(fileData);
                                var cppSource = rslt[0];
                                var errorInfos = rslt[1];
                                for (let errorInfo of errorInfos){
                                    var errorMessage = '';
                                    switch (errorInfo['code']){
                                        case -1:
                                            errorMessage = {
                                                'en':'ERROR: Invalid Scratch 3.0 project file! (possibly Scratch <=2.0?)',
                                                'ja':'エラー: ゆうこうな Scratch 3.0 プロジェクトファイルではありません！（もしかして Scratch <=2.0 ですか？）'
                                            }[lang];
                                            break;
                                        case 1:
                                            errorMessage = {
                                                'en':'WARNING: the following blocks are not converted!',
                                                'ja':'けいこく: いかのブロックは、へんかんできませんでした！'
                                            }[lang] + '\n' + errorInfo['message'];
                                            break;
                                        case 2:
                                            errorMessage = {
                                                'en':'ERROR: No entry point found. Please use a "when [Flag] clicked" block to specify the entry point.',
                                                'ja':'エラー: プログラムのかいしちてんがわかりません！「（はた）がクリックされたとき」ブロックを、はいちしてください！'
                                            }[lang];
                                            break;
                                        case 3:
                                            errorMessage = {
                                                'en':'ERROR: Multiple entry points found. Please use ONE "when [Flag] clicked" block.',
                                                'ja':'エラー: プログラムのかいしちてんが 2 ついじょうあります！「（はた）がクリックされたとき」ブロックは、1 つにしてください！'
                                            }[lang];
                                            break;
                                        case 4:
                                            errorMessage = {
                                                'en':'CAUTION: Non-ascii characters are used in identifiers. Please select Clang compiler (C++14 (Clang 3.8.0)) to compile it correctly.',
                                                'ja':'ちゅうい: へんすうめいに アスキーもじ いがいが ふくまれるため、Clang コンパイラ (C++14 (Clang 3.8.0)) をせんたくしてください！'
                                            }[lang];
                                            break;
                                    }
                                    window.alert(errorMessage);
                                }

                                // paste to plain editor
                                if (cppSource)
                                    document.getElementsByClassName("form-control plain-textarea")[0].value = cppSource;

                                { // paste to rich editor
                                    // execute this command in web browser
                                    // $('.editor').data('editor').doc.setValue(fileData);
                                    var elem = document.getElementById("converted_source");
                                    if (!elem){
                                        elem = document.createElement("textarea");                              
                                        elem.id = 'converted_source';
                                        elem.style.display = 'none';
                                        document.body.appendChild(elem);
                                    }
                                    elem.value = cppSource;


                                    // paste to rich editor
                                    var script = document.createElement("script");
                                    script.textContent = '$(".editor").data("editor").doc.setValue(document.getElementById("converted_source").value);';
                                    document.body.appendChild(script);

                                }

                                // select C++ language 
                                // TODO

                            }
                        );
                    }else{
                        window.alert({
                            'en':'ERROR: Failed loading .sb3 file (project.json not found)',
                            'ja':'エラー: .sb3 ファイルの よみこみに しっぱいしました！（project.json がみつかりません）'
                        }[lang]);
                    }
                }, function() {
                    window.alert({
                        'en':'ERROR: Failed loading .sb3 file (unzip failed)',
                        'ja':'エラー: .sb3 ファイルの よみこみに しっぱいしました！（かいとうに しっぱいしました）'
                    }[lang]);                    
                }
            );
        }
    }     
});
