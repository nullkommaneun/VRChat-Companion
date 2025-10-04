export function createSkeletonList({ count = 3, variant = "event" } = {}) {
  const container = document.createElement("ul");
  container.className = `skeleton-list skeleton-${variant}`;
  container.setAttribute("role", "list");
  for (let index = 0; index < count; index += 1) {
    container.appendChild(createSkeletonCard({ variant }));
  }
  return container;
}

export function createSkeletonCard({ variant = "event" } = {}) {
  const listItem = document.createElement("li");
  listItem.className = `skeleton-card skeleton-${variant}-card`;

  const block = document.createElement("div");
  block.className = "skeleton-block";

  const line1 = document.createElement("div");
  line1.className = "skeleton-line skeleton-line--title";

  const line2 = document.createElement("div");
  line2.className = "skeleton-line skeleton-line--subtitle";

  const line3 = document.createElement("div");
  line3.className = "skeleton-line skeleton-line--meta";

  block.append(line1, line2, line3);
  listItem.appendChild(block);
  return listItem;
}
