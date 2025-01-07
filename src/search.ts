/**
 * @author Pradhul
 * @email pradhudev.1990@gmail.com
 * @create date 2024-12-20 05:36:28
 * @modify date 2024-12-20 05:36:28
 * @desc [description]
 */
import axios from "axios";
import * as fs from "fs";
import dotenv from "dotenv";
import * as readline from "readline";
import { Readable } from "stream";

dotenv.config();

const wordVectors: { [key: string]: number[] } = {};

async function loadChunksInBatches(urls: string[], batchSize: number = 2): Promise<void> {
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.all(batch.map(loadChunk));
    console.log(`Loaded batch ${i / batchSize + 1}`);
  }
}

async function loadChunk(url: string): Promise<void> {
  // const response = await axios.get(url, { responseType: "stream" });
  const response = fs.createReadStream(url);
  const rl = readline.createInterface({ input: response as Readable });
  const tempVectors: { [key: string]: number[] } = {};

  rl.on("line", (line) => {
    const parts = line.split(" ");
    const word = parts[0];
    const vector = parts.slice(1).map(Number);
    tempVectors[word] = vector;
  });

  await new Promise((resolve) => rl.on("close", resolve));
  Object.assign(wordVectors, tempVectors);
}

export async function fetchGloveModel(): Promise<void> {
  const chunkURLs = [
    "models/glove_part_aa.txt",
    "models/glove_part_ab.txt",
    "models/glove_part_ac.txt",

    // Add more URLs as needed
  ];

  console.log("Loading GloVe chunks...");
  await loadChunksInBatches(chunkURLs, 3);
  console.log("All chunks loaded. Total words:", Object.keys(wordVectors).length);
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

  // prefetch the input word vector
  inputWord = inputWord.replace(/[\"',]/g, "");
  const inputVector = wordVectors[inputWord];
  if (!inputVector) {
    console.log("Input word not found in GloVe model");
    return "Not Found";
  }

  console.log(`Matching ${inputWord} with categories...`);
  console.log("worVector length: ", Object.keys(wordVectors).length);

  categories.forEach((category) => {
    if (wordVectors[category] && inputVector) {
      const similarity = _cosineSimilarity(wordVectors[category], inputVector);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        matchedCategory = category;
      }
    }
  });
  console.log("Matched category: ", matchedCategory);
  return matchedCategory;
}
