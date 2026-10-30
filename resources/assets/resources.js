// Photo path fields are root-relative (the editor's Asset Manager uploads
// into the site-root assets/ folder), but this page lives one directory
// below the root — so a plain relative path needs a "../" to resolve there.
function toAssetUrl(path) {
  if (!path) return path;
  if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith("data:") || path.startsWith("/")) return path;
  return `../${path}`;
}

// Only http(s), mailto, and scheme-less (relative) URLs are allowed, so a
// hand-edited links.json can't turn a resource into a javascript: link.
function isSafeUrl(url) {
  if (!url) return false;
  const scheme = url.match(/^([a-z][a-z0-9+.-]*):/i);
  return !scheme || ["http", "https", "mailto"].includes(scheme[1].toLowerCase());
}

// Fetches links.json and renders one card per link into #resources, in file
// order (the editor's move up/down buttons control it).
async function renderResources() {
  const list = document.getElementById("resources");

  let links;
  try {
    const res = await fetch("links.json");
    links = await res.json();
  } catch (err) {
    list.textContent = "Couldn't load resources.";
    return;
  }

  for (const l of links) {
    if (!isSafeUrl(l.url)) continue;

    const card = document.createElement("div");
    card.className = "resource-card";

    if (l.photo) {
      const photo = document.createElement("img");
      photo.src = toAssetUrl(l.photo);
      photo.alt = "";
      card.append(photo);
    }

    const title = document.createElement("h3");
    const link = document.createElement("a");
    link.href = l.url;
    link.textContent = l.title || l.url;
    if (/^https?:/i.test(l.url)) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    title.append(link);
    card.append(title);

    if (l.description) {
      const description = document.createElement("p");
      description.className = "description";
      description.textContent = l.description;
      card.append(description);
    }

    list.append(card);
  }

  if (!list.children.length) list.textContent = "No resources yet.";
}
