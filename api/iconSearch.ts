import { VercelRequest, VercelResponse } from "@vercel/node";
import { main } from "../src";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { searchQuery } = req.query;
  if (!searchQuery) {
    res.status(400).json({ message: "Query parameter 'searchQuery' is required" });
    return;
  }
  const bestMatch = await main(searchQuery as string);
  console.log("Best match: ", bestMatch);
  res.status(200).json({ bestMatch });
}
