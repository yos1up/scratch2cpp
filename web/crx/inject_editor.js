// This script runs in the page context (not content script context)
// so it can access the page's JavaScript objects like the editor
(function() {
    var elem = document.getElementById("converted_source");
    if (elem && elem.value) {
        var editor = $('[name="sourceCode"]').data('editor');
        if (editor) {
            editor.setValue(elem.value);
        }
    }
})();
