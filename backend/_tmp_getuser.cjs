// Read-only: берём из БД первый активный пользователь, чтобы подписать dev-JWT
require('dotenv').config({ path: __dirname + '/.env' })
const mongoose = require('mongoose')
const User = require('./models/User')

;(async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 })
  const u = await User.findOne({ isActive: { $ne: false } }, { _id: 1, username: 1 }).lean()
  console.log(JSON.stringify({ id: u?._id?.toString(), username: u?.username ?? null }))
  await mongoose.disconnect()
})().catch((e) => { console.error('ERR', e.message); process.exit(1) })
