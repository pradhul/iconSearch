import { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchGloveModel } from "../src/search";

let isModelLoaded = false;
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    if (!isModelLoaded) {
      await fetchGloveModel();
      isModelLoaded = true;
    }
    res.status(200).json({ message: "Model loaded successfully" });
  } catch (error) {
    console.error("Error loading model", error);
    res.status(500).json({ message: "Error loading model" });
  }
}
