using System;
using System.Linq;
using System.Collections.Generic;

namespace AngJobs.Models
{
    public class JobsRepository : IJobsRepository
    {
        private JobsContext _context;
        public JobsRepository (JobsContext context)
        {
          _context = context;
        }

        public List<Job> GetAllJobs()
        {
            return _context.Jobs.ToList();
        }
    }
}