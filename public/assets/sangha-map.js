const mapWidget = document.querySelector("[data-sangha-map]");
const mapElement = mapWidget?.querySelector("[data-map-canvas]");
const region = mapWidget?.closest(".region-map");
const desktopMap = matchMedia("(min-width: 900px)");
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

const markerSize = 44;
const markerSpacing = markerSize + 8;

function visibleMarkerGroups(regionalMap, venues) {
  const size = regionalMap.getSize();
  const edgeInset = markerSpacing / 2;
  const groups = [];
  for (const venue of venues) {
    const point = regionalMap.latLngToContainerPoint(venue.coordinates);
    if (
      point.x < edgeInset ||
      point.y < edgeInset ||
      point.x > size.x - edgeInset ||
      point.y > size.y - edgeInset
    )
      continue;

    // Keep each group anchored at its first venue, so packing a group never moves
    // its target into another target. Zooming in separates nearby venues.
    const group = groups.find(
      ({ anchor }) =>
        Math.abs(anchor.x - point.x) < markerSpacing &&
        Math.abs(anchor.y - point.y) < markerSpacing,
    );
    if (group) group.venues.push(venue);
    else groups.push({ anchor: point, venues: [venue] });
  }
  return groups;
}

function connectVenueMarkers(regionalMap, { layerGroup, marker, divIcon }, venues) {
  const layers = layerGroup().addTo(regionalMap);
  const details = mapWidget.querySelector("#sangha-map-selection");
  const title = details.querySelector("h3");
  const list = details.querySelector("[data-map-selection-venues]");
  const zoomSelection = details.querySelector("[data-map-zoom-selection]");
  let buttons = new Map();
  let selection = [];
  let activeButton;

  function closeDetails() {
    if (details.hidden) return;
    details.hidden = true;
    activeButton?.setAttribute("aria-expanded", "false");
    const returnTarget = activeButton || mapElement;
    returnTarget.focus({ preventScroll: true });
    returnTarget.scrollIntoView({ block: "nearest" });
    activeButton = undefined;
    selection = [];
  }

  function selectVenues(button, selected) {
    if (activeButton === button) {
      closeDetails();
      return;
    }
    activeButton?.setAttribute("aria-expanded", "false");
    activeButton = button;
    activeButton.setAttribute("aria-expanded", "true");
    selection = selected;
    title.textContent =
      selected.length === 1 ? selected[0].name : `${selected.length} nearby venues`;
    list.replaceChildren(
      ...selected.map(({ link }) => {
        const venue = link.parentElement
          .querySelector("template")
          .content.firstElementChild.cloneNode(true);
        const directoryLink = venue.querySelector("a");
        if (selected.length === 1) directoryLink.textContent = "View in directory";
        directoryLink.addEventListener("click", followDirectoryLink);
        return venue;
      }),
    );
    zoomSelection.hidden = selected.length < 2;
    details.hidden = false;
    details.focus({ preventScroll: true });
    details.scrollIntoView({ block: "nearest" });
  }

  function renderMarkers() {
    const focusKey = buttons.get(document.activeElement);
    layers.clearLayers();
    buttons = new Map();
    activeButton = undefined;

    for (const { venues: grouped } of visibleMarkerGroups(regionalMap, venues)) {
      const groupedNames = grouped.map(({ name }) => name);
      const key = grouped.map(({ link }) => link.hash).join(",");
      const button = document.createElement("button");
      button.className = "sangha-map-marker";
      button.type = "button";
      button.setAttribute(
        "aria-label",
        grouped.length === 1
          ? `View ${groupedNames[0]}`
          : `View ${grouped.length} nearby venues: ${groupedNames.join(", ")}`,
      );
      button.setAttribute("aria-controls", details.id);
      const isSelected =
        grouped.length === selection.length && grouped.every((venue) => selection.includes(venue));
      button.setAttribute("aria-expanded", String(isSelected));
      if (isSelected) activeButton = button;

      const dot = document.createElement("span");
      dot.setAttribute("aria-hidden", "true");
      if (grouped.length > 1) {
        button.dataset.grouped = "";
        dot.textContent = String(grouped.length);
      }
      button.append(dot);
      button.addEventListener("click", () => selectVenues(button, grouped));
      buttons.set(button, key);

      marker(grouped[0].coordinates, {
        keyboard: false,
        autoPanOnFocus: false,
        interactive: false,
        icon: divIcon({
          className: "sangha-map-marker-anchor",
          html: button,
          iconSize: [markerSize, markerSize],
          iconAnchor: [markerSize / 2, markerSize / 2],
        }),
      }).addTo(layers);
    }

    if (focusKey) {
      const equivalent = [...buttons.entries()].find(([, key]) => key === focusKey)?.[0];
      (equivalent || mapElement).focus({ preventScroll: true });
    }
  }

  details.querySelector("[data-map-close]").addEventListener("click", closeDetails);
  zoomSelection.addEventListener("click", () => {
    regionalMap.fitBounds(
      selection.map(({ coordinates }) => coordinates),
      {
        padding: [markerSpacing, markerSpacing],
        animate: false,
      },
    );
    mapElement.focus();
  });
  details.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeDetails();
  });
  regionalMap.on("moveend", renderMarkers);
  renderMarkers();
}

function connectZoom(regionalMap) {
  const zoomIn = mapWidget.querySelector("[data-map-zoom-in]");
  const zoomOut = mapWidget.querySelector("[data-map-zoom-out]");
  function updateZoomButtons() {
    zoomIn.setAttribute("aria-disabled", String(regionalMap.getZoom() >= regionalMap.getMaxZoom()));
    zoomOut.setAttribute(
      "aria-disabled",
      String(regionalMap.getZoom() <= regionalMap.getMinZoom()),
    );
  }
  zoomIn.addEventListener("click", () => regionalMap.zoomIn());
  zoomOut.addEventListener("click", () => regionalMap.zoomOut());
  regionalMap.on("zoomend zoomlevelschange", updateZoomButtons);
  updateZoomButtons();
}

function initializeMap(leaflet) {
  mapWidget.hidden = false;
  const animate = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const regionalMap = leaflet.map(mapElement, {
    attributionControl: false,
    zoomControl: false,
    scrollWheelZoom: false,
    fadeAnimation: animate,
    zoomAnimation: animate,
    markerZoomAnimation: animate,
    inertia: animate,
  });
  const venues = entries.map((link) => ({
    name: link.textContent.trim(),
    link,
    coordinates: [Number(link.dataset.mapLat), Number(link.dataset.mapLng)],
  }));
  regionalMap.fitBounds(
    venues.map(({ coordinates }) => coordinates),
    {
      padding: [markerSpacing / 2 + 1, markerSpacing / 2 + 1],
      maxZoom: 13,
    },
  );
  connectVenueMarkers(regionalMap, leaflet, venues);
  connectZoom(regionalMap);

  let focusInMap = false;
  document.addEventListener("focusin", (event) => {
    focusInMap = mapWidget.contains(event.target);
  });
  desktopMap.addEventListener("change", ({ matches }) => {
    if (matches) regionalMap.invalidateSize();
    else if (focusInMap) region.querySelector(".sangha-map-list summary").focus();
  });

  let loadedTiles = 0;
  let failedTiles = 0;
  leaflet
    .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 })
    .on("loading", () => {
      loadedTiles = 0;
      failedTiles = 0;
      status.textContent = "Loading map…";
      status.hidden = false;
    })
    .on("tileload", () => loadedTiles++)
    .on("tileerror", () => failedTiles++)
    .on("load", () => {
      status.hidden = failedTiles === 0;
      status.textContent =
        failedTiles === 0
          ? ""
          : loadedTiles
            ? "Some map tiles are unavailable. Venue links are in Mapped Sanghas."
            : "Map tiles are unavailable. Venue links are in Mapped Sanghas.";
    })
    .addTo(regionalMap);
}

// All visitors can use the venue list. Only initialize the interactive map on desktop.
if (region) {
  for (const link of entries) {
    link.addEventListener("click", followDirectoryLink);
  }
  const updateObservation = () => {
    if (desktopMap.matches) observer.observe(region);
    else observer.unobserve(region);
  };
  const observer = new IntersectionObserver((observations) => {
    if (!desktopMap.matches || !observations.some(({ isIntersecting }) => isIntersecting)) return;
    observer.disconnect();
    desktopMap.removeEventListener("change", updateObservation);
    import("./leaflet/leaflet-src.esm.js")
      .then((leaflet) => {
        if (desktopMap.matches) {
          initializeMap(leaflet);
          return;
        }
        // A resize can hide the canvas during the import. Wait for a measurable map.
        desktopMap.addEventListener("change", updateObservation);
        updateObservation();
      })
      .catch(() => {
        mapWidget.hidden = false;
        for (const element of mapWidget.children) element.hidden = element !== status;
        status.textContent = "The map is unavailable. Open Mapped Sanghas below for venue links.";
        status.hidden = false;
      });
  });
  desktopMap.addEventListener("change", updateObservation);
  updateObservation();
}
