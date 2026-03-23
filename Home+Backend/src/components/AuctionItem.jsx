import React from 'react'

export default function AuctionItem({ item, onBid, isActive, teams }) {
  const bidList = item.bids || []
  const lookupTeam = (id) => (teams || []).find(t => t.id === id)?.name || id

  return (
    <div className={`bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${isActive ? 'ring-2 ring-blue-400' : ''}`}>
      <div>
        <h4 className="text-lg font-semibold">{item.name} {item.sold ? <span className="text-sm text-green-600">(Sold)</span> : ''}</h4>
        <p className="text-sm text-gray-500">Category: {item.category}</p>
        <p className="text-sm text-gray-500">Base: {item.basePrice.toLocaleString()}</p>
        <p className="text-sm text-gray-700">Highest: {(item.highestBid || item.basePrice).toLocaleString()}</p>
        {item.team ? <p className="text-sm text-indigo-600">Team: {item.team}</p> : null}

        {bidList.length > 0 && (
          <div className="mt-2">
            <div className="text-sm font-medium">Bids:</div>
            <ul className="text-sm text-gray-700">
              {bidList.map(b => (
                <li key={b.teamId} className={`${b.amount === (item.highestBid || item.basePrice) ? 'font-semibold text-blue-600' : ''}`}>
                  {lookupTeam(b.teamId)}: {b.amount.toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!item.sold && (
          <button
            onClick={() => onBid(item)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Bid
          </button>
        )}
      </div>
    </div>
  )
}
