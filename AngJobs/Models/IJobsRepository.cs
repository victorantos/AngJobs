using System.Collections.Generic;

namespace AngJobs.Models
{
    interface IJobsRepository
    {
        List<Job> GetAllJobs();
    }
}
