// Shared standalone palm, opposed thumb and unequal curled fingers for icons,
// the diagram, and sketches. The wrist ends in a softly rounded skin surface.
export function handDrawing(lineOnly=false){
 const stroke=lineOnly?'currentColor':'#422b22',fill=lineOnly?'none':'#68412e';
 return `<g stroke="${stroke}" stroke-width="${lineOnly?2.7:1.5}" stroke-linecap="round" stroke-linejoin="round"><path d="M31 22L32 14Q30 6 39 7L49 9Q56 10 54 18L54 25Q63 34 66 55Q68 62 62 63Q57 64 55 57L53 49L54 62Q54 69 49 69Q44 69 43 63L41 51L41 64Q41 71 35 71Q30 70 30 64L29 51L27 60Q25 67 20 64Q15 62 17 55L21 42L16 48Q11 52 8 47Q5 44 9 39L21 27Q26 23 31 22Z" fill="${fill}"/><path d="M26 32Q34 25 44 30M25 41L29 37M33 42L40 40M45 40L51 41M54 38L59 42" fill="none" opacity=".65"/>${lineOnly?'':`<g fill="#ae8070" stroke-width=".7"><rect x="18" y="54" width="7" height="8" rx="2" transform="rotate(12 22 58)"/><rect x="32" y="60" width="7" height="8" rx="2"/><rect x="46" y="58" width="6" height="8" rx="2" transform="rotate(-6 49 62)"/><rect x="58" y="53" width="6" height="7" rx="2" transform="rotate(-18 61 56)"/><path d="M9 40Q13 38 16 42L12 47Q8 47 8 44Z"/></g>`}</g>`;
}
export const handSVG=(x,y,scale=1)=>`<g data-hand-model="standalone-child-v2" transform="translate(${x-40*scale} ${y-71*scale}) scale(${scale})">${handDrawing()}</g>`;
