# 📍 Place Finder — Mini Recommendation System

A simple, friendly place recommendation app. Pick a city, a category, a price range, and the things you're into — it recommends matching places, ranked by how well they fit.

Built with **Node.js + Express**, a **Neo4j** graph database, and an **HTML / CSS / Bootstrap** frontend.

---

## How it works

Places are stored as a small graph:

```
(Place)-[:IN_CITY]->(City)
(Place)-[:HAS_CATEGORY]->(Category)
(Place)-[:HAS_TAG]->(Tag)
```

When you ask for recommendations, the server scores every place:

| Match            | Points |
| ---------------- | ------ |
| City matches     | +3     |
| Category matches | +2     |
| Each tag matches | +1     |

Ties are broken by the place's rating. The top 8 results are returned.

---

## Prerequisites

1. **Node.js** 16 or newer — https://nodejs.org
2. **A running Neo4j database.** Either:
   - [Neo4j Desktop](https://neo4j.com/download/) (create a local database and start it), or
   - [Neo4j Aura](https://neo4j.com/cloud/aura/) free tier (cloud), or
   - Docker: `docker run -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password123 neo4j:5`

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure your database connection

Copy the example env file and fill in your credentials:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Then edit `.env`:

```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password_here
PORT=3000
```

> Using Neo4j Aura? Use the full `neo4j+s://...` URI they provide.

### 3. Seed the sample data

This clears the database and loads 12 sample places:

```bash
npm run seed
```

### 4. Start the app

```bash
npm start
```

Open **http://localhost:3000** in your browser.

---

## Project structure

```
.
├── db.js            # Shared Neo4j driver + query helper
├── seed.js          # Loads sample places into Neo4j
├── server.js        # Express server + recommendation API
├── package.json
├── .env.example
└── public/
    ├── index.html   # Bootstrap UI
    ├── styles.css   # Styling
    └── app.js       # Frontend logic
```

## API

### `GET /api/options`
Returns the available cities, categories and tags for the form.

### `POST /api/recommend`
Body:
```json
{
  "city": "Lisbon",
  "category": "Cafe",
  "tags": ["coffee", "quiet"],
  "maxPrice": 2
}
```
All fields are optional. Returns a ranked list of matching places.

---

## Troubleshooting

- **"Could not connect to Neo4j"** — Make sure your database is running and the credentials in `.env` are correct.
- **No options / no results** — Run `npm run seed` first.
- **Port already in use** — Change `PORT` in `.env`.
