import React from 'react'
export default function PoseArt({type, size=150}) {
  const hands = {
    up: <><path d="M76 102 Q55 75 47 35"/><path d="M124 102 Q145 75 153 35"/><circle cx="47" cy="35" r="9"/><circle cx="153" cy="35" r="9"/></>,
    cross: <><path d="M76 102 Q89 118 119 91"/><path d="M124 102 Q110 119 81 91"/><circle cx="119" cy="91" r="9"/><circle cx="81" cy="91" r="9"/></>,
    salute: <><path d="M76 102 Q54 90 67 50"/><path d="M124 102 Q144 127 143 150"/><circle cx="67" cy="50" r="9"/><circle cx="143" cy="150" r="9"/></>
  }
  return <svg width={size} height={size} viewBox="0 0 200 175" role="img" aria-label={type==='up'?'Giơ hai tay':type==='cross'?'Khoanh tay':'Chào cờ'}>
    <ellipse cx="100" cy="165" rx="61" ry="7" fill="#b6d9ee" opacity=".35"/>
    <path d="M69 94 Q51 96 45 165 L155 165 Q149 96 131 94Z" fill="#6f9cf5"/>
    <path d="M72 95 Q67 112 65 165 M128 95 Q133 112 135 165" fill="none" stroke="#4f7ddf" strokeWidth="3"/>
    <g fill="none" stroke="#edb58a" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round">{hands[type]}</g>
    <g fill="#f5c79f" stroke="#e6a97d" strokeWidth="1.5"><circle cx="100" cy="52" r="42"/><circle cx="60" cy="57" r="8"/><circle cx="140" cy="57" r="8"/></g>
    <path d="M58 42 Q52 8 84 9 Q111 -4 129 15 Q151 22 141 48 Q134 37 127 29 Q109 40 78 30 Q73 37 58 42Z" fill="#6a4438"/>
    <circle cx="84" cy="56" r="3.8" fill="#40302e"/><circle cx="115" cy="56" r="3.8" fill="#40302e"/>
    <path d="M91 70 Q100 79 109 70" stroke="#b65d59" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <circle cx="72" cy="67" r="7" fill="#f7a6a7" opacity=".6"/><circle cx="128" cy="67" r="7" fill="#f7a6a7" opacity=".6"/>
  </svg>
}
