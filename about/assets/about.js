// Photo path fields are root-relative (the editor's Asset Manager uploads
// into the site-root assets/ folder), but this page lives one directory
// below the root — so a plain relative path needs a "../" to resolve there.
function toAssetUrl(path) {
  if (!path) return path;
  if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith("data:") || path.startsWith("/")) return path;
  return `../${path}`;
}

// Generic "missing person" glyph shown when an admin has no photo set.
const MISSING_PHOTO_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2.5c-3.34 0-10 1.68-10 5v2.5h20V19.5c0-3.32-6.66-5-10-5z"/></svg>';

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

    let photo;
    if (a.photo) {
      photo = document.createElement("img");
      photo.src = toAssetUrl(a.photo);
      photo.alt = a.name;
    } else {
      photo = document.createElement("div");
      photo.className = "admin-photo-placeholder";
      photo.setAttribute("role", "img");
      photo.setAttribute("aria-label", `${a.name} (no photo)`);
      photo.innerHTML = MISSING_PHOTO_SVG;
    }
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
