import {handDrawing} from './hand-svg.js';
const drawing={
 effort:handDrawing(true),
 load:'<path d="M40 7V24M36 32V38M44 32V38"/><circle cx="40" cy="28" r="5"/><ellipse cx="40" cy="41" rx="19" ry="5"/><path d="M21 41V62Q21 68 40 68Q59 68 59 62V41M19 43H61M19 62H61"/><path d="M25 48V59M55 48V59" opacity=".5"/>',
 fulcrum:'<rect x="15" y="66" width="50" height="7" rx="2"/><path d="M27 66V19Q27 10 35 10H45Q53 10 53 19V66M32 65V24M48 65V24M21 23H59"/><circle cx="40" cy="22" r="8"/><circle cx="40" cy="22" r="3"/><path d="M22 69H25M55 69H58"/>',
};
export const partIcon=role=>`<svg class="part-icon" data-icon="${role}" viewBox="0 0 80 80" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">${drawing[role]}</svg>`;
