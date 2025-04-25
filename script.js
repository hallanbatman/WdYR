// Celebrity Crush Game - Full JS with Gender Toggle, Age Filter, and Non-Repeating Logic

// Determine backend URL
const apiUrl = "https://wdyr-4b67580946ff.herokuapp.com";

const shownCelebs = new Set();
let selectedGender = "both"; // default option

function getGenderCode(gender) {
  if (gender === "female") return 1;
  if (gender === "male") return 2;
  return null; // for 'both'
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
  for (let i = 0; i < 20; i++) {
    const page = Math.floor(Math.random() * 50) + 1;
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
  return null;
}

async function loadCard(cardId) {
  const card = document.getElementById(cardId);
  const celeb = await getRandomCelebrity();

  if (!celeb) {
    card.innerHTML = `<p>No celeb found</p>`;
    return;
  }

  card.setAttribute('data-gender', celeb.gender);

  card.innerHTML = `
    <img src="${celeb.image}" alt="${celeb.name}" />
    <h3>${celeb.name}</h3>
  `;

  shownCelebs.add(celeb.id);
}

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

loadCard("card1");
loadCard("card2");
setupVoting();
setupToggleButtons();
