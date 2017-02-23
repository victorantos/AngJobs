using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AngJobs.Models;
using Angjobs2.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace AngJobs.Controllers
{
    [Route("api/[controller]")]
    public class JobsDataController : Controller
    {
        private JobsContext _context;
        public JobsDataController(JobsContext dbContext)
        {
            _context = dbContext;
        }
 
        [HttpGet("[action]")]
        public IEnumerable<HotJob> HotJobs()
        {
            List<HotJob> data = null;
            if(_context.Jobs.Any())
            data = _context.Jobs.Select(j=>j.ToHotJob()).ToList();

            return data;
        }

        [HttpGet("[action]/{id}")]
        public Job JobDetail(int id)
        {
             Job data = _context.Jobs.FirstOrDefault(j => j.Id == id);

            return data;
        }

        [HttpPost("[action]")]
        public async Task<IActionResult> ApplyForJob([FromBody] JobApplication application)
        {
            var jobApplication = _context.JobApplications.Add(new JobApplication()
            {
                ApplicationMessage = application.ApplicationMessage,
                JobId = application.JobId,
                Applicant = new Applicant()
                {
                    Ip = HttpContext.Connection.RemoteIpAddress.ToString()
                }
            });

            await _context.SaveChangesAsync();
            return Ok();// new { applicationId : });
        }
    }
}
