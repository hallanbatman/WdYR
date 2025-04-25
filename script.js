// Celebrity Crush Game - Full JS with Gender Toggle, Age Filter, and Non-Repeating Logic

// This points to your local backend API
const apiUrl = "http://localhost:3000/api/popular";

const shownCelebs = new Set();
let selectedGender = "both"; // default option

function getGenderCode(gender) {
  if (gender === "female") return 1;
  if (gender === "male") return 2;
  return null; // for 'both'
}

// Helper to calculate age from birthday string
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

// Get random celebrity based on selected gender
async function getRandomCelebrity() {
  for (let i = 0; i < 20; i++) {
    const page = Math.floor(Math.random() * 50) + 1;
    const res = await fetch(`${apiUrl}?page=${page}`); // Updated URL to use /api/popular
    const data = await res.json();

    let candidates = data.results.filter(p => p.profile_path);

    if (selectedGender === "female") {
      candidates = candidates.filter(p => p.gender === 1);
    } else if (selectedGender === "male") {
      candidates = candidates.filter(p => p.gender === 2);
    }

    // Filter out previously shown
    candidates = candidates.filter(p => !shownCelebs.has(p.id));

    // Get full details to check age
    for (const person of candidates) {
      try {
        const detailRes = await fetch(`http://localhost:3000/api/person/${person.id}`); // Correct endpoint
        const detail = await detailRes.json();
        if (!detail.birthday) continue;

        const age = calculateAge(detail.birthday);
        if (age >= 21) {
          return {
            name: person.name,
            image: `https://image.tmdb.org/t/p/w500${person.profile_path}`,
            id: person.id,
            gender: person.gender,
            age
          };
        }
      } catch (e) {
        console.warn("Error fetching detail for", person.id);
      }
    }
  }
  return null; // If no suitable celeb found
}

// Load a card with a new celeb
async function loadCard(cardId) {
  const card = document.getElementById(cardId);
  const celeb = await getRandomCelebrity();

  if (!celeb) {
    card.innerHTML = `<p>No celeb found</p>`;
    return;
  }

  // Set gender data for later logic
  card.setAttribute('data-gender', celeb.gender);

  card.innerHTML = `
    <img src="${celeb.image}" alt="${celeb.name}" />
    <h3>${celeb.name}</h3>
  `;

  shownCelebs.add(celeb.id);
}

// Setup card click behavior
function setupVoting() {
  const card1 = document.getElementById("card1");
  const card2 = document.getElementById("card2");

  card1.addEventListener("click", async () => {
    await loadCard("card2");
  });

  card2.addEventListener("click", async () => {
    await loadCard("card1");
  });
}

// Handle gender toggle buttons
function setupToggleButtons() {
  const buttons = document.querySelectorAll(".tri-state-toggle-button");
  buttons.forEach(button => {
    button.addEventListener("click", async () => {
      const newGender = button.getAttribute("data-gender");
      if (newGender === selectedGender) return; // No change, do nothing

      // Update UI
      buttons.forEach(b => b.classList.remove("active"));
      button.classList.add("active");

      // Update gender selection
      const prevGender = selectedGender;
      selectedGender = newGender;

      const card1Gender = document.getElementById("card1").getAttribute('data-gender');
      const card2Gender = document.getElementById("card2").getAttribute('data-gender');

      // Logic: keep card showing current gender, refresh other
      if (selectedGender === "both") {
        if (card1Gender === "1") {
          await loadCard("card2");
        } else {
          await loadCard("card1");
        }
      } else {
        // If switching to male or female, refresh both
        await loadCard("card1");
        await loadCard("card2");
      }
    });
  });
}

// Initial load
loadCard("card1");
loadCard("card2");
setupVoting();
setupToggleButtons();
