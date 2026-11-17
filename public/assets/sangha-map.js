const mapElement = document.querySelector("[data-sangha-map]");
const status = document.querySelector("[data-sangha-map-status]");
const entries = [...document.querySelectorAll("[data-map-lat][data-map-lng]")];

function followDirectoryLink(event) {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const link = event.currentTarget;
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

function connectMapDetails(pin, link) {
  const pinElement = pin.getElement();
  const details = link.parentElement
    .querySelector("template")
    .content.firstElementChild.cloneNode(true);
  const close = () => {
    pin.closePopup();
    pinElement.focus({ preventScroll: true });
  };

  details.querySelector("a").addEventListener("click", followDirectoryLink);
  details.querySelector("button").addEventListener("click", close);
  details.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    close();
  });

  pinElement.setAttribute("aria-label", `View ${link.textContent.trim()}`);
  pinElement.setAttribute("aria-expanded", "false");
  pin.bindPopup(details, {
    className: "sangha-map-popup",
    closeButton: false,
    maxHeight: 190,
    minWidth: 224,
    maxWidth: 248,
    offset: [0, -10],
    autoPanPadding: [12, 12],
  });
  pin.on("popupopen", () => {
    pinElement.setAttribute("aria-controls", details.id);
    pinElement.setAttribute("aria-expanded", "true");
    details.focus({ preventScroll: true });
  });
  pin.on("popupclose", () => {
    pinElement.removeAttribute("aria-controls");
    pinElement.setAttribute("aria-expanded", "false");
  });
  pin.on("keydown", ({ originalEvent }) => {
    if (originalEvent.key !== " ") return;
    originalEvent.preventDefault();
    pin.togglePopup();
  });
}

async function initializeMap() {
  for (const link of entries) {
    link.addEventListener("click", followDirectoryLink);
  }
  const { map, marker, tileLayer, divIcon } = await import("./leaflet/leaflet-src.esm.js");
  mapElement.hidden = false;
  const regionalMap = map(mapElement, {
    scrollWheelZoom: false,
    fadeAnimation: !matchMedia("(prefers-reduced-motion: reduce)").matches,
  });
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
    }).addTo(regionalMap);
    connectMapDetails(pin, link);
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
