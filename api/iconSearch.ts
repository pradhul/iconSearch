import { main } from "../src";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const searchQuery = event.queryStringParameters?.searchQuery;
    if (!searchQuery) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Query parameter 'searchQuery' is required" }),
      };
    }
    const bestMatch = await main(searchQuery);
    console.log("Best match: ", bestMatch);
    return {
      statusCode: 200,
      body: JSON.stringify({ bestMatch }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
