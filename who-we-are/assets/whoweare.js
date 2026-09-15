// Photo path fields are root-relative (the editor's Asset Manager uploads
// into the site-root assets/ folder), but this page lives one directory
// below the root — so a plain relative path needs a "../" to resolve there.
function toAssetUrl(path) {
  if (!path) return path;
  if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith("data:") || path.startsWith("/")) return path;
  return `../${path}`;
}

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
    photo.src = toAssetUrl(info.photo);
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
