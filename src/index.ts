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
import { catchError, forkJoin, from, map, tap } from "rxjs";
import nlp from "compromise";
import { fetchGloveModel, matchCategory } from "./search";
import { head, put } from "@vercel/blob";
import fs from "fs";

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

dotenv.config();
export async function main(searchQuery: string): Promise<string> {
  const startTime = Date.now();
  try {
    console.time("Execution Time");
    const [_, iconDataFomFile] = await Promise.all([fetchGloveModel(), readFileFromDisk()]);

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
    if (await !isIconDataAlreadyWritten()) {
      const iconObservables = Object.values(iconURLs).map((iconURL) =>
        from(
          axios
            .get(`${process.env.ICON_NAMES_BASE_PATH}${iconURL}`)
            .then((response) => response.data)
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
      console.log("Fetching icon data from endpoints...");

      // send all calls parallelly using forkJoin
      return new Promise<string>((resolve, reject) => {
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
              const bestMatch = findBestPossibleMatch(result);
              resolve(bestMatch);
            },
            error(err) {
              console.error("Error occurred: " + err);
              reject(err);
            },
          });
      });
    } else {
      console.log("Icon data already written to file, reading from file now..");
      return findBestPossibleMatch(iconDataFomFile);
    }

    async function readFileFromDisk(): Promise<IconsResponse> {
      return new Promise((resolve, reject) => {
        fs.readFile("iconData.json", "utf8", (err, data) => {
          if (err) {
            console.error("Error reading file:", err);
            reject(err);
            return;
          }
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData as IconsResponse);
          } catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            reject(parseError);
          }
        });
      });
    }

    /**
     * Asynchronously retrieves icon data from a blob file.
     *
     * This function reads the `iconData.json` file to get the URL of the icon data,
     * then makes an HTTP GET request to fetch the icon data in JSON format.
     *
     * @returns {Promise<any>} A promise that resolves to the icon data.
     * @throws Will throw an error if there is an issue reading the icon data file or making the HTTP request.
     */
    async function getIconDataFromBlobFile() {
      try {
        const iconData = await head("iconData.json");
        const response = await axios.get(iconData.url, { responseType: "json" });
        return response.data;
      } catch (error) {
        console.error("Error reading icon data from file", error);
        throw error;
      }
    }

    /**
     * find all possible matches from all categories
     * Reduces the result object to an array of matched categories based on the input word.
     *
     * @param result - The object containing categories to be matched.
     * @param inputWord - The word to match against the categories.
     * @returns An array of matched category strings.
     */
    function findBestPossibleMatch(result: IconsResponse): string {
      const matchedCategories: string[] = Object.entries(result).reduce<string[]>(
        (acc, current) => {
          const matchedCategory = matchCategory(searchQuery, current[1]);
          acc.push(matchedCategory);
          return acc;
        },
        []
      );
      // run again using the results array to find a best possible match
      const bestMatch = matchCategory(searchQuery, matchedCategories);
      console.log(`Matched category for ${searchQuery} is ${bestMatch}`);
      return bestMatch;
    }

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
      if (await isIconDataAlreadyWritten()) {
        console.log("iconData.json already written");
        return;
      }
      console.log("iconData.json not found, creating a new file");
      const result = await put("iconData.json", JSON.stringify(iconData), {
        access: "public",
        addRandomSuffix: false,
      });
      console.log("writing data to blob file: ", result);
    }

    async function isIconDataAlreadyWritten() {
      try {
        await head("iconData.json");
        return true;
      } catch (BlobNotFoundError) {
        return false;
      }
    }
  } catch (error) {
    console.error("Error Occurred in main ", error);
    return "Error occurred";
  } finally {
    console.timeEnd("Execution Time");
  }
}
// TODO: The current Glove Model Outputs pizza as a drink, not food, fix this by loading a higher quality glove model possibly 100D
// main("letter");
