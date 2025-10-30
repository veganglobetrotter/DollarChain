import React from "react";

export default function Header({ onBuyCredits }) {
  return (
    <header className="top-header">
      <div className="header-left">
        <div className="brand">DollarChain</div>
      </div>

      <div className="header-right">
        <button className="btn-buy" onClick={onBuyCredits}>
          Buy Credits
        </button>
      </div>
    </header>
  );
}
