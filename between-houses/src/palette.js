// Shared colour palette. Kept deliberately small so everything reads as one
// cosy 8-bit world (olive, wood, cream and burgundy — the apartment's own colours).
export const C = {
  void: '#17121c',
  k: '#2b2024', // outline

  white: '#f7f1e3',
  cream: '#efe2c8',
  beige: '#dcc6a2',
  tan: '#bf9f78',
  taupe: '#9c8468',

  woodL: '#d9b27c',
  wood: '#b98852',
  woodD: '#8f6039',
  walnut: '#684430',
  walnutD: '#4a2f22',

  olive: '#5d6e3c',
  oliveD: '#435231',
  oliveL: '#80924f',
  sage: '#a9b37a',

  emerald: '#2f6e52',
  emeraldD: '#1f4d3c',
  emeraldL: '#4d9272',

  burgundy: '#7c2f2c',
  red: '#b64a3b',
  orange: '#dd7a3c',
  terracotta: '#c98f6f',
  pink: '#dba892',
  pinkL: '#ecc9b5',

  gray: '#928c86',
  grayL: '#cbc5bb',
  grayD: '#5b5557',
  steel: '#737882',
  steelL: '#a5abb3',
  charcoal: '#37323c',

  sky: '#a9d6e8',
  skyL: '#d9eef3',
  glass: '#bfe0e6',

  yellow: '#f2d37a',
  gold: '#d9a94a',
  copper: '#c98452',
  navy: '#34405e',
  blue: '#5b7fa6',

  leaf: '#3f7a3f',
  leafD: '#2a5a30',
  leafL: '#62a04e',
};

// tiny drawing helpers shared by every art module
export function R(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
}
export function P(g, x, y, c) {
  g.fillStyle = c;
  g.fillRect(x, y, 1, 1);
}
export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return [c, g];
}
