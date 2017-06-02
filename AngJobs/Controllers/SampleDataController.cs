using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AngJobs.Models;
using AngJobs.DataAccess;

namespace AngJobs.Controllers
{
    [Route("api/[controller]")]
    public class SampleDataController : Controller
    {
        [HttpGet("[action]")]
        public IEnumerable<Job> GetJobs()
        {
            var jobs = DAL.LoadJobs(365);
            return jobs;
        }
    }
}
