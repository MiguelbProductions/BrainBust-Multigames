$(document).ready(function () {
    var editor = CodeMirror.fromTextArea(document.getElementById("IDEContainer"), {
        theme: "dracula",
        lineNumbers: true,
        autoCloseBrackets: true,
        mode: "python",
    });

    $("#MidContent").on("click", function(event) {
        var ScriptContent = editor.getValue(); 

        $.ajax({
            url: 'http://localhost:1616/compile', 
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ ScriptContent }),
            success: function(response) {
                console.log('Response:', response);

                var outputBox = $('<div class="OutputBox"></div>');
                
                outputBox.append('PS C:\\Users\\migue\\Documents\\My-IDE> c:/Users/migue/Documents/GitHub/My-IDE/CSS/test.py<br>');

                if (response.stderr) {
                    var errorDiv = $('<div class="Error"></div>').text(response.stderr);
                    outputBox.append(errorDiv);
                } else {
                    var errorDiv = $('<div class="Sucess"></div>').text(response.stdout);
                    outputBox.append(errorDiv);
                }

                $('#MultiWindows').append(outputBox);
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
            }
        });
       
    });
});