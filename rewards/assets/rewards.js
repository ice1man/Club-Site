// Fetches awards.json and renders one card per award into #rewards.
async function renderRewards() {
  const list = document.getElementById("rewards");

  let awards;
  try {
    const res = await fetch("awards.json");
    awards = await res.json();
  } catch (err) {
    list.textContent = "Couldn't load rewards.";
    return;
  }

  // Newest first; undated entries sort last.
  awards = [...awards].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  for (const a of awards) {
    const card = document.createElement("div");
    card.className = "award-card";

    if (a.photo) {
      const photo = document.createElement("img");
      photo.src = a.photo;
      photo.alt = a.award;
      card.append(photo);
    }

    const award = document.createElement("h3");
    award.textContent = a.award;
    card.append(award);

    const recipient = document.createElement("p");
    recipient.className = "recipient";
    recipient.textContent = a.recipient;
    card.append(recipient);

    if (a.date) {
      const [y, m, d] = a.date.split("-").map(Number);
      const date = document.createElement("p");
      date.className = "date";
      date.textContent = new Date(y, m - 1, d).toLocaleDateString(undefined, {
        month: "long", year: "numeric",
      });
      card.append(date);
    }

    if (a.description) {
      const description = document.createElement("p");
      description.className = "description";
      description.textContent = a.description;
      card.append(description);
    }

    list.append(card);
  }
}
