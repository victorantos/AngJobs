using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Threading;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;

namespace AngJobs.Models
{
    public class JobsContextSeedData
    {
        private JobsContext _context;
        private IConfiguration _config;
        private ILoggerFactory _loggerFactory;
        private ILogger logger;
        public JobsContextSeedData(JobsContext context, IConfiguration config, ILoggerFactory loggerFactory)
        {
            _context = context;
            _config = config;
            _loggerFactory = loggerFactory;
        }

        private object data = null;
        public async Task EnsureSeedData()
        {
            //todo negate this
            if (!_context.Jobs.Any())
            {
                //get the hot jobs from AngJobs.com
                GetHotJobs();
                await SeedHotJobs();
            }
        }

        private async Task SeedHotJobs()
        {
            await Task.Delay(1000); //one second delay to wait for API request to finish
            importJobs(data);
        }

        private async void importJobs(object data)
        {
            var jobs = new List<Job>();
            if (data != null)
            {
                dynamic response = (JArray)JsonConvert.DeserializeObject<dynamic>(data?.ToString());

                this.logger = _loggerFactory.CreateLogger("Catchall Endpoint");

                foreach (var item in response)
                {
                    jobs.Add(new Job()
                    {
                        Id = item.id,
                        JobTitle = item.jobTitle,
                        Summary = item.shortDescription,
                        DateCreated = item.dateCreated
                    });
                }
            }
            else
            {
                var job = new Job()
                {
                    JobTitle = "Senior Software Engineer for Google",
                    Summary = "Develop and mantain a Angular 2 web app. It puporse is to allow Google support team to resolve issues ina timely manner."
                };

                jobs.Add(job);
            }


            _context.Jobs.AddRange(jobs);

            await _context.SaveChangesAsync();
        }

        private async void GetHotJobs()
        {
            var baseUri = _config.GetJobsApiUrls("HotJobs");
            using (var client = new HttpClient())
            {
                client.BaseAddress = new Uri(baseUri);
                client.DefaultRequestHeaders.Accept.Clear();
                var response = await client.GetAsync(baseUri);
                if (response.IsSuccessStatusCode)
                {
                    var responseJson = await response.Content.ReadAsStringAsync();
                    //do something with the response here. Typically use JSON.net to deserialise it and work with it

                    data = responseJson;
                }
                else
                {
                    // data = null;
                }
            }

        }
    }
}