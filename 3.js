const QUERY = ["bbb", "ac", "dz"];
const INPUT = ["xc", "dz", "bbb", "dz"];

const output = (args1, args2) => {
  let tempArr = [];
  let score = 0;

  for (let i = 0; i < args2.length; i++) {
    for (let j = 0; j < args1.length; j++) {
      if (args2[i] === args1[j]) {
        score += 1;
        console.log(args2[i] + "===" + args1[j] + "=" + score);
        tempArr.push(score);
      }
    }
    score = 0;
  }
  return tempArr;
};

console.log(output(INPUT, QUERY));
