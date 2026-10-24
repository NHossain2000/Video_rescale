// funkyNames.ts — Family-friendly, playful alias generator
// Format: Adjective + Noun + optional single/two-digit number
// Pure, deterministic under seed, default driven by crypto.getRandomValues

export const ADJECTIVES: readonly string[] = [
  'Bouncy', 'Breezy', 'Bubbling', 'Cheery', 'Crispy',
  'Crunchy', 'Dapper', 'Dizzy', 'Feisty', 'Fizzy',
  'Fluffy', 'Frisky', 'Funky', 'Giddy', 'Glitchy',
  'Glossy', 'Goofy', 'Groovy', 'Hearty', 'Jazzy',
  'Jolly', 'Juicy', 'Jumpy', 'Lucky', 'Mighty',
  'Nifty', 'Peppy', 'Perky', 'Piping', 'Pixel',
  'Plucky', 'Prancing', 'Puffy', 'Quick', 'Quirky',
  'Radish', 'Rowdy', 'Rusty', 'Sassy', 'Silky',
  'Skippy', 'Snappy', 'Snoozy', 'Sparky', 'Speedy',
  'Spicy', 'Spiffy', 'Springy', 'Spunky', 'Squeaky',
  'Sticky', 'Sunny', 'Sweaty', 'Swifty', 'Tasty',
  'Tippy', 'Toasty', 'Turbo', 'Velvet', 'Wobbly',
  'Zappy', 'Zesty', 'Zippy'
];

export const NOUNS: readonly string[] = [
  'Avocado', 'Badger', 'Bagel', 'Bamboo', 'Biscuit',
  'Bobcat', 'Bongo', 'Burrito', 'Cactus', 'Carrot',
  'Cheerio', 'Clover', 'Coconut', 'Cookie', 'Cupcake',
  'Dumpling', 'Falcon', 'Fiddle', 'Fig', 'Finch',
  'Giggle', 'Hamster', 'Hobnob', 'Kazoo', 'Kiwi',
  'Koala', 'Kumquat', 'Lollipop', 'Mango', 'Marshmallow',
  'Mitten', 'Mochi', 'Muffin', 'Noodle', 'Nugget',
  'Otter', 'Pancake', 'Papaya', 'Peanut', 'Penguin',
  'Pickle', 'Pistachio', 'Pompom', 'Pretzel', 'Pudding',
  'Radish', 'Raccoon', 'Raspberry', 'Ravioli', 'Scooter',
  'Skateboard', 'Sparrow', 'Sprout', 'Sundae', 'Taco',
  'Toaster', 'Turnip', 'Waffle', 'Walrus', 'Whistle',
  'Wombat', 'Yogurt', 'Zucchini'
];

/**
 * Returns a cryptographically sound random integer in [0, max).
 */
function secureRandomInt(max: number): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
}

/**
 * Generates a playful alias such as "Turbo Pickle 7" or "Sweaty Waffle".
 * 40% chance of appending a lucky number (1-99).
 */
export function generateFunkyName(): string {
  const adjIndex = secureRandomInt(ADJECTIVES.length);
  const nounIndex = secureRandomInt(NOUNS.length);
  const includeNumber = secureRandomInt(10) < 4; // 40% chance

  const adj = ADJECTIVES[adjIndex];
  const noun = NOUNS[nounIndex];

  if (includeNumber) {
    const num = secureRandomInt(99) + 1;
    return `${adj} ${noun} ${num}`;
  }
  return `${adj} ${noun}`;
}

/**
 * Validates that an alias conforms to our generated vocabulary pattern.
 */
export function isValidFunkyName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2 || parts.length > 3) return false;

  const [adj, noun, maybeNum] = parts;
  if (!ADJECTIVES.includes(adj)) return false;
  if (!NOUNS.includes(noun)) return false;

  if (maybeNum !== undefined) {
    const n = Number(maybeNum);
    if (!Number.isInteger(n) || n < 1 || n > 99) return false;
  }
  return true;
}
