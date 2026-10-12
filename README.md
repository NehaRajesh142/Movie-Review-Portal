# 🎞️ Crimson Reel: Film Review & Rating Portal

A web-based platform for browsing films, submitting star ratings and written reviews, and curating personal Favourites and Watch Later lists. It is built entirely with HTML5, CSS3 and vanilla JavaScript, with a black and crimson cinema theme.

## ✨ Features

- **Browse and discover:** responsive film grid with live search (title or director), genre filters and sorting (rating, year, title, most reviewed)
- **Ratings and reviews:** interactive 5-star input, average rating badge on every poster, and a film-reel style rating gauge in the detail view
- **Personal lists:** one-click Favourites and Watch Later, each with its own sidebar view
- **Top Rated view:** automatically shows films averaging 4 stars or higher
- **Recent activity feed:** live log of the latest reviews across all films
- **Add a film:** form-driven workflow to add new titles to the catalogue
- **Persistence:** everything is saved in the browser with `localStorage`, so there is no server or database

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 (Grid, Flexbox, conic-gradient, custom properties) |
| Logic | JavaScript (ES6) |
| Storage | Browser `localStorage` API |
| Fonts | Google Fonts (Bebas Neue, Cormorant Garamond, Inter) |

## 🚀 Getting Started

No installation or build step is needed.

```bash
git clone https://github.com/<your-username>/crimson-reel.git
cd crimson-reel
```

Then open `index.html` in any modern browser (Chrome, Firefox, Edge).

## 📁 Project Structure

```
crimson-reel/
├── index.html   # Page structure, sidebar, modals
├── styles.css   # Theme, layout, components
└── script.js    # State, rendering, events, localStorage
```

## 🔮 Future Enhancements

- Backend and database (REST API) so data is shared across users and devices
- User accounts and authentication
- Real poster artwork via a licensed movie API such as TMDb
- Personalised recommendations based on rating history
- Installable Progressive Web App

## 📄 License

This project was built as an academic mini project.
