import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

const app = express()
app.use(cors())
app.use(express.json())
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' }
})

const UserSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    role: { type: String, required: true, enum: ['team', 'player'] },
    managerName: String,
    teamName: String,
    playerName: String,
    playerRole: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  },
  { timestamps: true }
)

const TeamSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    purse: { type: Number, required: true, default: 20000000 },
    spent: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
)

const PlayerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    basePrice: { type: Number, required: true },
    highestBid: { type: Number, required: true },
    team: { type: String, default: null },
    sold: { type: Boolean, default: false }
  },
  { timestamps: true }
)

const BidSchema = new mongoose.Schema(
  {
    playerId: { type: String, required: true, index: true },
    teamId: { type: String, required: true, index: true },
    amount: { type: Number, required: true }
  },
  { timestamps: true }
)

BidSchema.index({ playerId: 1, teamId: 1 }, { unique: true })

const User = mongoose.models.User || mongoose.model('User', UserSchema)
const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema)
const Player = mongoose.models.Player || mongoose.model('Player', PlayerSchema)
const Bid = mongoose.models.Bid || mongoose.model('Bid', BidSchema)

const normalizeName = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`

const findTeamByNormalizedName = async (teamName) => {
  const allTeams = await Team.find()
  return allTeams.find((team) => normalizeName(team.name) === normalizeName(teamName)) || null
}

const DEFAULT_TEAMS = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E', 'Team F', 'Team G', 'Team H']
const ROUND_SECONDS = 25

const auctionRoundState = {
  currentPlayerId: null,
  isRunning: false,
  startedAt: null,
  pausedRemaining: ROUND_SECONDS,
  roundSeconds: ROUND_SECONDS,
  updatedAt: Date.now()
}

async function seedDatabaseIfEmpty() {
  const teamCount = await Team.countDocuments()
  if (teamCount === 0) {
    await Team.insertMany(
      DEFAULT_TEAMS.map((name, index) => ({
        id: `t${index + 1}`,
        name,
        purse: 20000000,
        spent: 0
      }))
    )
    console.log('Seeded default teams')
  }
}

const getOrderedPlayers = () => Player.find().sort({ createdAt: 1 }).lean()

const getFirstUnsoldPlayer = async () => {
  const players = await getOrderedPlayers()
  return players.find((player) => !player.sold) || null
}

const getNextUnsoldPlayerAfter = async (playerId) => {
  const players = await getOrderedPlayers()
  const currentIndex = players.findIndex((player) => player.id === playerId)
  if (currentIndex < 0) {
    return players.find((player) => !player.sold) || null
  }
  for (let index = currentIndex + 1; index < players.length; index += 1) {
    if (!players[index].sold) return players[index]
  }
  return null
}

const getRemainingSeconds = () => {
  if (!auctionRoundState.isRunning || !auctionRoundState.startedAt) {
    return auctionRoundState.pausedRemaining
  }
  const elapsed = Math.floor((Date.now() - auctionRoundState.startedAt) / 1000)
  return Math.max(0, auctionRoundState.roundSeconds - elapsed)
}

const touchAuctionRoundState = () => {
  auctionRoundState.updatedAt = Date.now()
}

const snapshotAuctionRoundState = () => ({
  currentPlayerId: auctionRoundState.currentPlayerId,
  isRunning: auctionRoundState.isRunning,
  startedAt: auctionRoundState.startedAt,
  pausedRemaining: auctionRoundState.pausedRemaining,
  roundSeconds: auctionRoundState.roundSeconds,
  remainingSeconds: getRemainingSeconds(),
  updatedAt: auctionRoundState.updatedAt,
  serverNow: Date.now()
})

const pauseAuctionRound = () => {
  auctionRoundState.pausedRemaining = getRemainingSeconds()
  auctionRoundState.isRunning = false
  auctionRoundState.startedAt = null
  touchAuctionRoundState()
}

const getPlayersWithBids = async () => {
  const players = await Player.find().sort({ createdAt: 1 }).lean()
  const playerIds = players.map((player) => player.id)
  const bids = await Bid.find({ playerId: { $in: playerIds } }).lean()

  const bidsByPlayer = bids.reduce((acc, bid) => {
    acc[bid.playerId] = acc[bid.playerId] || []
    acc[bid.playerId].push({ teamId: bid.teamId, amount: bid.amount })
    return acc
  }, {})

  return players.map((player) => ({
    ...player,
    bids: (bidsByPlayer[player.id] || []).sort((a, b) => b.amount - a.amount)
  }))
}

const buildAuctionSyncPayload = async () => {
  const [players, teams] = await Promise.all([
    getPlayersWithBids(),
    Team.find().sort({ createdAt: 1 }).lean()
  ])
  return {
    state: snapshotAuctionRoundState(),
    players,
    teams,
    emittedAt: Date.now()
  }
}

const emitAuctionSync = async () => {
  const payload = await buildAuctionSyncPayload()
  io.emit('auction:sync', payload)
}

const tryEmitAuctionSync = async () => {
  try {
    await emitAuctionSync()
  } catch (error) {
    console.error('auction sync emit failed:', error.message)
  }
}

io.on('connection', (socket) => {
  buildAuctionSyncPayload()
    .then((payload) => socket.emit('auction:sync', payload))
    .catch((error) => console.error('initial socket sync failed:', error.message))
})

const resolvePlayerById = async (playerId) => {
  const player = await Player.findOne({ id: playerId })
  if (!player) {
    return { status: 404, body: { error: 'player not found' } }
  }

  if (player.sold) {
    const winningTeam = player.team ? await findTeamByNormalizedName(player.team) : null
    return {
      status: 200,
      body: {
        ok: true,
        winner: winningTeam ? { teamId: winningTeam.id, amount: player.highestBid } : null
      }
    }
  }

  const bids = await Bid.find({ playerId }).sort({ amount: -1 }).lean()
  let winner = null

  for (const bid of bids) {
    const team = await Team.findOne({ id: bid.teamId })
    if (!team) continue
    const remaining = team.purse - (team.spent || 0)
    if (remaining >= bid.amount) {
      winner = { team, amount: bid.amount }
      break
    }
  }

  if (winner) {
    winner.team.spent = (winner.team.spent || 0) + winner.amount
    await winner.team.save()

    player.sold = true
    player.team = winner.team.name
    player.highestBid = winner.amount
    await player.save()

    await Bid.deleteMany({ playerId })
    return {
      status: 200,
      body: { ok: true, winner: { teamId: winner.team.id, amount: winner.amount } }
    }
  }

  await Bid.deleteMany({ playerId })
  return { status: 200, body: { ok: false, winner: null } }
}

const buildToken = (user) => Buffer.from(`${user.role}:${user.id}:${Date.now()}`).toString('base64')

const safeUser = (user) => {
  const { password, ...rest } = user
  return rest
}

const findUserByEmail = (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  return User.findOne({ email: normalizedEmail }).lean()
}

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'auction-bidding-backend' }))

app.post('/api/auth/register/team', async (req, res) => {
  const { managerName, teamName, email, password } = req.body || {}
  if (!managerName || !teamName || !email || !password) {
    return res.status(400).json({ error: 'managerName, teamName, email and password are required' })
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase()
    const existingUser = await findUserByEmail(normalizedEmail)
    if (existingUser) {
      return res.status(409).json({ error: 'email already registered' })
    }

    const cleanedTeamName = String(teamName).trim()
    const cleanedTeamNameKey = normalizeName(cleanedTeamName)
    const allTeams = await Team.find().lean()
    const existingTeam = allTeams.find((team) => normalizeName(team.name) === cleanedTeamNameKey)

    if (!existingTeam) {
      await Team.create({
        id: generateId('t'),
        name: cleanedTeamName,
        purse: 20000000,
        spent: 0
      })
    }

    const createdUser = await User.create({
      uid: generateId('team_user'),
      role: 'team',
      managerName: String(managerName).trim(),
      teamName: cleanedTeamName,
      email: normalizedEmail,
      password: String(password)
    })

    const userPayload = {
      id: createdUser.uid,
      role: createdUser.role,
      managerName: createdUser.managerName,
      teamName: createdUser.teamName,
      email: createdUser.email
    }

    return res.status(201).json({ ok: true, user: userPayload, token: buildToken(userPayload) })
  } catch (error) {
    return res.status(500).json({ error: 'team registration failed' })
  }
})

app.post('/api/auth/register/player', async (req, res) => {
  const { playerName, role, email, password } = req.body || {}
  if (!playerName || !role || !email || !password) {
    return res.status(400).json({ error: 'playerName, role, email and password are required' })
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase()
    const existingUser = await findUserByEmail(normalizedEmail)
    if (existingUser) {
      return res.status(409).json({ error: 'email already registered' })
    }

    const createdUser = await User.create({
      uid: generateId('player_user'),
      role: 'player',
      playerName: String(playerName).trim(),
      playerRole: String(role).trim(),
      email: normalizedEmail,
      password: String(password)
    })

    await Player.create({
      id: generateId('p'),
      name: createdUser.playerName,
      category: createdUser.playerRole,
      basePrice: 500000,
      highestBid: 500000,
      team: null,
      sold: false
    })

    const userPayload = {
      id: createdUser.uid,
      role: createdUser.role,
      playerName: createdUser.playerName,
      playerRole: createdUser.playerRole,
      email: createdUser.email
    }

    return res.status(201).json({ ok: true, user: userPayload, token: buildToken(userPayload) })
  } catch (error) {
    return res.status(500).json({ error: 'player registration failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' })
  }

  try {
    const user = await findUserByEmail(email)
    if (!user || user.password !== String(password)) {
      return res.status(401).json({ error: 'invalid credentials' })
    }

    const userPayload = safeUser({
      id: user.uid,
      role: user.role,
      managerName: user.managerName,
      teamName: user.teamName,
      playerName: user.playerName,
      playerRole: user.playerRole,
      email: user.email,
      password: user.password
    })

    return res.json({ ok: true, user: userPayload, token: buildToken(userPayload) })
  } catch (error) {
    return res.status(500).json({ error: 'login failed' })
  }
})

app.get('/api/team/settings/:userId', async (req, res) => {
  const { userId } = req.params

  try {
    const user = await User.findOne({ uid: userId, role: 'team' })
    if (!user) {
      return res.status(404).json({ error: 'team user not found' })
    }

    const team = await findTeamByNormalizedName(user.teamName)
    if (!team) {
      return res.status(404).json({ error: 'team not found' })
    }

    return res.json({
      ok: true,
      settings: {
        managerName: user.managerName || '',
        teamName: team.name,
        purse: team.purse,
        spent: team.spent || 0,
        email: user.email
      }
    })
  } catch (error) {
    return res.status(500).json({ error: 'failed to load team settings' })
  }
})

app.put('/api/team/settings/:userId', async (req, res) => {
  const { userId } = req.params
  const { managerName, teamName, purse } = req.body || {}

  try {
    const user = await User.findOne({ uid: userId, role: 'team' })
    if (!user) {
      return res.status(404).json({ error: 'team user not found' })
    }

    const team = await findTeamByNormalizedName(user.teamName)
    if (!team) {
      return res.status(404).json({ error: 'team not found' })
    }

    const nextManagerName = String(managerName || '').trim()
    const nextTeamName = String(teamName || '').trim()
    const nextPurse = Number(purse)

    if (!nextManagerName || !nextTeamName || !Number.isFinite(nextPurse) || nextPurse < 0) {
      return res.status(400).json({ error: 'managerName, teamName and valid purse are required' })
    }

    if (nextPurse < (team.spent || 0)) {
      return res.status(400).json({ error: `purse cannot be less than spent (${team.spent || 0})` })
    }

    const existingWithSameName = await findTeamByNormalizedName(nextTeamName)
    if (existingWithSameName && existingWithSameName.id !== team.id) {
      return res.status(409).json({ error: 'team name already exists' })
    }

    const previousTeamName = team.name
    team.name = nextTeamName
    team.purse = nextPurse
    await team.save()

    user.managerName = nextManagerName
    user.teamName = nextTeamName
    await user.save()

    await User.updateMany(
      { role: 'team', teamName: previousTeamName },
      { $set: { teamName: nextTeamName } }
    )

    if (previousTeamName !== nextTeamName) {
      await Player.updateMany(
        { team: previousTeamName },
        { $set: { team: nextTeamName } }
      )
    }

    return res.json({
      ok: true,
      user: {
        id: user.uid,
        role: user.role,
        managerName: user.managerName,
        teamName: user.teamName,
        email: user.email
      },
      settings: {
        managerName: user.managerName,
        teamName: team.name,
        purse: team.purse,
        spent: team.spent || 0,
        email: user.email
      }
    })
  } catch (error) {
    return res.status(500).json({ error: 'failed to update team settings' })
  }
})

app.get('/api/players', async (req, res) => {
  try {
    const playersWithBids = await getPlayersWithBids()
    return res.json({ players: playersWithBids })
  } catch (error) {
    return res.status(500).json({ error: 'failed to fetch players' })
  }
})

app.get('/api/teams', async (req, res) => {
  try {
    const teams = await Team.find().sort({ createdAt: 1 }).lean()
    return res.json({ teams })
  } catch (error) {
    return res.status(500).json({ error: 'failed to fetch teams' })
  }
})

app.get('/api/auction/state', async (req, res) => {
  try {
    if (!auctionRoundState.currentPlayerId) {
      const firstUnsold = await getFirstUnsoldPlayer()
      if (firstUnsold) {
        auctionRoundState.currentPlayerId = firstUnsold.id
        touchAuctionRoundState()
      }
    }
    return res.json({ ok: true, state: snapshotAuctionRoundState() })
  } catch (error) {
    return res.status(500).json({ error: 'failed to fetch auction state' })
  }
})

app.post('/api/auction/start', async (req, res) => {
  try {
    const requestedPlayerId = req.body?.playerId
    let player = null

    if (requestedPlayerId) {
      player = await Player.findOne({ id: requestedPlayerId }).lean()
    }

    if (!player) {
      player = await getFirstUnsoldPlayer()
    }

    if (!player) {
      return res.status(404).json({ error: 'no available player to start' })
    }

    if (player.sold) {
      return res.status(400).json({ error: 'cannot start a sold player' })
    }

    auctionRoundState.currentPlayerId = player.id
    auctionRoundState.isRunning = true
    auctionRoundState.startedAt = Date.now()
    auctionRoundState.pausedRemaining = auctionRoundState.roundSeconds
    touchAuctionRoundState()
    await tryEmitAuctionSync()

    return res.json({ ok: true, state: snapshotAuctionRoundState() })
  } catch (error) {
    return res.status(500).json({ error: 'failed to start auction round' })
  }
})

app.post('/api/auction/pause', (req, res) => {
  try {
    pauseAuctionRound()
    tryEmitAuctionSync()
    return res.json({ ok: true, state: snapshotAuctionRoundState() })
  } catch (error) {
    return res.status(500).json({ error: 'failed to pause auction round' })
  }
})

app.post('/api/auction/next', async (req, res) => {
  try {
    const nextPlayer = await getNextUnsoldPlayerAfter(auctionRoundState.currentPlayerId)
    auctionRoundState.currentPlayerId = nextPlayer?.id || null
    auctionRoundState.isRunning = false
    auctionRoundState.startedAt = null
    auctionRoundState.pausedRemaining = auctionRoundState.roundSeconds
    touchAuctionRoundState()
    await tryEmitAuctionSync()
    return res.json({ ok: true, state: snapshotAuctionRoundState() })
  } catch (error) {
    return res.status(500).json({ error: 'failed to move to next player' })
  }
})

app.post('/api/bid', async (req, res) => {
  const { playerId, teamId, amount } = req.body || {}
  if (!playerId || !teamId || typeof amount !== 'number') {
    return res.status(400).json({ error: 'invalid payload' })
  }

  try {
    const player = await Player.findOne({ id: playerId })
    const team = await Team.findOne({ id: teamId })

    if (!player || !team) {
      return res.status(404).json({ error: 'player or team not found' })
    }

    if (player.sold) {
      return res.status(400).json({ error: 'player is already sold' })
    }

    const currentMax = Math.max(player.basePrice || 0, player.highestBid || 0)
    if (amount <= currentMax) {
      return res.status(400).json({ error: `bid must be greater than current (${currentMax})` })
    }

    const remaining = team.purse - (team.spent || 0)
    if (amount > remaining) {
      return res.status(400).json({ error: `team does not have enough purse. remaining: ${remaining}` })
    }

    const existingBid = await Bid.findOne({ playerId, teamId })
    const effectiveAmount = Math.max(existingBid?.amount || 0, amount)

    await Bid.updateOne(
      { playerId, teamId },
      { $set: { amount: effectiveAmount } },
      { upsert: true }
    )

    player.highestBid = Math.max(currentMax, effectiveAmount)
    await player.save()
    await tryEmitAuctionSync()

    return res.json({ ok: true, bid: { playerId, teamId, amount: effectiveAmount } })
  } catch (error) {
    return res.status(500).json({ error: 'bid failed' })
  }
})

app.post('/api/resolve/:playerId', async (req, res) => {
  const { playerId } = req.params
  try {
    const result = await resolvePlayerById(playerId)
    if (result.status === 404) {
      return res.status(404).json(result.body)
    }

    if (auctionRoundState.currentPlayerId === playerId) {
      const nextPlayer = await getNextUnsoldPlayerAfter(playerId)
      auctionRoundState.currentPlayerId = nextPlayer?.id || null
      auctionRoundState.isRunning = false
      auctionRoundState.startedAt = null
      auctionRoundState.pausedRemaining = auctionRoundState.roundSeconds
      touchAuctionRoundState()
    }

    await tryEmitAuctionSync()

    return res.json(result.body)
  } catch (error) {
    return res.status(500).json({ error: 'resolve failed' })
  }
})

const port = process.env.PORT || 4000

async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required')
  }

  await mongoose.connect(process.env.MONGODB_URI)
  console.log('MongoDB connected')

  await seedDatabaseIfEmpty()

  if (!auctionRoundState.currentPlayerId) {
    const firstUnsold = await getFirstUnsoldPlayer()
    if (firstUnsold) {
      auctionRoundState.currentPlayerId = firstUnsold.id
      touchAuctionRoundState()
    }
  }

  httpServer.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`)
  })
}

startServer().catch((error) => {
  console.error('Failed to start backend:', error.message)
  process.exit(1)
})
