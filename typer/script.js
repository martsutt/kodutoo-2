console.log("script-i fail õigesti ühendatud")

function updateGreeting(name) {
    document.getElementById('greeting').textContent = `Tere, ${name}!`;
}

function playSound(id) {
    const audio = document.getElementById(id);
    if (audio) {
        audio.currentTime = 0;
        audio.play();
    }
}

function stopSound(id) {
    const audio = document.getElementById(id);
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
}

function updateClock() {
    const now = new Date();
    let h = now.getHours();
    let m = now.getMinutes();
    if (h < 10) h = '0' + h;
    if (m < 10) m = '0' + m;
    document.getElementById('clock').textContent = h + ':' + m;
}
setInterval(updateClock, 1000);
updateClock();

function updateTopScore(allResults) {
    if (!allResults || allResults.length === 0) {
        document.getElementById('topScore').textContent = '';
        return;
    }
    const best = allResults[0];
    let wpm = best.wpm ? best.wpm : ((3 / parseFloat(best.score)) * 60).toFixed(1);
    document.getElementById('topScore').textContent = `Kõige kiirem aeg: ${best.name} - ${best.score} sekundit - ${wpm} sõna minutis`;
}

let playerName = prompt("Palun sisesta oma nimi");
updateGreeting(playerName);

$(document).ready(function () {
    $('#showResultsButton').on('click', function () {
        playSound('audioScore');
        $(this).addClass('active');
        $('#resultsModal').show();
        typer.renderResultsTable();
    });
    $('#closeResults').on('click', function () {
        $('#resultsModal').hide();
        $('#showResultsButton').removeClass('active');
    });
    $('#resultsModal').on('click', function (e) {
        if (e.target === this) {
            $(this).hide();
            $('#showResultsButton').removeClass('active');
        }
    });
});

class Typer {
    constructor(pname) {
        this.name = pname;
        this.wordsInGame = 3;
        this.startingWordLength = 3;
        this.words = [];
        this.word = "START";
        this.typeWords = [];
        this.startTime = 0;
        this.endTime = 0;
        this.typedCount = 0;
        this.allResults = JSON.parse(localStorage.getItem('typer')) || [];
        this.score = 0;

        this.loadFromFile();
        this.showAllResults();
        updateTopScore(this.allResults);
    }

    loadFromFile() {
        $.get("lemmad2013.txt", (data) => this.getWords(data))
        $.get("database.txt", (data) => {
            let content = JSON.parse(data).content;
            this.allResults = content;
            updateTopScore(this.allResults);
            console.log(content);
        })
    }

    getWords(data) {
        const dataFromFile = data.split("\n");
        this.separateWordsByLength(dataFromFile);
    }

    separateWordsByLength(data) {
        for (let i = 0; i < data.length; i++) {
            const wordLength = data[i].length;

            if (this.words[wordLength] === undefined) {
                this.words[wordLength] = [];
            }

            this.words[wordLength].push(data[i]);
        }

        console.log(this.words);

        this.startTyper();
    }

    startTyper() {
        this.hasStarted = false;
        this.hasDuringStarted = false;
        this.generateWords();
        this.startTime = performance.now();
        $(document).off('keypress.typer').on('keypress.typer', (event) => { this.handleFirstKey(event.key) });
    }

    handleFirstKey(key) {
        if (!this.hasStarted) {
            playSound('audioStart');
            this.hasStarted = true;
        }
        if (!this.hasDuringStarted) {
            playSound('audioDuring');
            this.hasDuringStarted = true;
        }
        $(document).off('keypress.typer');
        $(document).on('keypress.typer', (event) => { this.shortenWords(event.key) });
        this.shortenWords(key);
    }

    generateWords() {
        for (let i = 0; i < this.wordsInGame; i++) {
            const wordLength = this.startingWordLength + i;
            const randomWord = Math.round(Math.random() * this.words[wordLength].length);
            this.typeWords[i] = this.words[wordLength][randomWord];
        }
        this.selectWord();

    }

    drawWord() {
        $("#wordDiv").html(this.word);
    }

    selectWord() {
        this.word = this.typeWords[this.typedCount];
        this.typedCount++;
        this.drawWord();
        this.updateInfo();
    }

    updateInfo() {
        $('#info').html(this.typedCount + "/" + this.wordsInGame);
    }

    shortenWords(keyCode) {
        console.log(keyCode);
        if (keyCode != this.word.charAt(0)) {
            setTimeout(function () {
                $('#container').css(
                    "background-color", "#111111"
                )
            }, 100)
            $('#container').css(
                "background-color", "red"
            )
        } else if (this.word.length == 1 && keyCode == this.word.charAt(0) && this.typedCount == this.wordsInGame) {
            this.endGame();
        } else if (this.word.length == 1 && keyCode == this.word.charAt(0)) {
            this.selectWord();
        } else if (this.word.length > 0 && keyCode == this.word.charAt(0)) {
            this.word = this.word.slice(1);
        }

        this.drawWord();
    }

    endGame() {
        stopSound('audioDuring');
        playSound('audioEnd');
        console.log("Mäng läbi");
        this.endTime = performance.now();
        $("#wordDiv").hide();
        this.calculateAndShowScore();
    }

    calculateAndShowScore() {
        this.score = ((this.endTime - this.startTime) / 1000).toFixed(2);
        $("#score").html(this.score).show();
        this.showSpeedImage();
        this.saveResult();
    }

    showSpeedImage() {
        const wordsTyped = this.wordsInGame;
        const seconds = parseFloat(this.score);
        const wpm = ((wordsTyped / seconds) * 60).toFixed(1);
        let imgSrc = '';
        let speedText = '';
        let tooSlowText = '';
        if (wpm >= 120) {
            imgSrc = 'images/competitivespeed.png';
            speedText = `Võistlustasemel kiirus (${wpm} sõna minutis)`;
        } else if (wpm >= 70) {
            imgSrc = 'images/highspeed.png';
            speedText = `Väga kiire (${wpm} sõna minutis)`;
        } else if (wpm >= 60) {
            imgSrc = 'images/productivespeed.png';
            speedText = `Tööks sobiv kiirus (${wpm} sõna minutis)`;
        } else if (wpm >= 50) {
            imgSrc = 'images/above_averagespeed.png';
            speedText = `Üle keskmise kiirus (${wpm} sõna minutis)`;
        } else if (wpm >= 40) {
            imgSrc = 'images/averagespeed.png';
            speedText = `Keskmine kiirus (${wpm} sõna minutis)`;
        } else {
            tooSlowText = `Liiga madal kirjutamise kiirus võrdluspildi kuvamiseks (${wpm} sõna minutis)`;
        }
        $('#speedImage').remove();
        $('#speedText').remove();
        $('#tooSlowText').remove();
        if (imgSrc) {
            $('#score').after('<img id="speedImage" src="' + imgSrc + '" alt="Tulemuse pilt" style="margin-top:16px;max-width:200px;display:block;" />');
        }
        if (speedText) {
            $('#score').after('<div id="speedText" style="margin-top:8px;font-size:20px;font-weight:500;color:#ffb6d5;">' + speedText + '</div>');
        }
        if (tooSlowText) {
            $('#score').after('<div id="tooSlowText" style="margin-top:16px;font-size:20px;font-weight:500;color:#ffb6d5;">' + tooSlowText + '</div>');
        }
    }

    saveResult() {
        let wpm = ((this.wordsInGame / parseFloat(this.score)) * 60).toFixed(1);
        let result = {
            name: this.name,
            score: this.score,
            wpm: wpm
        }
        this.allResults.push(result);
        this.allResults.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));
        console.log(this.allResults);
        localStorage.setItem('typer', JSON.stringify(this.allResults));
        this.saveToFile();
        this.showAllResults();
        updateTopScore(this.allResults);
    }

    showAllResults() {
        $('#results').hide();
        updateTopScore(this.allResults);
    }

    renderResultsTable() {
        const tbody = $('#resultsTable tbody');
        tbody.empty();
        let userScore = this.score;
        let userName = this.name;
        let userRowIndex = -1;
        for (let i = 0; i < this.allResults.length; i++) {
            const r = this.allResults[i];
            if (userScore && r.name === userName && r.score === userScore) {
                userRowIndex = i;
            }
        }
        for (let i = 0; i < this.allResults.length; i++) {
            const r = this.allResults[i];
            let rowClass = (i === userRowIndex && userScore) ? ' class="user-result"' : '';
            const row = `<tr${rowClass}><td>${r.name}</td><td>${r.score}</td><td>${r.wpm ? r.wpm : ''}</td></tr>`;
            tbody.append(row);
        }
    }

    saveToFile() {
        $.post('server.php', { save: this.allResults }).fail(
            function () {
                console.log("Fail");
            }
        )
    }
}

let typer = new Typer(playerName);