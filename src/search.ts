/**
 * @author Pradhul
 * @email pradhudev.1990@gmail.com
 * @create date 2024-12-20 05:36:28
 * @modify date 2024-12-20 05:36:28
 * @desc [description]
 */
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import natural from "natural";
import readline from "readline";
import { Readable } from "stream";

dotenv.config();

const wordVectors: { [key: string]: number[] } = {};

export async function fetchGloveModel(): Promise<void> {
  try {
    const response = await axios.get(
      "https://6e2ozo2cfswoj5c7.public.blob.vercel-storage.com/glove.6B.50d.txt",
      { responseType: "stream" }
    );
    const rl = readline.createInterface({ input: response.data as Readable, crlfDelay: Infinity });

    rl.on("line", (line) => {
      const parts = line.split(" ");
      const word = parts[0];
      const vector = parts.slice(1).map(Number);
      wordVectors[word] = vector;
    });

    rl.on("close", () => {
      console.log("Loaded Glove Model");
    });
  } catch (error) {
    console.error("Error fetching glove model", error);
  }
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
  console.log("Matching input word with categories...");
  console.log("worVector length: ", Object.keys(wordVectors).length);

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
