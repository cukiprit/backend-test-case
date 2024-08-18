let input = "NEGIE1";
let letters = [];
let numbers = [];

for (let i = 0; i < input.length; i++) {
  if (isNaN(input[i])) {
    letters.push(input[i]);
  } else {
    numbers.push(input[i]);
  }
}

letters.reverse();

let result = letters.join("") + numbers.join("");
console.log(result);
