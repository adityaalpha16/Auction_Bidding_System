import React, { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import AuctionList from './components/AuctionList'
import BidModal from './components/BidModal'

const ROUND_SECONDS = 25
const API_PORT = Number(import.meta.env.VITE_API_PORT || 4010)

const API = (path) => {
  const host = window.location.hostname || 'localhost'
  return `http://${host}:${API_PORT}${path}`
}

const API_FALLBACK = (path) => {
  const host = window.location.hostname || 'localhost'
  return `http://${host}:4000${path}`
}

export default function App() {
  const [auctions, setAuctions] = useState([])
  const [teams, setTeams] = useState([])
  const [bids, setBids] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [isRunning, setIsRunning] = useState(false)
  const [modalPlayer, setModalPlayer] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [lastSale, setLastSale] = useState(null)
  const [auctionState, setAuctionState] = useState(null)
  const resolvingRef = useRef(null)
  const auctionsRef = useRef([])
  const syncInFlightRef = useRef(false)
  const socketRef = useRef(null)
  const [activeApiPort, setActiveApiPort] = useState(API_PORT)

  const currentPlayerId = auctionState?.currentPlayerId
  const currentPlayer = (currentPlayerId && auctions.find((player) => player.id === currentPlayerId)) || auctions[currentIndex]

  useEffect(() => {
    auctionsRef.current = auctions
  }, [auctions])

  function applyAuctionSnapshot(payload) {
    const nextPlayers = payload?.players || []
    const nextTeams = payload?.teams || []
    const nextState = payload?.state || null

    if (nextPlayers.length) {
      setAuctions(nextPlayers)
      auctionsRef.current = nextPlayers
    }
    if (nextTeams.length) {
      setTeams(nextTeams)
    }
    if (nextState) {
      setAuctionState(nextState)
      setIsRunning(!!nextState.isRunning)
      setTimeLeft(Number.isFinite(nextState.remainingSeconds) ? nextState.remainingSeconds : ROUND_SECONDS)
      if (nextState.currentPlayerId) {
        const playerIndex = (nextPlayers.length ? nextPlayers : auctionsRef.current).findIndex((player) => player.id === nextState.currentPlayerId)
        if (playerIndex >= 0) {
          setCurrentIndex(playerIndex)
        }
      }
    }
  }

  async function syncFromServer() {
    if (syncInFlightRef.current) return
    syncInFlightRef.current = true
    try {
      await Promise.all([fetchInitial(), fetchAuctionState()])
    } finally {
      syncInFlightRef.current = false
    }
  }

  async function apiFetch(path, options) {
    try {
      const primaryResponse = await fetch(`http://${window.location.hostname || 'localhost'}:${activeApiPort}${path}`, options)
      if (primaryResponse.ok || activeApiPort === 4000) {
        return primaryResponse
      }

      const fallbackResponse = await fetch(API_FALLBACK(path), options)
      if (fallbackResponse.ok) {
        setActiveApiPort(4000)
        return fallbackResponse
      }
      return primaryResponse
    } catch (error) {
      if (activeApiPort !== 4000) {
        const fallbackResponse = await fetch(API_FALLBACK(path), options)
        setActiveApiPort(4000)
        return fallbackResponse
      }
      throw error
    }
  }

  useEffect(() => {
    let mounted = true

    async function init() {
      await syncFromServer()
    }

    init()

    const syncTimer = setInterval(() => {
      if (!mounted) return
      syncFromServer()
    }, 8000)

    return () => {
      mounted = false
      clearInterval(syncTimer)
    }
  }, [])

  useEffect(() => {
    const host = window.location.hostname || 'localhost'
    const socket = io(`http://${host}:${activeApiPort}`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500
    })

    socket.on('auction:sync', (payload) => {
      applyAuctionSnapshot(payload)
    })

    socket.on('connect_error', async () => {
      if (activeApiPort !== 4000) {
        setActiveApiPort(4000)
      }
    })

    socketRef.current = socket

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [activeApiPort])

  useEffect(() => {
    if (!isRunning || !currentPlayer || timeLeft > 0) return
    if (resolvingRef.current === currentPlayer.id) return

    resolvingRef.current = currentPlayer.id
    handleResolve().finally(() => {
      resolvingRef.current = null
    })
  }, [isRunning, timeLeft, currentPlayer?.id])

  async function fetchInitial() {
    try {
      const [pRes, tRes] = await Promise.all([apiFetch('/api/players'), apiFetch('/api/teams')])
      const pjson = await pRes.json()
      const tjson = await tRes.json()
      const players = pjson.players || []
      setAuctions(players)
      setTeams(tjson.teams || [])

      if (!auctionState?.currentPlayerId && players.length > 0) {
        const firstUnsoldIndex = players.findIndex((player) => !player.sold)
        setCurrentIndex(firstUnsoldIndex >= 0 ? firstUnsoldIndex : 0)
      }
    } catch (error) {
      console.error('Failed to load initial data', error)
    }
  }

  async function fetchAuctionState() {
    try {
      const res = await apiFetch('/api/auction/state')
      const json = await res.json()
      if (!res.ok || !json?.ok) return

      const state = json.state
      setAuctionState(state)
      setIsRunning(!!state?.isRunning)
      setTimeLeft(Number.isFinite(state?.remainingSeconds) ? state.remainingSeconds : ROUND_SECONDS)

      if (state?.currentPlayerId) {
        const index = auctionsRef.current.findIndex((player) => player.id === state.currentPlayerId)
        if (index >= 0) {
          setCurrentIndex(index)
        } else {
          await fetchInitial()
        }
      }
    } catch (error) {
      console.error('Failed to sync auction state', error)
    }
  }

  async function startAuction() {
    if (!currentPlayer || currentPlayer.sold) return
    setLastSale(null)
    try {
      const res = await apiFetch('/api/auction/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayer.id })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'start failed')
      await fetchAuctionState()
    } catch (error) {
      console.error(error)
      alert('Failed to start round: ' + error.message)
    }
  }

  async function pauseAuction() {
    try {
      const res = await apiFetch('/api/auction/pause', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'pause failed')
      await fetchAuctionState()
    } catch (error) {
      console.error(error)
      alert('Failed to pause round: ' + error.message)
    }
  }

  function openBidModalFor(player) {
    if (!isRunning || !currentPlayer || player.id !== currentPlayer.id) {
      alert('Bidding allowed only on active player')
      return
    }
    setModalPlayer(player)
  }

  function closeModal() {
    setModalPlayer(null)
  }

  async function submitBid(playerId, teamId, amount) {
    try {
      const res = await apiFetch('/api/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, teamId, amount })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'bid failed')

      setAuctions((prev) =>
        prev.map((player) => {
          if (player.id !== playerId) return player
          const bidMap = Object.fromEntries((player.bids || []).map((bid) => [bid.teamId, bid.amount]))
          bidMap[teamId] = Math.max(bidMap[teamId] || 0, amount)
          const bidList = Object.entries(bidMap).map(([teamKey, bidAmount]) => ({ teamId: teamKey, amount: bidAmount }))
          return {
            ...player,
            highestBid: Math.max(player.highestBid || player.basePrice, amount),
            bids: bidList
          }
        })
      )
      setBids((prev) => {
        const copy = { ...(prev || {}) }
        copy[playerId] = { ...(copy[playerId] || {}), [teamId]: Math.max((copy[playerId] || {})[teamId] || 0, amount) }
        return copy
      })
    } catch (error) {
      console.error(error)
      alert('Bid failed: ' + error.message)
    } finally {
      closeModal()
      fetchInitial()
    }
  }

  async function handleResolve() {
    if (!currentPlayer) return
    const resolvingPlayer = currentPlayer

    try {
      const res = await apiFetch(`/api/resolve/${resolvingPlayer.id}`, { method: 'POST' })
      const json = await res.json()

      if (json?.ok && json?.winner) {
        const winnerTeam = teams.find((team) => team.id === json.winner.teamId)
        setLastSale({
          playerName: resolvingPlayer.name,
          teamName: winnerTeam?.name || json.winner.teamId,
          amount: json.winner.amount,
          sold: true
        })
      } else {
        setLastSale({
          playerName: resolvingPlayer.name,
          sold: false
        })
      }

      await Promise.all([fetchInitial(), fetchAuctionState()])
      setBids((prev) => {
        const copy = { ...prev }
        delete copy[resolvingPlayer.id]
        return copy
      })
    } catch (error) {
      console.error('resolve failed', error)
    }
  }

  async function skipToNext() {
    try {
      const res = await apiFetch('/api/auction/next', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'failed to move next')
      await Promise.all([fetchInitial(), fetchAuctionState()])
      setLastSale(null)
    } catch (error) {
      console.error(error)
      alert('Failed to move next: ' + error.message)
    }
  }

  const categories = Array.from(new Set(auctions.map((player) => player.category)))
  const currentBidList = [...(currentPlayer?.bids || [])].sort((a, b) => b.amount - a.amount)
  const leadingBid = currentBidList[0] || null

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">IPL Auction Bidding</h1>
          <p className="text-gray-600">Backend-connected auction: timer, teams & purse validation.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => startAuction()}>Start Bid Round</button>
              <button className="px-3 py-2 bg-yellow-400 text-black rounded" onClick={() => pauseAuction()}>Pause</button>
              <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => skipToNext()}>Next</button>
              <div className="ml-auto">
                <label className="text-sm text-gray-600 mr-2">Filter:</label>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="border rounded px-2 py-1">
                  <option value="">All</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow mb-4">
              <h2 className="text-xl font-semibold">Team Auction Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">Start each bid round with a 25-second timer. Teams can place bids during this time, and when the timer ends, the player is sold automatically to the highest valid bid.</p>
            </div>

            <div className="bg-white p-4 rounded shadow mb-4">
              <h2 className="text-xl font-semibold">Active player</h2>
              {currentPlayer ? (
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold">{currentPlayer.name} {currentPlayer.sold ? <span className="text-sm text-green-600">(Sold)</span> : ''}</div>
                    <div className="text-sm text-gray-600">Category: {currentPlayer.category}</div>
                    <div className="text-sm text-gray-700">Current highest: {(currentPlayer.highestBid || currentPlayer.basePrice).toLocaleString()}</div>
                    {leadingBid && (
                      <div className="text-sm text-indigo-600">Leading team: {(teams.find((team) => team.id === leadingBid.teamId)?.name || leadingBid.teamId)} ({leadingBid.amount.toLocaleString()})</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold">{timeLeft}s</div>
                    <div className="mt-2">
                      <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={() => openBidModalFor(currentPlayer)}>Place Bid</button>
                    </div>
                  </div>
                </div>
              ) : <div>No more players.</div>}

              <div className="mt-4 border-t pt-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Live team bids</h3>
                {currentBidList.length > 0 ? (
                  <div className="space-y-1">
                    {currentBidList.map((bid) => (
                      <div key={bid.teamId} className="flex items-center justify-between text-sm">
                        <span>{teams.find((team) => team.id === bid.teamId)?.name || bid.teamId}</span>
                        <span className="font-medium">{bid.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No bids yet for this player.</div>
                )}
              </div>

              {lastSale && (
                <div className={`mt-4 rounded p-3 text-sm ${lastSale.sold ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {lastSale.sold
                    ? `${lastSale.playerName} sold to ${lastSale.teamName} for ${lastSale.amount.toLocaleString()}`
                    : `${lastSale.playerName} received no valid winning bid.`}
                </div>
              )}
            </div>

            <section>
              <h2 className="text-xl font-semibold mb-2">Players</h2>
              <AuctionList items={auctions} onBid={openBidModalFor} currentPlayerId={currentPlayer?.id} categoryFilter={categoryFilter} teams={teams} />
            </section>
          </div>

          <aside>
            <div className="bg-white p-4 rounded shadow mb-4">
              <h3 className="font-semibold mb-2">Teams & Purses</h3>
              <div className="space-y-2">
                {teams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{team.name}</div>
                      <div className="text-sm text-gray-500">Remaining: {(team.purse - (team.spent || 0)).toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-gray-600">Spent: {(team.spent || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">Live summary</h3>
              <div className="text-sm text-gray-600">Players total: {auctions.length}</div>
              <div className="text-sm text-gray-600">Sold: {auctions.filter((player) => player.sold).length}</div>
              <div className="text-sm text-gray-600">Top bid: {Math.max(...(auctions.map((player) => player.highestBid || player.basePrice) || [0])).toLocaleString()}</div>
            </div>
          </aside>
        </div>
      </div>

      <BidModal open={!!modalPlayer} onClose={closeModal} onSubmit={submitBid} player={modalPlayer || { basePrice: 0, highestBid: 0, name: '' }} teams={teams} />
    </div>
  )
}
