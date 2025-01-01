/**
 * @author Pradhul
 * @email pradhudev.1990@gmail.com
 * @create date 2025-01-02 02:29:09
 * @modify date 2025-01-02 02:29:09
 * @desc [description]
 */
/**
 * @author Pradhul
 * @email pradhudev.1990@gmail.com
 * @create date 2024-12-18 03:11:58
 * @modify date 2024-12-18 03:11:58
 * @desc [description]
 */

import axios from "axios";
import dotenv from "dotenv";
import { iconURLs } from "./constants";
import {
  catchError,
  first,
  forkJoin,
  from,
  map,
  mergeAll,
  mergeMap,
  reduce,
  take,
  tap,
} from "rxjs";
import fs from "fs";
import nlp from "compromise";
import { fetchGloveModel, matchCategory } from "./search";
import { head, put } from "@vercel/blob";

type IconsResponse = {
  "SimpleLineIcons.json": string[];
  "MaterialCommunityIcons.json": string[];
  "MaterialIcons.json": string[];
  "Ionicons.json": string[];
  "Octicons.json": string[];
  "Foundation.json": string[];
  "EvilIcons.json": string[];
  "Entypo.json": string[];
  "FontAwesome.json": string[];
};

let categories: string[] = [];
const iconDataEndPoints = Object.values(iconURLs);

dotenv.config();
(async function main() {
  await fetchGloveModel();

  /**
   * An array of observables that fetch icon data from specified endpoints, process the data to extract icon names,
   * filter out names containing hyphens, and then use natural language processing to match nouns, verbs, and adjectives.
   *
   * Each observable performs the following steps:
   * 1. Makes an HTTP GET request to fetch icon data from the endpoint.
   * 2. Extracts the keys (icon names) from the response data.
   * 3. Filters out icon names that contain hyphens.
   * 4. Uses NLP to match and extract nouns, verbs, and adjectives from the filtered icon names.
   * 5. Returns an object where the key is the icon URL and the value is an array of matched words.
   * 6. Catches and logs any errors that occur during the process, returning an empty array in case of an error.
   *
   * @constant {Observable<Object>[]} iconObservables - An array of observables for processing icon data.
   */
  const iconObservables = iconDataEndPoints.map((iconURL) =>
    from(
      axios.get(`${process.env.ICON_NAMES_BASE_PATH}${iconURL}`).then((response) => response.data)
    ).pipe(
      map(Object.keys),
      map((iconNames) => iconNames.filter((iconName) => !iconName.includes("-"))),
      map((iconNames) => {
        return {
          [iconURL]: nlp(iconNames.join(",")).match("(#Noun|#verb|#Adjective)").out("array"),
        };
      }),
      catchError((err) => {
        console.error("Error occurred: " + err);
        return from([]);
      })
    )
  );

  // send all calls parallelly using forkJoin
  forkJoin(iconObservables)
    .pipe(
      map((iconData: any[]) =>
        iconData.reduce((acc, curr) => {
          const key = Object.keys(curr)[0];
          const value = (curr[key][0] as string).split(",");
          return { ...acc, [key]: value };
        }, {})
      ),
      tap((iconData: IconsResponse) => writeToFile(iconData))
    )
    .subscribe({
      next: (result: IconsResponse) => {
        categories = result["Entypo.json"];
        const inputWord = "letter";
        /**
         * find all possible matches from all categories
         * Reduces the result object to an array of matched categories based on the input word.
         *
         * @param result - The object containing categories to be matched.
         * @param inputWord - The word to match against the categories.
         * @returns An array of matched category strings.
         */
        const matchedCategories: string[] = Object.entries(result).reduce<string[]>(
          (acc, current) => {
            const matchedCategory = matchCategory(inputWord, current[1]);
            acc.push(matchedCategory);
            return acc;
          },
          []
        );
        // run again using the results array to find a best possible match
        const bestMatch = matchCategory(inputWord, matchedCategories);
        console.log(`Matched category for ${inputWord} is ${bestMatch}`);
      },
      error(err) {
        console.error("Error occurred: " + err);
      },
    });

  /**
   * Writes the provided icon data to a file named "iconData.json".
   * If the file already exists, it logs a message indicating so.
   * If the file does not exist, it creates a new file and writes the data to it.
   *
   * @param {IconsResponse} iconData - The icon data to be written to the file.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   *
   * @throws {BlobNotFoundError} If the file does not exist.
   */
  async function writeToFile(iconData: IconsResponse) {
    try {
      // await head("iconData.json"); //TODO: Enable before push to vercel
      console.log("iconData.json already exists");
    } catch (BlobNotFoundError) {
      console.log("iconData.json not found, creating a new file");
      const result = await put("iconData.json", JSON.stringify(iconData), {
        access: "public",
        addRandomSuffix: false,
      });
      console.log("writing data to blob file: ", result);
    }
  }
})().catch((err) => console.error(err));

// TODO: The current Glove Model Outputs pizza as a drink, not food, fix this by loading a higher quality glove model possibly 100D
