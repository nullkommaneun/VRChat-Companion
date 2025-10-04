export function createEventCard({ event, onToggleFavorite, favorite, formatDate }) {
  const listItem = document.createElement("li");
  listItem.className = "event-card-item";

  const article = document.createElement("article");
  article.className = "event-card";
  article.setAttribute("aria-labelledby", `event-${event.id}-title`);

  if (event.featured) {
    article.classList.add("is-featured");
  }

  const header = document.createElement("header");
  header.className = "event-card__header";

  const title = document.createElement("h3");
  title.className = "event-card__title";
  title.id = `event-${event.id}-title`;
  title.textContent = event.title;

  const favoriteButton = document.createElement("button");
  favoriteButton.type = "button";
  favoriteButton.className = "event-card__favorite";
  favoriteButton.classList.toggle("is-active", Boolean(favorite));
  favoriteButton.setAttribute("aria-pressed", String(Boolean(favorite)));
  favoriteButton.setAttribute(
    "aria-label",
    favorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"
  );
  favoriteButton.innerHTML = favorite ? "★" : "☆";
  favoriteButton.addEventListener("click", () => {
    onToggleFavorite?.();
    const isFav = !favoriteButton.classList.contains("is-active");
    favoriteButton.classList.toggle("is-active", isFav);
    favoriteButton.setAttribute("aria-pressed", String(isFav));
    favoriteButton.innerHTML = isFav ? "★" : "☆";
    favoriteButton.setAttribute(
      "aria-label",
      isFav ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"
    );
  });

  header.append(title, favoriteButton);

  if (event.image) {
    const figure = document.createElement("figure");
    figure.className = "event-card__media";

    const img = document.createElement("img");
    img.src = event.image;
    img.alt = event.title;
    img.loading = "lazy";
    figure.appendChild(img);

    article.appendChild(figure);
  }

  const timeInfo = document.createElement("p");
  timeInfo.className = "event-card__time";
  timeInfo.textContent = `${formatDate(event.startsAt)} – ${formatDate(event.endsAt)}`;

  const locationInfo = document.createElement("p");
  locationInfo.className = "event-card__location";
  locationInfo.textContent = event.location || "VRChat";

  article.append(header, timeInfo, locationInfo);

  if (Array.isArray(event.tags) && event.tags.length > 0) {
    const tagList = document.createElement("ul");
    tagList.className = "event-card__tags";
    tagList.setAttribute("role", "list");
    event.tags.forEach((tag) => {
      const tagItem = document.createElement("li");
      tagItem.textContent = tag;
      tagList.appendChild(tagItem);
    });
    article.appendChild(tagList);
  }

  const footer = document.createElement("footer");
  footer.className = "event-card__footer";

  const link = document.createElement("a");
  link.href = event.vrchatUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Event öffnen";
  link.className = "event-card__link";

  footer.appendChild(link);
  article.appendChild(footer);

  listItem.appendChild(article);
  return listItem;
}
