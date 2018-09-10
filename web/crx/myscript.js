// create <input type='file'> (hidden)
var inputElem = document.createElement("input");
inputElem.type = 'file';
inputElem.id = 'file-upload-scratch-project';
inputElem.style.display = 'none';
document.body.appendChild(inputElem);

//fetch language setting
var buttonText = 'Open Scratch project';
if (document.title.indexOf('提出') >= 0) buttonText = 'Scratch プロジェクトをひらく';

// create and place the button for upload
var div = document.getElementsByClassName("col-sm-3 editor-buttons")[0];
div.insertAdjacentHTML('beforeend', `<p><button id="btn-upload-scratch-project" type="button" class="btn btn-default btn-sm " style="background-color: orange; color: white">` + buttonText + `</button></p>`);

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
            alert('JSZip load failed...');
        }else{
            zip.loadAsync(files[0]).then(
                function(zip) {
                    if (typeof zip.files['project.json'] !== 'undefined'){
                        zip.files['project.json'].async('string').then(
                            function (fileData) {
                                // convert project.json -> cpp
                                var rslt = projectJsonToCpp(fileData);
                                var cppSource = rslt[0];
                                var errorMessage = rslt[1];
                                if (errorMessage != ''){
                                    alert(errorMessage);
                                }

                                // paste to plain editor
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
                        alert("Not a valid .sb2 file (project.json not found)");
                    }
                }, function() {alert("Not a valid .sb2 file (unzip failed)");});
        }
    }     
});
