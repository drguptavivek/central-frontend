import { faker } from '@faker-js/faker';

export const generatePassword = () => {
    const getWord = () => {
        const word = faker.word.noun({ length: { min: 4, max: 6 } });
        return word.charAt(0).toUpperCase() + word.slice(1);
    };

    const word1 = getWord();
    const word2 = getWord();
    const word3 = getWord();
    const num = faker.string.numeric(3);

    return `${word1}-${word2}-${num}-${word3}`;
};
