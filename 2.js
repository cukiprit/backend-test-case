const sentence = "Saya sangat senang mengerjakan soal algoritma";

const longest = (sentence) => {
  let tempArr = sentence.split(" ");
  let length = 0;
  let longest;

  for (let i = 0; i < tempArr.length; i++) {
    if (tempArr[i].length > length) {
      length = tempArr[i].length;
      longest = tempArr[i];
    }
  }

  return longest;
};

console.log(longest(sentence));
