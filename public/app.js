// Frontend logic: loads form options, handles tag selection, calls the API,
// and renders recommendation cards.

const selectedTags = new Set();

// Map price integer -> display symbol.
function priceLabel(price) {
  if (price === 0) return 'Free';
  return '$'.repeat(price);
}

// Load cities, categories and tags into the form.
async function loadOptions() {
  try {
    const res = await fetch('/api/options');
    if (!res.ok) throw new Error('Failed to load options');
    const data = await res.json();

    const citySelect = document.getElementById('city');
    data.cities.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      citySelect.appendChild(opt);
    });

    const catSelect = document.getElementById('category');
    data.categories.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      catSelect.appendChild(opt);
    });

    const tagContainer = document.getElementById('tagContainer');
    data.tags.forEach((tag) => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.textContent = tag;
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        if (selectedTags.has(tag)) {
          selectedTags.delete(tag);
        } else {
          selectedTags.add(tag);
        }
      });
      tagContainer.appendChild(chip);
    });
  } catch (err) {
    showStatus(
      `<div class="alert alert-danger">Could not load options. Make sure Neo4j is running and you ran <code>npm run seed</code>.</div>`
    );
  }
}

function showStatus(html) {
  document.getElementById('statusArea').innerHTML = html;
}

// Escape user/db text before inserting as HTML.
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function renderResults(results) {
  const container = document.getElementById('results');
  container.innerHTML = '';

  if (!results.length) {
    showStatus(
      `<div class="alert alert-warning">No places matched your preferences. Try loosening your filters.</div>`
    );
    return;
  }

  showStatus(
    `<p class="text-muted">Found ${results.length} place${results.length > 1 ? 's' : ''} for you:</p>`
  );

  results.forEach((place) => {
    const tagsHtml = (place.tags || [])
      .map((t) => `<span class="tag-pill">${escapeHtml(t)}</span>`)
      .join('');

    const matchBadge =
      place.matchedTags > 0
        ? `<span class="badge bg-success match-badge">${place.matchedTags} tag match${
            place.matchedTags > 1 ? 'es' : ''
          }</span>`
        : '';

    const col = document.createElement('div');
    col.className = 'col-md-6';
    col.innerHTML = `
      <div class="card h-100 shadow-sm place-card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <h5 class="card-title mb-1">${escapeHtml(place.name)}</h5>
            <span class="badge bg-warning text-dark">
              <i class="bi bi-star-fill"></i> ${escapeHtml(place.rating)}
            </span>
          </div>
          <h6 class="card-subtitle mb-2 text-muted">
            <i class="bi bi-geo-alt"></i> ${escapeHtml(place.city)} ·
            ${escapeHtml(place.category)} ·
            ${priceLabel(place.price)}
          </h6>
          <p class="card-text small">${escapeHtml(place.description)}</p>
          <div class="mb-2">${tagsHtml}</div>
          ${matchBadge}
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}

// Update the price slider label as the user drags.
const priceSlider = document.getElementById('maxPrice');
priceSlider.addEventListener('input', () => {
  const val = Number(priceSlider.value);
  document.getElementById('priceLabel').textContent =
    val === 3 ? 'Any' : priceLabel(val);
});

// Handle form submission.
document.getElementById('prefForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const city = document.getElementById('city').value;
  const category = document.getElementById('category').value;
  const priceVal = Number(priceSlider.value);
  // A value of 3 (max) means "any price", so we send null.
  const maxPrice = priceVal === 3 ? null : priceVal;

  showStatus(`<div class="text-center py-3"><div class="spinner-border text-primary"></div></div>`);
  document.getElementById('results').innerHTML = '';

  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city,
        category,
        tags: Array.from(selectedTags),
        maxPrice,
      }),
    });

    if (!res.ok) throw new Error('Request failed');
    const data = await res.json();
    renderResults(data.results || []);
  } catch (err) {
    showStatus(`<div class="alert alert-danger">Something went wrong. Is the server running?</div>`);
  }
});

// Kick things off.
loadOptions();
