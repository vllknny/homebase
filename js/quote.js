/**
 * Quote: a small "quote of the day" card. Picks deterministically by
 * day of year (so it's stable across reloads / new tabs on the same
 * day), with a button to shuffle to another one for the session.
 */
const Quote = (() => {
  const QUOTES = [
    { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
    { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
    { text: 'Well begun is half done.', author: 'Aristotle' },
    { text: 'What we think, we become.', author: 'Buddha' },
    { text: 'The best way out is always through.', author: 'Robert Frost' },
    { text: 'Do the best you can until you know better. Then do better.', author: 'Maya Angelou' },
    { text: 'Small daily improvements are the key to staggering long-term results.', author: 'James Clear' },
    { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
    { text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
    { text: 'Have no fear of perfection — you will never reach it.', author: 'Salvador Dalí' },
    { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
    { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
    { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
    { text: 'Order and simplification are the first steps toward mastery.', author: 'Thomas Mann' },
    { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
    { text: 'A year from now you may wish you had started today.', author: 'Karen Lamb' },
    { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
    { text: 'Slow is smooth, and smooth is fast.', author: 'Navy SEAL adage' },
    { text: 'Clarity comes from engagement, not thought.', author: 'Marie Forleo' },
    { text: 'Done is better than perfect.', author: 'Sheryl Sandberg' },
    { text: 'Almost everything will work again if you unplug it for a few minutes, including you.', author: 'Anne Lamott' },
    { text: 'You are what you do, not what you say you will do.', author: 'Carl Jung' },
    { text: 'The days are long, but the years are short.', author: 'Gretchen Rubin' },
    { text: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
  ];

  let textEl, authorEl, refreshBtn, lastIndex = -1;

  function dayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    return Math.floor(diff / 86400000);
  }

  function show(index) {
    lastIndex = index;
    const q = QUOTES[index];
    textEl.textContent = q.text;
    authorEl.textContent = `— ${q.author}`;
  }

  function showRandom() {
    if (QUOTES.length <= 1) return;
    let next = lastIndex;
    while (next === lastIndex) next = Math.floor(Math.random() * QUOTES.length);
    show(next);
  }

  async function init() {
    textEl = document.getElementById('quoteText');
    authorEl = document.getElementById('quoteAuthor');
    refreshBtn = document.getElementById('quoteRefresh');

    show(dayOfYear() % QUOTES.length);
    refreshBtn.addEventListener('click', showRandom);
  }

  return { init };
})();
