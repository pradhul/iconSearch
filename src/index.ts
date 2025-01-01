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
import { loadGloveModel, matchCategory } from "./search";

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

loadGloveModel(process.env.GLOVE_MODEL_PATH || "");
dotenv.config();
nlp.plugin({
  words: {
    phone: "Noun",
  },
});

let categories: string[] = [];
/** Extract Nouns (possible category names would be nouns or noun+words) */
function _extractNouns(): (value: string[][], index: number) => any[] {
  return (iconNames) =>
    iconNames.map((iconName) => {
      const doc = nlp(iconName.join(" "));
      const nouns = doc.nouns().out("array");
      return (doc.length > 1 && nouns.length > 1) || doc.length === 1 ? nouns : [];
    });
}

const iconDataEndPoints = Object.values(iconURLs);
const iconObservables = iconDataEndPoints.map((iconURL) =>
  from(
    axios.get(`${process.env.ICON_NAMES_BASE_PATH}${iconURL}`).then((response) => response.data)
  ).pipe(
    map(Object.keys),
    map((iconNames) => iconNames.filter((iconName) => !iconName.includes("-"))),
    map((iconNames) => {
      return { [iconURL]: nlp(iconNames.join(",")).match("(#Noun|#verb|#Adjective)").out("array") };
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
    tap((iconData: IconsResponse) => {
      fs.writeFileSync("iconData.json", JSON.stringify(iconData)); // FIXME: test remove this after exposing API
    })
  )
  .subscribe({
    next: (result: IconsResponse) => {
      categories = result["Entypo.json"]; //FIXME: add all categories and get an aggregate of possible matches from all categories, then find the best match
      const inputWord = "letter";
      // find all possible matches from all categories
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

// Outputs pizza as a drink, not food, fix this by loading a higher quality glove model possibly 100D
