import React, { useState } from 'react'

export default function BidModal({ open, onClose, onSubmit, player, teams }) {
  const [amount, setAmount] = useState('')
  const [teamId, setTeamId] = useState(teams && teams.length ? teams[0].id : '')

  React.useEffect(() => {
    if (open) {
      setAmount('')
      setTeamId(teams && teams.length ? teams[0].id : '')
    }
  }, [open, teams])

  if (!open) return null

  const currentMax = Math.max(player.basePrice || 0, player.highestBid || 0)

  function submit() {
    const n = Number(amount)
    if (!n || n <= currentMax) {
      alert(`Bid must be greater than current (${currentMax.toLocaleString()})`)
      return
    }
    const team = teams.find(t => t.id === teamId)
    const remaining = team ? team.purse - (team.spent || 0) : 0
    if (n > remaining) {
      alert(`Selected team does not have enough purse. Remaining: ${remaining.toLocaleString()}`)
      return
    }
    onSubmit(player.id, teamId, n)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40 modal-backdrop" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h3 className="text-xl font-semibold mb-2">Place bid for {player.name}</h3>
        <p className="text-sm text-gray-600 mb-2">Current: {(player.highestBid || player.basePrice).toLocaleString()}</p>

        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-1">Team</label>
          <select className="w-full border rounded px-3 py-2" value={teamId} onChange={e => setTeamId(e.target.value)}>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name} (Remaining: {(t.purse - (t.spent||0)).toLocaleString()})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="number"
            className="border rounded px-3 py-2 flex-1"
            placeholder={`${currentMax + 100000}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={submit}>Submit Bid</button>
        </div>
      </div>
    </div>
  )
}
