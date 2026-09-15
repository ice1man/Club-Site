// Photo path fields are root-relative (the editor's Asset Manager uploads
// into the site-root assets/ folder), but this page lives one directory
// below the root — so a plain relative path needs a "../" to resolve there.
function toAssetUrl(path) {
  if (!path) return path;
  if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith("data:") || path.startsWith("/")) return path;
  return `../${path}`;
}

// Fetches admins.json and renders one card per admin into #admins.
async function renderAdmins() {
  const list = document.getElementById("admins");

  let admins;
  try {
    const res = await fetch("admins.json");
    admins = await res.json();
  } catch (err) {
    list.textContent = "Couldn't load admins.";
    return;
  }

  for (const a of admins) {
    const card = document.createElement("div");
    card.className = "admin-card";

    const photo = document.createElement("img");
    photo.src = toAssetUrl(a.photo);
    photo.alt = a.name;
    card.append(photo);

    const name = document.createElement("h3");
    name.textContent = a.name;
    card.append(name);

    const role = document.createElement("p");
    role.className = "role";
    role.textContent = a.role;
    card.append(role);

    if (a.bio) {
      const bio = document.createElement("p");
      bio.className = "bio";
      bio.textContent = a.bio;
      card.append(bio);
    }

    list.append(card);
  }
}
