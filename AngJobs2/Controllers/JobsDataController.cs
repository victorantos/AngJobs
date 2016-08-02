using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Angjobs2.ViewModels;
using AngJobs2.Models;
using Microsoft.AspNetCore.Mvc;

namespace AngJobs2.Controllers
{
    [Route("api/[controller]")]
    public class JobsDataController : Controller
    {
        private JobsContext _context;
        public JobsDataController(JobsContext dbContext)
        {
            _context = dbContext;
        }

        private static string[] Summaries = new[]
        {
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        };

        [HttpGet("[action]")]
        public IEnumerable<HotJob> HotJobs()
        {
            var data = _context.Jobs.Select(j=>j.ToHotJob()).ToList();

            return data;

            var rng = new Random();
            return Enumerable.Range(1, 5).Select(index => new HotJob
            {
                JobTitle = "Title " +  Summaries[rng.Next(Summaries.Length)],
                JobId = rng.Next(1, 55),
                Summary = Summaries[rng.Next(Summaries.Length)]
            });
        }

        
    }
}
