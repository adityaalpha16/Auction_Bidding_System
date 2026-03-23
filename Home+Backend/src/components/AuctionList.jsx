import React from 'react'
import AuctionItem from './AuctionItem'

export default function AuctionList({ items, onBid, currentPlayerId, categoryFilter, teams }) {
  if (!items || items.length === 0) return <p className="text-gray-600">No players available.</p>

  const byCategory = items.reduce((acc, it) => {
    if (categoryFilter && it.category !== categoryFilter) return acc
    acc[it.category] = acc[it.category] || []
    acc[it.category].push(it)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.keys(byCategory).map((cat) => (
        <section key={cat}>
          <h3 className="text-lg font-semibold mb-2">{cat} ({byCategory[cat].length})</h3>
          <div className="grid grid-cols-1 gap-4">
            {byCategory[cat].map((p) => (
              <AuctionItem key={p.id} item={p} onBid={onBid} isActive={currentPlayerId === p.id} teams={teams} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
