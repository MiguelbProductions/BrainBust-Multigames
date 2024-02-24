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

    $('#expected-btn').click(function() {
        $('.expected-result').removeClass('d-none');
        $('.actual-result').addClass('d-none');
    });

    $('#result-btn').click(function() {
        $('.actual-result').removeClass('d-none');
        $('.expected-result').addClass('d-none');
    });

    $('.expected-result').removeClass('d-none');
    $('.actual-result').addClass('d-none');

    $(".run-btn").click(function() {
        var Script = editor.getValue()
        if (Script == "" || Script == null) return

        $.ajax({
            url: window.location.pathname, 
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ code: editor.getValue(), language: $("#language-select").val() }),
            success: function(response) {
                console.log(response)
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
            }
        });
    })
});