$(document).ready(function() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    
    var colors = [
        "#D32F2F", "#C2185B", "#7B1FA2", "#512DA8", "#303F9F",
        "#1976D2", "#0288D1", "#0097A7", "#00796B", "#388E3C",
        "#689F38", "#AFB42B", "#FBC02D", "#FFA000", "#F57C00",
        "#E64A19", "#5D4037", "#616161", "#455A64", "#C62828",
        "#AD1457", "#6A1B9A", "#4527A0", "#283593", "#1565C0"
    ];

    var scales = [
        207.65, 220.00, 233.08, 246.94, 261.63, 277.18, 293.66,
        311.13, 329.63, 349.23, 369.99, 391.99, 415.30, 440.00,
        466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.25,
        698.46, 739.99, 783.99, 830.61, 880.00
      ]

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    let ingame = false
    let sequence = [];
    let userSequence = [];
    let showingSequence = true;
    let gridSize = 3; 
    let roundsWon = 0;
    let score = 0;

    $('#start-game').click(function() {
        if (ingame) return
        ingame = true

        adjustGrid(gridSize);
        resetGame();
    });
    
    function adjustGrid(size, continuegame = true) {
        const totalBoxes = size * size;
        const gameBoard = $('#gameBoard');
        gameBoard.empty();
        gameBoard.css({'grid-template-columns': `repeat(${size}, auto)`});
        shuffleArray(colors);
        shuffleArray(scales);
        for (let i = 0; i < totalBoxes; i++) {
            var GridBox = $("<div></div>", {
                "class": "grid-box",
                "data-index": i,
                "next-color": colors[i % colors.length],
                "data-frequency": scales[i % scales.length],
                "css": {
                    "background-color": "#88b3ff"
                }
            });
            
            gameBoard.append(GridBox);
            
            if (continuegame) {
                (function(GridBox) {
                    setTimeout(() => { 
                        GridBox.css("background-color", GridBox.attr("next-color"));
                    }, 10);
                })(GridBox);
            }
        }
        bindBoxClickEvents();
        resetGame();
    }

    function bindBoxClickEvents() {
        $('.grid-box').click(function() {
            if (showingSequence) return;

            const index = $(this).data('index');
            const frequency = $(this).data('frequency');

            playTone(frequency, 500);
            
            userSequence.push(index);
            $(this).addClass('active');
            setTimeout(() => $(this).removeClass('active'), 500);

            if (userSequence.length === sequence.length) {
                if (JSON.stringify(userSequence) === JSON.stringify(sequence)) {
                    roundsWon++;
                    score++;
                    $("#score-game").text(score);
                    console.log(gridSize, roundsWon)
                    if ((gridSize === 3 && roundsWon === 4) || (gridSize === 4 && roundsWon === 7)) {
                        gridSize = gridSize === 3 ? 4 : 5; 
                        roundsWon = 0; 
                        adjustGrid(gridSize); 
                    } else {
                        userSequence = [];
                        addAndShowSequence();
                    }
                } else {
                    alert('Sequência incorreta! Jogo reiniciado.');
                    losegame()
                }
            }
        });
    }

    function losegame() {
        savedata();

        gridSize = 3
        score = 0
        ingame = false
        shuffleArray(colors);
        adjustGrid(gridSize, false);
        resetGame(false);
    }   

    function savedata() {
        $.ajax({
            url: window.location.pathname,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ score: score }),
        });
    }

    function resetGame(continuegame = true) {
        sequence = [];
        userSequence = [];
        roundsWon = 0;

        $("#score-game").text(score)

        if (continuegame) addAndShowSequence();
    }
    
    function addAndShowSequence() {
        sequence.push(Math.floor(Math.random() * (gridSize * gridSize)));
        showSequence();
    }

    function showSequence() {
        let i = 0;
        showingSequence = true;
        const interval = setInterval(function() {
            if (i >= sequence.length) {
                clearInterval(interval);
                $('.grid-box').removeClass('active');
                showingSequence = false;
                return;
            }
            let box = $('.grid-box').eq(sequence[i]);
            let frequency = box.data('frequency');
            playTone(frequency, 800);

            box.addClass('active');
            setTimeout(function() { box.removeClass('active'); }, 800);
            i++;
        }, 1000);
    }

    function playTone(frequency, duration, volume = 0.05) {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
    
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
    
        gainNode.gain.value = volume; 
    
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination); 
    
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration / 1000);
    }
    
});
