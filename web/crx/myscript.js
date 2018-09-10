var div = document.getElementsByClassName("control-label col-sm-2")[0];
div.insertAdjacentHTML('beforebegin','<div class="form-group "><label class="control-label col-sm-2" for="select-task">Load Scratch Project</label><div class="col-sm-5"><input type="file" id="upload_scratch_project"></div></div>');

document.getElementById("upload_scratch_project").addEventListener("change",function(e){
    var files = e.target.files;
    if (typeof files[0] !== 'undefined'){
        var zip = new JSZip();
        if (typeof zip === 'undefined'){
            alert('JSZip load failed...');
        }else{
            zip.loadAsync(files[0]).then(
                function(zip) {
                    // process ZIP file content here
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
