using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace AngJobs2.Controllers
{
    [Route("api/[controller]")]
    public class JobsDataController : Controller
    {
        private static string[] Summaries = new[]
        {
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        };

        [HttpGet("[action]")]
        public IEnumerable<HotJob> HotJobs()
        {
            var rng = new Random();
            return Enumerable.Range(1, 5).Select(index => new HotJob
            {
                JobTitle = "Title " +  Summaries[rng.Next(Summaries.Length)],
                JobId = rng.Next(1, 55),
                Summary = Summaries[rng.Next(Summaries.Length)]
            });
        }

        public class HotJob
        { 
            public int JobId { get; set; }
            public string JobTitle { get; set; }
            public string Summary { get; set; }

        }
    }
}
