const matrix = [
  [1, 2, 0],
  [4, 5, 6],
  [7, 8, 9],
];

const diagonalDifference = (matrix) => {
  const N = matrix.length;
  let primaryDiagonalSum = 0;
  let secondaryDiagonalSum = 0;

  for (let i = 0; i < N; i++) {
    primaryDiagonalSum += matrix[i][i];
    secondaryDiagonalSum += matrix[i][N - 1 - i];
  }

  return Math.abs(primaryDiagonalSum - secondaryDiagonalSum);
};

console.log(diagonalDifference(matrix));
