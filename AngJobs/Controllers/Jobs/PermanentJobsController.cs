using AngJobs.Models;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Microsoft.AspNet.Identity.Owin;
using System.Web.Http.Description;

namespace AngJobs.Controllers.Jobs
{
    public class PermanentJobsController : ApiController
    {
        private DBContext db = new DBContext();

        [HttpGet]
        public object Get()
        {
            //TODO filter by job type
            var jobs = db.jobPosts.Select(j => new JobModel { Id = j.Id, Title = j.JobTitle, Description = j.JobDescription });
            var sample = new List<JobModel>{
                new JobModel{ Title = "Job title 1", Description = "Job description 1"},
                 new JobModel{ Title = "Job title 2", Description = "Job description 2"}
            };

            if (jobs.Any())
                return jobs;
            else
                return sample;
        }
    }
}
