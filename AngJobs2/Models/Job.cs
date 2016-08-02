using System;
using System.Collections.Generic;
using System.Linq;
using Angjobs2.ViewModels;

namespace AngJobs2.Models
{
    public class Job
    {
        public int Id { get; set; }
        public string JobTitle { get; set; }
        public string Summary { get; set; }

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
