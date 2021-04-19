using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using AngJobs.Models;
namespace AngJobs.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class JobsController : ControllerBase
    {
        private static readonly string[] Summaries = new[]
        {
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        };

        private readonly ILogger<JobsController> _logger;

        public JobsController(ILogger<JobsController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        public IEnumerable<FavouriteJobs> Get()
        {
            var rng = new Random();
            return Enumerable.Range(1, 5).Select(index => new FavouriteJobs
            {
                Id = Guid.NewGuid(),
                JobIds = new List<int>{
                    rng.Next(2000000),
                    rng.Next(2000000),
                    rng.Next(2000000),
                    rng.Next(2000000)
                }
            }).ToArray();
        }
    }
}
