
import { jobType, JobCategory } from "@repo/database";

export function mapRapidJob(job: any) {
    return {
        externalId: job.slug,
        source: "arbeitnow",

        title: job.title,

        company: job.company_name,

        companyLetter: job.company_name[0],

        location: job.location,

        salary: null,
        salaryMin: null,
        salaryMax: null,

        type: jobType.full_time,

        category: JobCategory.company,

        description: job.description,

        skills: job.tags || [],

        applyUrl: job.url,

        postedAt: new Date().toISOString(),

        isVerified: true,
        isSaved: false,
    };
}

export function mapRemotiveJob(job: any) {
    return {
        externalId: job.id.toString(),
        source: "remotive",

        title: job.title,
        company: job.company_name,

        companyLetter: job.company_name[0],

        location: job.candidate_required_location,

        salaryMin: null,
        salaryMax: null,
        salary: null,

        type: job.job_type === "full_time"
            ? jobType.full_time
            : jobType.other,

        category: JobCategory.company,

        description: job.description,

        skills: [],

        applyUrl: job.url,

        postedAt: new Date(job.publication_date).toISOString(),

        isVerified: true,
        isSaved: false,
    };
}