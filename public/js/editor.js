$(document).ready(function () {
    var editor = CodeMirror.fromTextArea(document.getElementById("container-ide"), {
        theme: "neat",
        lineNumbers: true,
        autoCloseBrackets: true,
        mode: "python",
    });

    var isDragging = false;
    var container = $('.main-container');
    var initialX;
    var desafioSection = container.find('.col-md-4');
    var minWidth = 300; 

    $('.resize-handle').on('mousedown', function(e) {
        isDragging = true;
        initialX = e.clientX;
        var initialDesafioWidth = desafioSection.width();
        
        $(document).on('mousemove', function(e) {
            if (isDragging) {
                var deltaX = e.clientX - initialX;
                var newWidth = initialDesafioWidth + deltaX;
                if (newWidth >= minWidth && (container.width() - newWidth) >= minWidth) {
                    desafioSection.width(newWidth);
                }
            }
        });

        $(document).on('mouseup', function() {
            isDragging = false;
            $(document).off('mousemove');
            $(document).off('mouseup');
        });
    });

    /*
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
    */
});