using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
 
namespace AngJobs.Models
{
    public class JobsContextSeedData
    {
        private JobsContext _context;
        public JobsContextSeedData (JobsContext context)
        {
            _context = context;
        }

        public async Task EnsureSeedData()
        {
            if(!_context.Jobs.Any())
            {
                var job = new Job(){
                    JobTitle = "Senior Software Engineer for Google",
                    Summary = "Develop and mantain a Angular 2 web app. It puporse is to allow Google support team to resolve issues ina timely manner."
                };

                _context.Jobs.Add(job);

                await _context.SaveChangesAsync();
            }
        }
    }
}