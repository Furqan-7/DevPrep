import axios from "axios";
import { config } from "dotenv";
config();


export default async function GetJobsRapid(query = "software developer intern India") {
    try {
        const response = await axios.get(
            "https://jsearch.p.rapidapi.com/search",  // ✅ search endpoint
            {
                params: {
                    query,
                    page: "1",
                    num_pages: "1",
                    country: "in",               // 'in' for India
                    date_posted: "month",
                },
                headers: {
                    "X-RapidAPI-Key": process.env.RAPID_API_KEY,
                    "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
                },
            }
        );
        const data = response.data.data;
        return data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // gives you the real error message from RapidAPI
            throw new Error(`JSearch API error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
        }
        throw new Error("Failed while fetching jobs from Rapid API: " + error);
    }
} 