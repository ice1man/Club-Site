// Fetches info.json and renders the photo, mission, and reasons.
async function renderWhoWeAre() {
  const container = document.getElementById("who-we-are");

  let info;
  try {
    const res = await fetch("info.json");
    info = await res.json();
  } catch (err) {
    container.textContent = "Couldn't load this page's content.";
    return;
  }

  if (info.photo) {
    const photo = document.createElement("img");
    photo.className = "club-photo";
    photo.src = info.photo;
    photo.alt = "Club photo";
    container.append(photo);
  }

  if (info.mission) {
    const mission = document.createElement("p");
    mission.className = "mission";
    mission.textContent = info.mission;
    container.append(mission);
  }

  if (info.reasons && info.reasons.length) {
    const heading = document.createElement("h2");
    heading.textContent = "Why we're worth taking seriously";
    container.append(heading);

    const list = document.createElement("ul");
    list.className = "reasons";
    for (const reason of info.reasons) {
      const li = document.createElement("li");
      li.textContent = reason;
      list.append(li);
    }
    container.append(list);
  }
}
