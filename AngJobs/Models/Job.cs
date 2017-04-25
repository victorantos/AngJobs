using System;
using System.Collections.Generic;
using System.Linq;
using Angjobs2.ViewModels;

namespace AngJobs.Models
{
    public class Job
    {
        public Job()
        {
            this.DateCreated = DateTime.UtcNow;
        }
        public int Id { get; set; }
        public string JobTitle { get; set; }
        public string Summary { get; set; }
        public string Location { get; set; }
        public DateTime DateCreated { get; set; }

        public HotJob ToHotJob()
        {
            //todo add specific properties
            return new HotJob
            {
                JobId = this.Id,
                JobTitle = this.JobTitle,
                Summary = this.Summary
            };
        }

    }
}
