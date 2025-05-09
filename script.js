const apiUrl = "https://wdyr-4b67580946ff.herokuapp.com";

const shownCelebs = new Set();
let selectedGender = "both";
let maxPages = 50; // Default value
let selectionCount = 0;
let lastSelectionTime = Date.now();
let idleTimer = null;
const IDLE_THRESHOLD = 10000; // 10 seconds of inactivity
const MAX_SELECTIONS = 20;
const MAX_POSSIBLE_SAMPLE = 1000; // Maximum possible sample size
let lastSelectedCardId = null; // Track the last selected card
let gameEnded = false; // Flag to track if game has ended

function getGenderCode(gender) {
  if (gender === "female") return 1;
  if (gender === "male") return 2;
  return null;
}

function calculateAge(birthday) {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

async function getRandomCelebrity() {
  let lastValidCeleb = null;
  let attempts = 0;
  const maxAttempts = 50;
  
  while (attempts < maxAttempts) {
    const page = Math.floor(Math.random() * maxPages) + 1;
    const res = await fetch(`${apiUrl}/api/popular?page=${page}`);
    const data = await res.json();

    let candidates = data.results.filter(p => p.profile_path);

    if (selectedGender === "female") {
      candidates = candidates.filter(p => p.gender === 1);
    } else if (selectedGender === "male") {
      candidates = candidates.filter(p => p.gender === 2);
    }

    candidates = candidates.filter(p => !shownCelebs.has(p.id));

    for (const person of candidates) {
      try {
        const detailRes = await fetch(`${apiUrl}/api/person/${person.id}`);
        const detail = await detailRes.json();
        if (!detail.birthday) continue;

        const age = calculateAge(detail.birthday);
        if (age >= 21) {
          const celeb = {
            name: person.name,
            image: `https://image.tmdb.org/t/p/w500${person.profile_path}`,
            id: person.id,
            gender: person.gender,
            age,
            imdb_id: detail.imdb_id
          };
          lastValidCeleb = celeb;
          shownCelebs.add(person.id);
          return celeb;
        }
      } catch (e) {
        console.warn("Error fetching detail for", person.id);
      }
    }
    attempts++;
  }
  
  if (lastValidCeleb) {
    return lastValidCeleb;
  }
  return null;
}

async function loadCard(cardId) {
  const card = document.getElementById(cardId);
  const celeb = await getRandomCelebrity();

  if (!celeb) {
    if (lastSelectedCardId) {
      const finalCard = document.getElementById(lastSelectedCardId);
      const celebrityName = finalCard.querySelector('h3').textContent;
      const celebrityImage = finalCard.querySelector('img').src;
      const imdbLink = finalCard.querySelector('.imdb-link')?.href || '';
      
      document.getElementById('finalCelebrity').innerHTML = `
        <div style="position: relative; display: inline-block;">
          <img src="${celebrityImage}" alt="${celebrityName}" style="width: 300px; border-radius: 8px; display: block;">
        </div>
        <h3>${celebrityName}${imdbLink ? `<a href="${imdbLink}" target="_blank" class="imdb-link" style="margin-left: 8px; display: inline-flex; align-items: center; vertical-align: middle;"><img src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg" alt="IMDB" style="height: 16px;"></a>` : ''}</h3>
      `;
      
      document.getElementById('endGameMessage').style.display = 'block';
    }
    return;
  }

  card.setAttribute('data-gender', celeb.gender);

  const imdbLink = celeb.imdb_id ? `https://www.imdb.com/name/${celeb.imdb_id}/` : '';
  
  card.innerHTML = `
    <div class="card-image-container" style="position: relative; cursor: pointer;">
      <img src="${celeb.image}" alt="${celeb.name}" />
    </div>
    <h3>${celeb.name}${imdbLink ? `<a href="${imdbLink}" target="_blank" class="imdb-link" style="margin-left: 8px; display: inline-flex; align-items: center; vertical-align: middle;"><img src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg" alt="IMDB" style="height: 16px;"></a>` : ''}</h3>
  `;

  // Add click handler to IMDB link to stop event propagation
  const imdbLinkElement = card.querySelector('.imdb-link');
  if (imdbLinkElement) {
    imdbLinkElement.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }
}

function updateSelectionCount() {
  selectionCount++;
  document.getElementById('selectionProgress').style.width = `${(selectionCount / MAX_SELECTIONS) * 100}%`;
  
  if (selectionCount >= MAX_SELECTIONS) {
    endGame();
  }
  
  lastSelectionTime = Date.now();
  resetIdleTimer();
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(checkIdle, IDLE_THRESHOLD);
}

function checkIdle() {
  if (gameEnded) return;
  
  const timeSinceLastSelection = Date.now() - lastSelectionTime;
  if (timeSinceLastSelection >= IDLE_THRESHOLD) {
    if (lastSelectedCardId) {
      const finalCard = document.getElementById(lastSelectedCardId);
      const celebrityName = finalCard.querySelector('h3').textContent;
      const celebrityImage = finalCard.querySelector('img').src;
      const imdbLink = finalCard.querySelector('.imdb-link')?.href || '';
      
      document.getElementById('finalCelebrity').innerHTML = `
        <div style="position: relative; display: inline-block;">
          <img src="${celebrityImage}" alt="${celebrityName}" style="width: 300px; border-radius: 8px; display: block;">
        </div>
        <h3>${celebrityName}${imdbLink ? `<a href="${imdbLink}" target="_blank" class="imdb-link" style="margin-left: 8px; display: inline-flex; align-items: center; vertical-align: middle;"><img src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg" alt="IMDB" style="height: 16px;"></a>` : ''}</h3>
      `;
      
      document.getElementById('endGameMessage').style.display = 'block';
      gameEnded = true;
      if (idleTimer) clearTimeout(idleTimer);
    }
  }
}

function endGame() {
  if (lastSelectedCardId) {
    const finalCard = document.getElementById(lastSelectedCardId);
    const celebrityName = finalCard.querySelector('h3').textContent;
    const celebrityImage = finalCard.querySelector('img').src;
    const imdbLink = finalCard.querySelector('.imdb-link')?.href || '';
    
    document.getElementById('finalCelebrity').innerHTML = `
      <div style="position: relative; display: inline-block;">
        <img src="${celebrityImage}" alt="${celebrityName}" style="width: 300px; border-radius: 8px; display: block;">
      </div>
      <h3>${celebrityName}${imdbLink ? `<a href="${imdbLink}" target="_blank" class="imdb-link" style="margin-left: 8px; display: inline-flex; align-items: center; vertical-align: middle;"><img src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg" alt="IMDB" style="height: 16px;"></a>` : ''}</h3>
    `;
    
    document.getElementById('endGameMessage').style.display = 'block';
    gameEnded = true;
    if (idleTimer) clearTimeout(idleTimer);
  }
}

function setupHoldOnButton() {
  document.getElementById('holdOnButton').addEventListener('click', async () => {
    document.getElementById('endGameMessage').style.display = 'none';
    selectionCount = 0;
    document.getElementById('selectionProgress').style.width = '0%';
    gameEnded = false;
    
    // Keep the winning card and load one new card
    const winningCardId = lastSelectedCardId;
    const otherCardId = winningCardId === "card1" ? "card2" : "card1";
    
    // Always increase sample size by 40, up to the maximum
    const currentSampleSize = parseInt(document.getElementById('sampleSizeValue').textContent);
    const newSampleSize = Math.min(MAX_POSSIBLE_SAMPLE, currentSampleSize + 40);
    
    if (newSampleSize > currentSampleSize) {
      document.getElementById('sampleSizeValue').textContent = newSampleSize;
      document.getElementById('sampleSizeSlider').value = newSampleSize;
      maxPages = Math.ceil(newSampleSize / 20);
    }
    
    // Load a new card for the non-winning position
    await loadCard(otherCardId);
    
    resetIdleTimer();
  });
}

function setupVoting() {
  const card1 = document.getElementById("card1");
  const card2 = document.getElementById("card2");

  card1.addEventListener("click", async (event) => {
    // Only trigger if clicking the image or its container
    if (event.target.tagName === 'IMG' || event.target.classList.contains('card-image-container')) {
      lastSelectedCardId = "card1";
      await loadCard("card2");
      updateSelectionCount();
    }
  });

  card2.addEventListener("click", async (event) => {
    // Only trigger if clicking the image or its container
    if (event.target.tagName === 'IMG' || event.target.classList.contains('card-image-container')) {
      lastSelectedCardId = "card2";
      await loadCard("card1");
      updateSelectionCount();
    }
  });
}

function setupToggleButtons() {
  const buttons = document.querySelectorAll(".tri-state-toggle-button");
  buttons.forEach(button => {
    button.addEventListener("click", async () => {
      const newGender = button.getAttribute("data-gender");
      if (newGender === selectedGender) return;

      buttons.forEach(b => b.classList.remove("active"));
      button.classList.add("active");

      const prevGender = selectedGender;
      selectedGender = newGender;

      const card1Gender = document.getElementById("card1").getAttribute('data-gender');
      const card2Gender = document.getElementById("card2").getAttribute('data-gender');

      // Only change cards if they don't match the new gender selection
      if (selectedGender === "female") {
        if (card1Gender !== "1") await loadCard("card1");
        if (card2Gender !== "1") await loadCard("card2");
      } else if (selectedGender === "male") {
        if (card1Gender !== "2") await loadCard("card1");
        if (card2Gender !== "2") await loadCard("card2");
      }
      // No need to change cards when switching to "both" as both genders are allowed
    });
  });
}

function setupSampleSizeControl() {
  const slider = document.getElementById("sampleSizeSlider");
  const display = document.getElementById("sampleSizeValue");
  
  slider.addEventListener("input", () => {
    const value = parseInt(slider.value);
    display.textContent = value;
    maxPages = Math.ceil(value / 20); // 20 celebrities per page
    shownCelebs.clear(); // Clear the shown celebrities when sample size changes
  });
}

// Add mouse movement detection
document.addEventListener('mousemove', resetIdleTimer);

loadCard("card1");
loadCard("card2");
setupVoting();
setupToggleButtons();
setupSampleSizeControl();
setupHoldOnButton();
resetIdleTimer();
