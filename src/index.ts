import express from "express";
import { main } from "./main";

const app = express();
const port = 3000;

app.get("/", async (req, res) => {
  const { searchQuery } = req.query;
  if (!searchQuery) {
    res.status(400).json({ message: "Query parameter 'searchQuery' is required" });
    return;
  }
  const bestMatch = await main(searchQuery as string);
  console.log("Best match: ", bestMatch);
  res.status(200).json({ bestMatch });
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
