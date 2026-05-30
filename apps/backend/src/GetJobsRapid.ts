import axios from "axios";
import { config } from "dotenv";
config();

export default async function GetJobsRapid() {


    try {
        const response = await axios.get(
            "https://jsearch.p.rapidapi.com/job-details",
            {
                params: {
                    job_id: "qIsPjUMr0Em0hqHoAAAAAA==",
                    country: "us",
                },
                headers: {
                    "X-RapidAPI-Key": process.env.RAPID_API_KEY,
                    "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
                },
            }
        );
        return response.data;
    } catch (error) {
        throw new Error("Falied while fetching jobs from Rapid api " + error);
    }
}

