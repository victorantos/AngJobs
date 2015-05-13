using AngJobs.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace AngJobs.Controllers.Jobs
{
    public class JobsController : ApiController
    {
        [HttpGet]
        public object Get()
        {
            return new List<JobModel>{
                new JobModel{ Title = "Job title 1", Description = "Job description 1"},
                 new JobModel{ Title = "Job title 2", Description = "Job description 2"}
            };
        }
    }
}
