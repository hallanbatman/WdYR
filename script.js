const apiUrl = "https://wdyr-4b67580946ff.herokuapp.com";

const shownCelebs = new Set();
let selectedGender = "both";
let maxPages = 50; // Default value
let selectionCount = 0;
let lastSelectionTime = Date.now();
let idleTimer = null;
const IDLE_THRESHOLD = 10000; // 10 seconds of inactivity
const MAX_SELECTIONS = 20;
let lastSelectedCardId = null; // Track the last selected card

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
  
  for (let i = 0; i < 20; i++) {
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
            age
          };
          lastValidCeleb = celeb;
          shownCelebs.add(person.id);
          return celeb;
        }
      } catch (e) {
        console.warn("Error fetching detail for", person.id);
      }
    }
  }
  
  // If we get here, we couldn't find a new celebrity
  if (lastValidCeleb) {
    return lastValidCeleb;
  }
  return null;
}

async function loadCard(cardId) {
  const card = document.getElementById(cardId);
  const celeb = await getRandomCelebrity();

  if (!celeb) {
    // Show the last selected card as the final choice
    if (lastSelectedCardId) {
      const finalCard = document.getElementById(lastSelectedCardId);
      const celebrityName = finalCard.querySelector('h3').textContent;
      const celebrityImage = finalCard.querySelector('img').src;
      
      document.getElementById('finalCelebrity').innerHTML = `
        <img src="${celebrityImage}" alt="${celebrityName}" style="width: 300px; border-radius: 8px;">
        <h3>${celebrityName}</h3>
      `;
      
      document.getElementById('endGameMessage').style.display = 'block';
    }
    return;
  }

  card.setAttribute('data-gender', celeb.gender);

  card.innerHTML = `
    <img src="${celeb.image}" alt="${celeb.name}" />
    <h3>${celeb.name}</h3>
  `;
}

function updateSelectionCount() {
  selectionCount++;
  document.getElementById('selectionCount').textContent = selectionCount;
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
  const timeSinceLastSelection = Date.now() - lastSelectionTime;
  if (timeSinceLastSelection >= IDLE_THRESHOLD) {
    // Use the last selected card for the final result
    if (lastSelectedCardId) {
      const finalCard = document.getElementById(lastSelectedCardId);
      const celebrityName = finalCard.querySelector('h3').textContent;
      const celebrityImage = finalCard.querySelector('img').src;
      
      document.getElementById('finalCelebrity').innerHTML = `
        <img src="${celebrityImage}" alt="${celebrityName}" style="width: 300px; border-radius: 8px;">
        <h3>${celebrityName}</h3>
      `;
      
      document.getElementById('endGameMessage').style.display = 'block';
    }
  }
}

function endGame() {
  const lastSelectedCard = document.querySelector('.card:last-child');
  const celebrityName = lastSelectedCard.querySelector('h3').textContent;
  const celebrityImage = lastSelectedCard.querySelector('img').src;
  
  document.getElementById('finalCelebrity').innerHTML = `
    <img src="${celebrityImage}" alt="${celebrityName}" style="width: 300px; border-radius: 8px;">
    <h3>${celebrityName}</h3>
  `;
  
  document.getElementById('endGameMessage').style.display = 'block';
}

function setupHoldOnButton() {
  document.getElementById('holdOnButton').addEventListener('click', () => {
    document.getElementById('endGameMessage').style.display = 'none';
    resetIdleTimer();
  });
}

function setupVoting() {
  const card1 = document.getElementById("card1");
  const card2 = document.getElementById("card2");

  card1.addEventListener("click", async () => {
    lastSelectedCardId = "card1";
    await loadCard("card2");
    updateSelectionCount();
  });

  card2.addEventListener("click", async () => {
    lastSelectedCardId = "card2";
    await loadCard("card1");
    updateSelectionCount();
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

      if (selectedGender === "both") {
        if (card1Gender === "1") {
          await loadCard("card2");
        } else {
          await loadCard("card1");
        }
      } else {
        await loadCard("card1");
        await loadCard("card2");
      }
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
