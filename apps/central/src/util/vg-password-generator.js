const alphabet = 'abcdefghijklmnopqrstuvwxyz';

const randomInt = (max) => {
  const values = new Uint32Array(1);
  window.crypto.getRandomValues(values);
  return values[0] % max;
};

const generatePassword = () => {
  const getWord = () => {
    const length = randomInt(3) + 4;
    let word = '';
    for (let i = 0; i < length; i += 1) word += alphabet[randomInt(alphabet.length)];
    return word.charAt(0).toUpperCase() + word.slice(1);
  };

  const word1 = getWord();
  const word2 = getWord();
  const word3 = getWord();
  const num = String(randomInt(1000)).padStart(3, '0');

  return `${word1}-${word2}-${num}-${word3}`;
};

export default generatePassword;
