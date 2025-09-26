/*
  Direct DB seeder for routes collection.
  Usage:
    - PowerShell (same shell):
        $env:MONGO_URI="YOUR_ATLAS_URI"   # may omit db name
        $env:MONGO_DB_NAME="smart-matatu" # optional, defaults to smart-matatu
        node scripts/seed-routes-direct.js
*/

const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')

const MONGO_URI = process.env.MONGO_URI
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'smart-matatu'
if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI not set. Set $env:MONGO_URI in this shell.')
  process.exit(1)
}

const seedFile = path.join(__dirname, 'seed-routes.json')
if (!fs.existsSync(seedFile)) {
  console.error('ERROR: scripts/seed-routes.json not found')
  process.exit(1)
}

// Minimal Route schema (aligns with backend)
const routeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    routeNumber: { type: String, default: '' },
    operator: { type: String, default: '' },
    operatingHours: {
      start: { type: String, default: '05:00' },
      end: { type: String, default: '22:00' },
    },
    stops: [
      {
        name: String,
        coordinates: [Number], // [lng, lat]
      },
    ],
    path: { type: [Number], default: [] }, // flat [lng,lat,...]
    fare: { type: Number, default: 50 },
    status: { type: String, default: 'active' },
    isActive: { type: Boolean, default: true },
    description: { type: String, default: 'Seeded route' },
  },
  { timestamps: true }
)

const Route = mongoose.models.Route || mongoose.model('Route', routeSchema, 'routes')

async function main() {
  await mongoose.connect(MONGO_URI, { autoIndex: false, dbName: MONGO_DB_NAME })
  console.log('Connected to MongoDB DB=', MONGO_DB_NAME)

  const raw = fs.readFileSync(seedFile, 'utf8')
  const seeds = JSON.parse(raw)

  let created = 0
  let updated = 0
  let skipped = 0

  for (const r of seeds) {
    if (!r || !r.name) { skipped++; continue }

    const defaults = {
      routeNumber: r.routeNumber || '',
      operator: r.operator || '',
      operatingHours: { start: '05:00', end: '22:00' },
      stops: (r.stops && r.stops.length) ? r.stops : [
        { name: 'Kencom', coordinates: [36.8219, -1.2921] },
        { name: 'Terminus', coordinates: [36.8000, -1.3000] },
      ],
      path: (r.path && r.path.length) ? r.path : [36.8219, -1.2921, 36.8000, -1.3000],
      fare: r.fare || 50,
      status: 'active',
      isActive: true,
      description: r.description || 'Seeded route',
    }

    const existing = await Route.findOne({ name: r.name }).lean()
    if (!existing) {
      await Route.create({ name: r.name, ...defaults })
      created++
    } else {
      await Route.updateOne({ _id: existing._id }, { $set: defaults })
      updated++
    }
  }

  console.log(`Created=${created} Updated=${updated} Skipped=${skipped}`)
  const total = await Route.countDocuments()
  console.log(`Total=${total}`)

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error('Seeding error:', err && err.message ? err.message : err)
  try { await mongoose.disconnect() } catch {}
  process.exit(1)
})
