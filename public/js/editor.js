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
        $("#expected-btn").addClass("selected")
        $("#result-btn").removeClass("selected")
        $('.expected-result').removeClass('d-none');
        $('.actual-result').addClass('d-none');
    });

    $('#result-btn').click(function() {
        $("#result-btn").addClass("selected")
        $("#expected-btn").removeClass("selected")
        $('.actual-result').removeClass('d-none');
        $('.expected-result').addClass('d-none');
    });

    $('.expected-result').removeClass('d-none');
    $('.actual-result').addClass('d-none');

    $(".run-btn").click(function() {
        var Script = editor.getValue();
        if (Script == "" || Script == null) return;
    
        $.ajax({
            url: window.location.pathname, 
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ code: editor.getValue(), language: $("#language-select").val() }),
            success: function(response) {               
                $(".actual-result").removeClass("Onsetup");

                $("#result-btn").addClass("selected");
                $("#expected-btn").removeClass("selected");
                $('.actual-result').removeClass('d-none');
                $('.expected-result').addClass('d-none');

                if (response.hasOwnProperty("error")) {
                    $("#actual-result").html("<span class='debug-title text-danger'>Error</span><br><span class='code WrongBox'>" + response.error + "</span>");
                } else {
                    var statusClass = (response.status === "Accepted") ? "debug-title text-success" : "debug-title text-danger";
                    var statusText = (response.status === "Accepted") ? "Success" : "Failure";

                    $("#actual-result").html("<span class='" + statusClass + "'>" + statusText + "</span><span class='fw-bold ms-3'>Runtime: " + ((response.executionTime) ? response.executionTime : "") + "</span><br>" + $("#expected-result").html() + "<br><br>Result<br><span class='code " + ((response.status === "Accepted") ? "CorrectBox" : "WrongBox") + "'>" + response.output + "</span>");
                }
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
            }
        });
    });    
});