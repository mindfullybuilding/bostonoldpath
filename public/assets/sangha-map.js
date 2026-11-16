const mapElement = document.querySelector("[data-sangha-map]");
const status = document.querySelector("[data-sangha-map-status]");
const entries = [...document.querySelectorAll("[data-map-lat][data-map-lng]")];

function visitCard(link) {
  const card = document.getElementById(link.hash.slice(1));
  if (!card) return;
  if (card.hidden) {
    document.getElementById("group-filters").reset();
    card.hidden = false;
  }
  location.hash = link.hash;
  card.focus({ preventScroll: true });
  card.scrollIntoView({ block: "start" });
}

async function initializeMap() {
  for (const link of entries) {
    link.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      visitCard(link);
    });
  }
  const { map, marker, tileLayer, divIcon } = await import("./leaflet/leaflet-src.esm.js");
  mapElement.hidden = false;
  const regionalMap = map(mapElement, { scrollWheelZoom: false });
  const coordinates = entries.map((link) => [
    Number(link.dataset.mapLat),
    Number(link.dataset.mapLng),
  ]);
  regionalMap.fitBounds(coordinates, { padding: [24, 24], maxZoom: 13 });
  for (const [index, link] of entries.entries()) {
    const point = coordinates[index];
    const pin = marker(point, {
      title: link.textContent.trim(),
      icon: divIcon({ className: "sangha-map-pin", iconSize: [32, 32], iconAnchor: [16, 16] }),
    });
    pin
      .on("click", () => visitCard(link))
      .on("keydown", ({ originalEvent }) => {
        if (!["Enter", " "].includes(originalEvent.key)) return;
        originalEvent.preventDefault();
        visitCard(link);
      })
      .addTo(regionalMap);
    pin.getElement().setAttribute("aria-label", `View ${link.textContent.trim()}`);
  }

  let loadedTile = false;
  tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    maxZoom: 19,
  })
    .on("tileload", () => {
      loadedTile = true;
      status.hidden = true;
    })
    .on("load", () => {
      if (loadedTile) return;
      status.textContent = "Map tiles are unavailable. Open Mapped Sanghas below for venue links.";
      status.hidden = false;
    })
    .addTo(regionalMap);
}

// Initialize when the desktop panel is on screen. Mobile and no-script visitors use the cards.
const region = mapElement?.closest(".region-map");
if (region) {
  const observer = new IntersectionObserver((observations) => {
    if (!observations.some(({ isIntersecting }) => isIntersecting)) return;
    observer.disconnect();
    initializeMap().catch(() => {
      mapElement.hidden = true;
      status.textContent = "The map is unavailable. Open Mapped Sanghas below for venue links.";
      status.hidden = false;
    });
  });
  observer.observe(region);
}
