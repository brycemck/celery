const run = async function() {
  const quotes = [
    "Yes",
    "No",
    "Maybe",
    "Um",
    "Hell no",
    "Ask again l8r ;)"
  ];
  return quotes[Math.floor(Math.random() * (quotes.length))];
}

export default {
  name: '8ball',
  description: 'Receive a random 8ball response.',
  usage: '',
  run: run.toString()
}