/* ---------------------------------------------------
   Crimson Reel — Movie Review Portal
   All state lives in localStorage. No backend required.
--------------------------------------------------- */

const STORAGE_KEY = 'crimson-reel-movies-v2';

const GENRE_CLASS = {
  Drama: 'g-drama', Thriller: 'g-thriller', 'Sci-Fi': 'g-scifi',
  Horror: 'g-horror', Comedy: 'g-comedy', Romance: 'g-romance',
  Animation: 'g-animation', Action: 'g-action'
};

const VIEW_COPY = {
  all: { title: 'All Films', sub: 'Everything currently on the reel.' },
  top: { title: 'Top Rated', sub: 'Films averaging 4 stars or higher from the audience.' },
  favourites: { title: 'Your Favourites', sub: 'Films you\u2019ve marked with a heart.' },
  watchlater: { title: 'Watch Later', sub: 'Saved for whenever you\u2019re ready.' }
};

const SEED_MOVIES = [
  {
    id: 'm1', title: 'Glass Horizon', year: 2019, genre: 'Sci-Fi', director: 'Yuki Tanaka',
    desc: 'A satellite engineer discovers a signal that predicts the future, one hour at a time.',
    favourite: true, watchLater: false,
    reviews: [
      { id: 'r1', name: 'Marlowe D.', stars: 5, text: 'Cold, precise, and quietly devastating. The sound design alone deserves an award.', date: '2024-03-02' },
      { id: 'r2', name: 'Priya S.', stars: 4, text: 'Loses momentum in the second act but the ending recovers everything.', date: '2024-04-11' }
    ]
  },
  {
    id: 'm2', title: 'The Long Intermission', year: 2016, genre: 'Drama', director: 'Esteban Ruiz',
    desc: 'Two estranged siblings run their late father\'s cinema for one final summer.',
    favourite: false, watchLater: false,
    reviews: [
      { id: 'r3', name: 'Hannah K.', stars: 5, text: 'A love letter to old theaters. I cried twice and I am not sorry.', date: '2023-11-19' }
    ]
  },
  {
    id: 'm3', title: 'Nine Red Doors', year: 2021, genre: 'Horror', director: 'Constance Blackwood',
    desc: 'A locksmith is hired to open nine doors in a house that should only have eight.',
    favourite: false, watchLater: true,
    reviews: [
      { id: 'r4', name: 'Theo V.', stars: 4, text: 'Genuinely unsettling without leaning on jump scares. Rare these days.', date: '2024-01-08' },
      { id: 'r5', name: 'Marcus L.', stars: 3, text: 'Great premi\u00e8re half, the ending explains too much.', date: '2024-02-14' }
    ]
  },
  {
    id: 'm4', title: 'Paper Tigers', year: 2018, genre: 'Comedy', director: 'Odalys Ferreira',
    desc: 'Three failed startup founders pitch one last idea to save their friendship.',
    favourite: true, watchLater: false,
    reviews: [
      { id: 'r6', name: 'Grace N.', stars: 5, text: 'Sharp, fast, and surprisingly tender by the last act.', date: '2023-09-30' }
    ]
  },
  {
    id: 'm5', title: 'Amber & Ash', year: 2020, genre: 'Romance', director: 'Julien Marchetti',
    desc: 'A wildfire evacuation forces two former lovers into the same shelter, one night only.',
    favourite: false, watchLater: true,
    reviews: []
  },
  {
    id: 'm6', title: 'Iron Meridian', year: 2022, genre: 'Action', director: 'Dae-Ho Shin',
    desc: 'A retired courier is pulled back for one last run across a city under lockdown.',
    favourite: false, watchLater: false,
    reviews: [
      { id: 'r7', name: 'Ruth A.', stars: 4, text: 'The rooftop chase in reel two is worth the ticket alone.', date: '2024-05-01' }
    ]
  }
];

let movies = loadMovies();
let activeGenre = 'All';
let activeView = 'all';
let searchTerm = '';
let sortMode = 'rating-desc';
let currentDetailId = null;
let currentStarValue = 0;

/* ---------- persistence ---------- */
function loadMovies() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.map(m => ({ favourite: false, watchLater: false, ...m }));
    }
  } catch (e) { console.warn('Could not read saved data, starting fresh.', e); }
  return structuredClone(SEED_MOVIES);
}
function saveMovies() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
}

/* ---------- derived data ---------- */
function avgRating(movie) {
  if (!movie.reviews.length) return 0;
  return movie.reviews.reduce((s, r) => s + r.stars, 0) / movie.reviews.length;
}
function allGenres() {
  return ['All', ...new Set(movies.map(m => m.genre))];
}

/* ---------- rendering: sidebar nav ---------- */
document.getElementById('sideNav').addEventListener('click', e => {
  const btn = e.target.closest('.side-link');
  if (!btn) return;
  activeView = btn.dataset.view;
  document.querySelectorAll('.side-link').forEach(l => l.classList.toggle('active', l === btn));
  const copy = VIEW_COPY[activeView];
  document.getElementById('sectionTitle').textContent = copy.title;
  document.getElementById('sectionSub').textContent = copy.sub;
  renderGrid();
});

/* ---------- rendering: chips ---------- */
function renderChips() {
  const wrap = document.getElementById('genreChips');
  wrap.innerHTML = '';
  allGenres().forEach(genre => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (genre === activeGenre ? ' active' : '');
    chip.textContent = genre;
    chip.addEventListener('click', () => {
      activeGenre = genre;
      renderChips();
      renderGrid();
    });
    wrap.appendChild(chip);
  });
}

/* ---------- rating badge ---------- */
function badgeHTML(rating) {
  if (!rating) return `<span class="badge unrated">–</span>`;
  const outOfTen = (rating * 2).toFixed(1);
  return `<span class="badge">${outOfTen}</span>`;
}

/* ---------- reel gauge (detail modal) ---------- */
function reelGaugeHTML(rating) {
  const pct = Math.round((rating / 5) * 100);
  const label = rating > 0 ? rating.toFixed(1) : '—';
  return `<div class="reel-gauge" style="--pct:${pct}"><span>${label}</span></div>`;
}

/* ---------- rendering: grid ---------- */
function renderGrid() {
  const grid = document.getElementById('movieGrid');
  const empty = document.getElementById('emptyState');
  const term = searchTerm.trim().toLowerCase();

  let list = movies.filter(m => {
    if (activeView === 'top' && avgRating(m) < 4) return false;
    if (activeView === 'favourites' && !m.favourite) return false;
    if (activeView === 'watchlater' && !m.watchLater) return false;
    const matchesGenre = activeGenre === 'All' || m.genre === activeGenre;
    const matchesSearch = !term || m.title.toLowerCase().includes(term) || m.director.toLowerCase().includes(term);
    return matchesGenre && matchesSearch;
  });

  list = sortMovies(list, sortMode);

  grid.innerHTML = '';
  if (!list.length) {
    empty.hidden = false;
    empty.textContent = emptyMessage();
  } else {
    empty.hidden = true;
    list.forEach(m => grid.appendChild(buildCard(m)));
  }

  renderActivity();
}

function emptyMessage() {
  if (searchTerm.trim()) return 'No films match that search. Try a different title, director, or genre.';
  if (activeView === 'favourites') return 'You haven\u2019t favourited anything yet. Tap the heart on a poster to save it here.';
  if (activeView === 'watchlater') return 'Nothing queued up. Tap the clock icon on a poster to save it for later.';
  if (activeView === 'top') return 'No films have crossed a 4-star average yet.';
  return 'Nothing here yet.';
}

function sortMovies(list, mode) {
  const copy = [...list];
  switch (mode) {
    case 'rating-desc': return copy.sort((a, b) => avgRating(b) - avgRating(a));
    case 'rating-asc': return copy.sort((a, b) => avgRating(a) - avgRating(b));
    case 'year-desc': return copy.sort((a, b) => b.year - a.year);
    case 'year-asc': return copy.sort((a, b) => a.year - b.year);
    case 'title-asc': return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'reviews-desc': return copy.sort((a, b) => b.reviews.length - a.reviews.length);
    default: return copy;
  }
}

function buildCard(movie) {
  const card = document.createElement('article');
  card.className = 'card';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Open ${movie.title}`);

  const genreClass = GENRE_CLASS[movie.genre] || 'g-drama';
  const rating = avgRating(movie);

  card.innerHTML = `
    <div class="poster ${genreClass}" data-letter="${movie.title.charAt(0)}">
      <div class="poster-top-row">
        ${badgeHTML(rating)}
        <div class="poster-actions">
          <button class="icon-btn fav-btn ${movie.favourite ? 'on' : ''}" title="Favourite" aria-label="Toggle favourite">♥</button>
          <button class="icon-btn watch-btn ${movie.watchLater ? 'on' : ''}" title="Watch later" aria-label="Toggle watch later">⏱</button>
        </div>
      </div>
      <span class="poster-tag">${movie.genre}</span>
    </div>
    <div class="card-body">
      <h3 class="card-title">${escapeHTML(movie.title)}</h3>
      <p class="card-meta">${movie.year} · ${movie.reviews.length} review${movie.reviews.length === 1 ? '' : 's'}</p>
    </div>
  `;

  const open = () => openDetail(movie.id);
  card.addEventListener('click', open);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });

  card.querySelector('.fav-btn').addEventListener('click', e => {
    e.stopPropagation();
    movie.favourite = !movie.favourite;
    saveMovies();
    renderGrid();
  });
  card.querySelector('.watch-btn').addEventListener('click', e => {
    e.stopPropagation();
    movie.watchLater = !movie.watchLater;
    saveMovies();
    renderGrid();
  });

  return card;
}

/* ---------- recent activity feed ---------- */
function renderActivity() {
  const list = document.getElementById('activityList');
  const entries = [];
  movies.forEach(m => {
    m.reviews.forEach(r => entries.push({ movieTitle: m.title, name: r.name, stars: r.stars, date: r.date }));
  });
  entries.sort((a, b) => (a.date < b.date ? 1 : -1));

  list.innerHTML = '';
  if (!entries.length) {
    list.innerHTML = '<li class="activity-empty">No reviews yet.</li>';
    return;
  }
  entries.slice(0, 6).forEach(e => {
    const li = document.createElement('li');
    li.className = 'activity-item';
    li.innerHTML = `
      <span class="activity-dot"></span>
      <span class="activity-text">
        <b>${escapeHTML(e.name)}</b> reviewed <span class="on">${escapeHTML(e.movieTitle)}</span> — ${'★'.repeat(e.stars)}${'☆'.repeat(5 - e.stars)}
        <div class="activity-meta">${e.date}</div>
      </span>
    `;
    list.appendChild(li);
  });
}

/* ---------- detail modal ---------- */
function openDetail(id) {
  currentDetailId = id;
  const movie = movies.find(m => m.id === id);
  if (!movie) return;

  document.getElementById('detailPoster').className = 'detail-poster ' + (GENRE_CLASS[movie.genre] || 'g-drama');
  document.getElementById('detailPoster').setAttribute('data-letter', movie.title.charAt(0));
  document.getElementById('detailGenre').textContent = movie.genre;
  document.getElementById('detailTitle').textContent = movie.title;
  document.getElementById('detailMeta').textContent = `${movie.year} · Directed by ${movie.director}`;
  document.getElementById('detailDesc').textContent = movie.desc;

  refreshDetailGauge(movie);
  renderReviewList(movie);
  resetReviewForm();

  document.getElementById('detailBackdrop').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  document.getElementById('detailBackdrop').hidden = true;
  document.body.style.overflow = '';
  currentDetailId = null;
}

function renderReviewList(movie) {
  const list = document.getElementById('reviewList');
  document.getElementById('reviewCount').textContent = movie.reviews.length;
  list.innerHTML = '';

  if (!movie.reviews.length) {
    list.innerHTML = '<li class="review-empty">No reviews yet — be the first to weigh in.</li>';
    return;
  }

  [...movie.reviews].reverse().forEach(r => {
    const li = document.createElement('li');
    li.className = 'review-item';
    li.innerHTML = `
      <div class="review-item-head">
        <span class="review-name">${escapeHTML(r.name)}</span>
        <span class="review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span>
      </div>
      <p class="review-text">${escapeHTML(r.text)}</p>
      <div class="review-date">${r.date}</div>
      <button class="review-delete" data-review-id="${r.id}">Remove review</button>
    `;
    list.appendChild(li);
  });

  list.querySelectorAll('.review-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const movie = movies.find(m => m.id === currentDetailId);
      movie.reviews = movie.reviews.filter(r => r.id !== btn.dataset.reviewId);
      saveMovies();
      renderReviewList(movie);
      refreshDetailGauge(movie);
      renderGrid();
    });
  });
}

function refreshDetailGauge(movie) {
  const rating = avgRating(movie);
  document.getElementById('detailGaugeWrap').innerHTML = reelGaugeHTML(rating) +
    `<div class="gauge-caption">House verdict from <b>${movie.reviews.length}</b> review${movie.reviews.length === 1 ? '' : 's'}. Every ring segment is one star, averaged.</div>`;
}

/* ---------- star input ---------- */
function resetReviewForm() {
  document.getElementById('reviewForm').reset();
  currentStarValue = 0;
  paintStars(0);
}
function paintStars(value) {
  document.querySelectorAll('#starInput span').forEach(s => {
    s.classList.toggle('filled', Number(s.dataset.star) <= value);
  });
}

document.getElementById('starInput').addEventListener('click', e => {
  if (e.target.dataset.star) {
    currentStarValue = Number(e.target.dataset.star);
    paintStars(currentStarValue);
  }
});
document.getElementById('starInput').addEventListener('mouseover', e => {
  if (e.target.dataset.star) paintStars(Number(e.target.dataset.star));
});
document.getElementById('starInput').addEventListener('mouseleave', () => paintStars(currentStarValue));

/* ---------- review submit ---------- */
document.getElementById('reviewForm').addEventListener('submit', e => {
  e.preventDefault();
  const movie = movies.find(m => m.id === currentDetailId);
  if (!movie) return;

  if (currentStarValue === 0) {
    flashRequired(document.getElementById('starInput'));
    return;
  }

  const name = document.getElementById('reviewerName').value.trim();
  const text = document.getElementById('reviewText').value.trim();
  if (!name || !text) return;

  movie.reviews.push({
    id: 'r' + Date.now(),
    name, stars: currentStarValue, text,
    date: new Date().toISOString().slice(0, 10)
  });

  saveMovies();
  renderReviewList(movie);
  refreshDetailGauge(movie);
  renderGrid();
  resetReviewForm();
});

function flashRequired(el) {
  el.style.transition = 'none';
  el.style.filter = 'drop-shadow(0 0 6px var(--crimson-bright))';
  requestAnimationFrame(() => {
    el.style.transition = 'filter .4s ease';
    el.style.filter = 'none';
  });
}

/* ---------- add movie ---------- */
document.getElementById('addMovieForm').addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('newTitle').value.trim();
  const year = Number(document.getElementById('newYear').value);
  const genre = document.getElementById('newGenre').value;
  const director = document.getElementById('newDirector').value.trim();
  const desc = document.getElementById('newDesc').value.trim();
  if (!title || !year || !genre || !director || !desc) return;

  movies.unshift({
    id: 'm' + Date.now(),
    title, year, genre, director, desc,
    favourite: false, watchLater: false,
    reviews: []
  });

  saveMovies();
  renderChips();
  renderGrid();
  document.getElementById('addMovieForm').reset();
  document.getElementById('addBackdrop').hidden = true;
  document.body.style.overflow = '';
});

/* ---------- search & sort ---------- */
document.getElementById('searchInput').addEventListener('input', e => {
  searchTerm = e.target.value;
  renderGrid();
});
document.getElementById('sortSelect').addEventListener('change', e => {
  sortMode = e.target.value;
  renderGrid();
});

/* ---------- modal open/close wiring ---------- */
document.getElementById('closeDetail').addEventListener('click', closeDetail);
document.getElementById('detailBackdrop').addEventListener('click', e => {
  if (e.target.id === 'detailBackdrop') closeDetail();
});

document.getElementById('openAddMovie').addEventListener('click', () => {
  document.getElementById('addBackdrop').hidden = false;
  document.body.style.overflow = 'hidden';
});
document.getElementById('closeAdd').addEventListener('click', () => {
  document.getElementById('addBackdrop').hidden = true;
  document.body.style.overflow = '';
});
document.getElementById('addBackdrop').addEventListener('click', e => {
  if (e.target.id === 'addBackdrop') {
    document.getElementById('addBackdrop').hidden = true;
    document.body.style.overflow = '';
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeDetail();
    document.getElementById('addBackdrop').hidden = true;
    document.body.style.overflow = '';
  }
});

/* ---------- utils ---------- */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- init ---------- */
renderChips();
renderGrid();
