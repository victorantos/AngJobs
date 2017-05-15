using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using AngJobs.Models;
using AngJobs.DataAccess;
using Newtonsoft.Json;
using System.IO;

namespace AngJobs.Controllers
{
    [Produces("application/json")]
    [Route("api/Jobs")]
    public class JobsController : Controller
    {
        // GET: api/Jobs
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        // GET: api/Jobs/5
        [HttpGet("{id}", Name = "Get")]
        public Job Get(int id)
        {
            return DAL.GetJobById(id);
        }
        
        // POST: api/Jobs
        [HttpPost]
        public void Post([FromBody]JobApplication jobApplication)
        {
            //TODO save the job application
            jobApplication.Job = DAL.GetJobById(jobApplication.JobId);

            string json = JsonConvert.SerializeObject(jobApplication);
            // write string to file
            System.IO.File.WriteAllText("./data/jobApplications/" + jobApplication.JobId+ "--"+ Guid.NewGuid() +".json", json);
        }
        
        // PUT: api/Jobs/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody]string value)
        {
        }
        
        // DELETE: api/ApiWithActions/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
