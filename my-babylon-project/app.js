import {
  words,
  thaiWords,
} from "./words.js";

let language = "English";
let randowWord;
function getRandomWord() {
  if (language == "Thai") {
    randowWord = "";
    while (!randowWord || randowWord == "") {
      randowWord = thaiWords[Math.floor(Math.random() * thaiWords.length)];
      if (randowWord) {
        return randowWord;
      }
    }
  }
  if (language == "English") {
    randowWord = "";
    while (!randowWord || randowWord == "") {
      randowWord = words[Math.floor(Math.random() * words.length)];
      if (randowWord) {
        return randowWord;
      }
    }
  }
}



export { getRandomWord };
