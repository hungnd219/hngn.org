// What the two cats are called.
//
// In the story nobody has named them until the vet's, at the end of Act 1:
// before that the game calls them The Tabby and The Orange, everywhere a name
// is shown. Sandbox and Battle mode always use their names.
import { CONFIG } from './config.js';

const ALIAS = { shark: 'The Tabby', orca: 'The Orange' };
let named = true;

export function setNamed(on) {
  named = !!on;
}
export const isNamed = () => named;
// the name of one of the pair ('shark' or 'orca') as it stands
export function catName(id) {
  if (!named && ALIAS[id]) return ALIAS[id];
  const c = CONFIG.cats.find((o) => o.id === id);
  return c ? c.name : id;
}
// The Tabby and The Orange are what the two go by, so they keep their capitals wherever they
// fall in a sentence ("...in front of The Tabby all the same").
export const isAlias = (name) => Object.values(ALIAS).includes(name);
// put a name where `token` stands in a text
export const putName = (text, token, name) => (text.includes(token) ? text.replaceAll(token, name) : text);
// {S} and {O} in the story's words: the tabby and the orange one, by whatever they are called now.
// Works through lists and tables of texts too (a fight's words, say).
export function fillNames(v) {
  if (typeof v === 'string') return putName(putName(v, '{S}', catName('shark')), '{O}', catName('orca'));
  if (Array.isArray(v)) return v.map(fillNames);
  if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
    const out = {};
    for (const k of Object.keys(v)) out[k] = fillNames(v[k]);
    return out;
  }
  return v;
}
