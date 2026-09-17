// Express server exposing the recommendation API and serving the frontend.
require('dotenv').config();
const path = require('path');
const express = require('express');
const { runQuery, verifyConnection, close } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Neo4j integers come back as { low, high } objects. This flattens them to JS numbers.
function toNumber(value) {
  if (value == null) return value;
  if (typeof value === 'object' && 'low' in value) return value.low;
  return value;
}

// GET /api/options -> lists available cities, categories and tags for the form.
app.get('/api/options', async (req, res) => {
  try {
    const cities = await runQuery('MATCH (c:City) RETURN c.name AS name ORDER BY name');
    const categories = await runQuery('MATCH (c:Category) RETURN c.name AS name ORDER BY name');
    const tags = await runQuery('MATCH (t:Tag) RETURN t.name AS name ORDER BY name');

    res.json({
      cities: cities.map((r) => r.get('name')),
      categories: categories.map((r) => r.get('name')),
      tags: tags.map((r) => r.get('name')),
    });
  } catch (err) {
    console.error('Error loading options:', err.message);
    res.status(500).json({ error: 'Could not load options. Is Neo4j running and seeded?' });
  }
});

// POST /api/recommend -> returns scored places matching the user's preferences.
// Body: { city?: string, category?: string, tags?: string[], maxPrice?: number }
app.post('/api/recommend', async (req, res) => {
  const { city, category, tags = [], maxPrice } = req.body || {};

  try {
    // Scoring:
    //   +3 if the city matches
    //   +2 if the category matches
    //   +1 for each matching tag
    // We also add rating as a tie-breaker.
    const cypher = `
      MATCH (p:Place)-[:IN_CITY]->(city:City)
      MATCH (p)-[:HAS_CATEGORY]->(cat:Category)
      OPTIONAL MATCH (p)-[:HAS_TAG]->(t:Tag)
      WITH p, city, cat, collect(t.name) AS placeTags
      WHERE ($maxPrice IS NULL OR p.price <= $maxPrice)
      WITH p, city, cat, placeTags,
           (CASE WHEN $city IS NULL OR $city = '' OR city.name = $city THEN 0 ELSE -1000 END) AS cityFilter,
           (CASE WHEN $category IS NULL OR $category = '' OR cat.name = $category THEN 0 ELSE -1000 END) AS catFilter,
           (CASE WHEN $city <> '' AND city.name = $city THEN 3 ELSE 0 END) AS cityScore,
           (CASE WHEN $category <> '' AND cat.name = $category THEN 2 ELSE 0 END) AS catScore,
           size([tag IN placeTags WHERE tag IN $tags]) AS matchedTagCount
      WITH p, city, cat, placeTags, matchedTagCount,
           (cityFilter + catFilter + cityScore + catScore + matchedTagCount) AS score
      WHERE score > -100
      RETURN p.name AS name,
             p.description AS description,
             p.rating AS rating,
             p.price AS price,
             city.name AS city,
             cat.name AS category,
             placeTags AS tags,
             matchedTagCount AS matchedTags,
             score AS score
      ORDER BY score DESC, p.rating DESC
      LIMIT 8
    `;

    const params = {
      city: city || '',
      category: category || '',
      tags: Array.isArray(tags) ? tags : [],
      maxPrice: maxPrice != null && maxPrice !== '' ? Number(maxPrice) : null,
    };

    const records = await runQuery(cypher, params);

    const results = records.map((r) => ({
      name: r.get('name'),
      description: r.get('description'),
      rating: r.get('rating'),
      price: toNumber(r.get('price')),
      city: r.get('city'),
      category: r.get('category'),
      tags: r.get('tags'),
      matchedTags: toNumber(r.get('matchedTags')),
      score: toNumber(r.get('score')),
    }));

    res.json({ results });
  } catch (err) {
    console.error('Error building recommendations:', err.message);
    res.status(500).json({ error: 'Could not build recommendations.' });
  }
});

async function start() {
  await verifyConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

// Close the driver cleanly on shutdown.
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await close();
  process.exit(0);
});

start();
