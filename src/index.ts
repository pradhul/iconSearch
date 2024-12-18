/**
 * @author Pradhul
 * @email pradhudev.1990@gmail.com
 * @create date 2024-12-18 03:11:58
 * @modify date 2024-12-18 03:11:58
 * @desc [description]
 */
import { genkit } from "genkit";
import { gemini15Flash, googleAI } from "@genkit-ai/googleai";
import dotenv from "dotenv";

dotenv.config();

const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});

const helloFlow = ai.defineFlow("helloFlow", async (name) => {
  const { text } = await ai.generate("Hello Gemini, my name is " + name);
  console.log(text);
});

helloFlow("Pradhul");
