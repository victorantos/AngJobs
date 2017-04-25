using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AngJobs.Models
{
    public class JobApplication
    {
        public JobApplication()
        {
            this.DateCreated = DateTime.UtcNow;
        }

        public int Id { get; set; }
        public int JobId { get; set; }
        public string ApplicationMessage { get; set; }
        public DateTime DateCreated { get; set; }

        public virtual Applicant Applicant { get; set; }
        public virtual Job Job { get; set; }
    }
}
