// Seeds the Neo4j database with sample places.
// Graph model:
//   (Place)-[:IN_CITY]->(City)
//   (Place)-[:HAS_CATEGORY]->(Category)
//   (Place)-[:HAS_TAG]->(Tag)
//
// Run with: npm run seed
require('dotenv').config();
const { driver, verifyConnection, close } = require('./db');

const places = [
  {
    name: 'The Cozy Bean',
    city: 'Lisbon',
    category: 'Cafe',
    rating: 4.6,
    price: 2,
    description: 'A warm little coffee shop with homemade pastries.',
    tags: ['coffee', 'quiet', 'wifi', 'breakfast'],
  },
  {
    name: 'Ocean View Bistro',
    city: 'Lisbon',
    category: 'Restaurant',
    rating: 4.8,
    price: 3,
    description: 'Seafood restaurant with a stunning view over the river.',
    tags: ['seafood', 'romantic', 'view', 'dinner'],
  },
  {
    name: 'Green Garden Vegan',
    city: 'Lisbon',
    category: 'Restaurant',
    rating: 4.4,
    price: 2,
    description: 'Plant-based dishes made from local produce.',
    tags: ['vegan', 'healthy', 'lunch', 'quiet'],
  },
  {
    name: 'Night Groove Bar',
    city: 'Lisbon',
    category: 'Bar',
    rating: 4.2,
    price: 3,
    description: 'Lively cocktail bar with live music on weekends.',
    tags: ['cocktails', 'music', 'nightlife', 'friends'],
  },
  {
    name: 'City History Museum',
    city: 'Lisbon',
    category: 'Museum',
    rating: 4.5,
    price: 1,
    description: 'Explore the rich history of the city.',
    tags: ['culture', 'history', 'family', 'indoor'],
  },
  {
    name: 'Riverside Park',
    city: 'Porto',
    category: 'Park',
    rating: 4.7,
    price: 0,
    description: 'Large green park perfect for a relaxing walk.',
    tags: ['outdoor', 'family', 'quiet', 'nature'],
  },
  {
    name: 'Porto Wine Cellar',
    city: 'Porto',
    category: 'Bar',
    rating: 4.9,
    price: 3,
    description: 'Taste the finest local wines in a historic cellar.',
    tags: ['wine', 'romantic', 'culture', 'tasting'],
  },
  {
    name: 'Sunrise Coffee',
    city: 'Porto',
    category: 'Cafe',
    rating: 4.3,
    price: 1,
    description: 'Bright and friendly cafe with great espresso.',
    tags: ['coffee', 'breakfast', 'wifi', 'friends'],
  },
  {
    name: 'The Grill House',
    city: 'Porto',
    category: 'Restaurant',
    rating: 4.6,
    price: 3,
    description: 'Classic steakhouse with generous portions.',
    tags: ['meat', 'dinner', 'friends', 'hearty'],
  },
  {
    name: 'Modern Art Gallery',
    city: 'Porto',
    category: 'Museum',
    rating: 4.1,
    price: 2,
    description: 'Contemporary art from emerging local artists.',
    tags: ['culture', 'art', 'indoor', 'quiet'],
  },
  {
    name: 'Skyline Rooftop',
    city: 'Lisbon',
    category: 'Bar',
    rating: 4.7,
    price: 3,
    description: 'Rooftop bar with panoramic city views.',
    tags: ['cocktails', 'view', 'romantic', 'nightlife'],
  },
  {
    name: 'Little Italy Pizzeria',
    city: 'Porto',
    category: 'Restaurant',
    rating: 4.5,
    price: 2,
    description: 'Wood-fired pizzas in a family friendly setting.',
    tags: ['pizza', 'family', 'dinner', 'lunch'],
  },
];

async function seed() {
  const ok = await verifyConnection();
  if (!ok) {
    await close();
    process.exit(1);
  }

  const session = driver.session();
  try {
    console.log('🧹 Clearing existing data...');
    await session.run('MATCH (n) DETACH DELETE n');

    console.log('🌱 Creating constraints...');
    await session.run('CREATE CONSTRAINT place_name IF NOT EXISTS FOR (p:Place) REQUIRE p.name IS UNIQUE');
    await session.run('CREATE CONSTRAINT city_name IF NOT EXISTS FOR (c:City) REQUIRE c.name IS UNIQUE');
    await session.run('CREATE CONSTRAINT category_name IF NOT EXISTS FOR (c:Category) REQUIRE c.name IS UNIQUE');
    await session.run('CREATE CONSTRAINT tag_name IF NOT EXISTS FOR (t:Tag) REQUIRE t.name IS UNIQUE');

    console.log(`🌱 Inserting ${places.length} places...`);
    for (const place of places) {
      await session.run(
        `
        MERGE (p:Place {name: $name})
          SET p.rating = $rating,
              p.price = $price,
              p.description = $description
        MERGE (city:City {name: $city})
        MERGE (cat:Category {name: $category})
        MERGE (p)-[:IN_CITY]->(city)
        MERGE (p)-[:HAS_CATEGORY]->(cat)
        WITH p
        UNWIND $tags AS tagName
          MERGE (t:Tag {name: tagName})
          MERGE (p)-[:HAS_TAG]->(t)
        `,
        place
      );
    }

    console.log('✅ Seed complete!');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await session.close();
    await close();
  }
}

seed();
