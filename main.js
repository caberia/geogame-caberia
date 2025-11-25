const MAX_LIVES = 3;
let lives = MAX_LIVES;
let score = 0;
let targetCountryName = null;
let correctlyGuessedCountries = []; 
let isGameOver = false;

const styleDefault = new ol.style.Style({
    fill: new ol.style.Fill({ color: 'rgba(255, 255, 255, 0.5)' }), 
    stroke: new ol.style.Stroke({ color: '#319FD3', width: 1 })
});

const styleCorrect = new ol.style.Style({
    fill: new ol.style.Fill({ color: '#4CAF50' }), // Green
    stroke: new ol.style.Stroke({ color: '#2E7D32', width: 1 })
    // Removed the Text style block here
});

const styleHighlight = new ol.style.Style({
    stroke: new ol.style.Stroke({ color: '#f00', width: 2 }),
    fill: new ol.style.Fill({ color: 'rgba(255, 0, 0, 0.1)' })
});

function countryStyle(feature) {
    const name = feature.get('name');
    if (correctlyGuessedCountries.includes(name)) {
        return styleCorrect;
    }
    return styleDefault;
}

const baseLayer = new ol.layer.Tile({
    source: new ol.source.XYZ({
        url: 'https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
        attributions: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
    })
});

const vectorSource = new ol.source.Vector({
    url: 'https://openlayers.org/data/vector/us-states.json',
    format: new ol.format.GeoJSON()
});

const vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: countryStyle
});

const map = new ol.Map({
    target: 'map',
    layers: [
        baseLayer, 
        vectorLayer
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([-98.58, 50.82]), 
        zoom: 3.15
    })
});

const selectClick = new ol.interaction.Select({
    layers: [vectorLayer],
    style: styleHighlight 
});
map.addInteraction(selectClick);

selectClick.on('select', function(e) {
    if (isGameOver) {
        e.target.getFeatures().clear();
        return;
    }

    const selectedFeatures = e.target.getFeatures();
    
    if (selectedFeatures.getLength() > 0) {
        const feature = selectedFeatures.item(0);
        const clickedName = feature.get('name');
        
        if (!correctlyGuessedCountries.includes(clickedName)) {
            checkAnswer(clickedName);
        }
        
        selectedFeatures.clear();
    }
});

function checkAnswer(clickedName) {
    const feedbackEl = document.getElementById('feedback');
    
    if (clickedName === targetCountryName) {
        score++;
        document.getElementById('score').innerText = `Score: ${score}`;
        feedbackEl.innerText = "Correct!";
        feedbackEl.className = "correct";
        
        correctlyGuessedCountries.push(clickedName);
        vectorLayer.changed(); 
        nextTurn();

    } else {
        lives--;
        updateLivesUI();
        
        if (lives <= 0) {
            endGame(clickedName);
        } else {
            feedbackEl.innerText = `Wrong! That was ${clickedName}`;
            feedbackEl.className = "wrong";
        }
    }
}

function updateLivesUI() {
    let hearts = "";
    for(let i=0; i<lives; i++) hearts += "❤️";
    document.getElementById('lives').innerText = hearts;
}

function nextTurn() {
    const features = vectorSource.getFeatures();
    const availableFeatures = features.filter(f => 
        !correctlyGuessedCountries.includes(f.get('name'))
    );

    if (availableFeatures.length === 0) {
        document.getElementById('question').innerText = "You Win! All found.";
        isGameOver = true;
        return;
    }

    const randomFeature = availableFeatures[Math.floor(Math.random() * availableFeatures.length)];
    targetCountryName = randomFeature.get('name');

    document.getElementById('question').innerText = `Find: ${targetCountryName}`;
}

function endGame(lastClicked) {
    isGameOver = true;
    const feedbackEl = document.getElementById('feedback');
    document.getElementById('question').innerText = "GAME OVER";
    document.getElementById('question').className = "game-over-text";
    feedbackEl.innerText = `That was ${lastClicked}. Target was ${targetCountryName}.`;
    feedbackEl.className = "wrong";
    document.getElementById('restart-btn').style.display = 'inline-block';
}

window.resetGame = function() {
    lives = MAX_LIVES;
    score = 0;
    correctlyGuessedCountries = [];
    isGameOver = false;

    document.getElementById('score').innerText = "Score: 0";
    document.getElementById('question').className = ""; 
    document.getElementById('feedback').innerText = "";
    document.getElementById('restart-btn').style.display = 'none';
    updateLivesUI();

    vectorLayer.changed();
    nextTurn();
}

vectorSource.once('change', function() {
    if (vectorSource.getState() === 'ready') {
        nextTurn();
    }
});
