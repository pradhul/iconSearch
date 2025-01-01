/**
 * @author Pradhul
 * @email pradhudev.1990@gmail.com
 * @create date 2024-12-20 05:36:28
 * @modify date 2024-12-20 05:36:28
 * @desc [description]
 */
import dotenv from "dotenv";
import fs from "fs";
import natural from "natural";

dotenv.config();

const wordVectors: { [key: string]: number[] } = {};

/**
 * function to load the glove model
 * @param filePath
 */
export function loadGloveModel(filePath: string): void {
  const data = fs.readFileSync(filePath, "utf8");
  const lines = data.split("\n");
  lines.forEach((line) => {
    const parts = line.split(" ");
    const word = parts[0];
    const vector = parts.slice(1).map(Number);
    wordVectors[word] = vector;
  });
  console.log("Loaded Glove Model from: " + filePath);
}

/**
 * Calculate the Cosine similarity between two vectors
 */
function _cosineSimilarity(vector1: number[], vector2: number[]): number {
  const dotProduct = vector1.reduce((sum, val, index) => sum + val * vector2[index], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Compare input word with categories
 */
export function matchCategory(inputWord: string, categories: string[]): string {
  let maxSimilarity = 0; // Ignore negative similarity (-1 to 0)
  let matchedCategory = "";

  categories.forEach((category) => {
    if (wordVectors[category] && wordVectors[inputWord]) {
      const similarity = _cosineSimilarity(wordVectors[category], wordVectors[inputWord]);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        matchedCategory = category;
      }
    }
  });
  return matchedCategory;
}
