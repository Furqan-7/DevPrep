import axios from "axios";
import { config } from "dotenv";
config();

export default async function GetJobsRemotive() {
    try {
        const jobs = await axios.get(`${process.env.REMOTIVE_API_KEY}`);
        return jobs;
    } catch (error) {
        throw new Error("Falied at Fetching Jobs" + error);
    }
}