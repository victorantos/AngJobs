using AngJobs.Models;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AngJobs.DataAccess
{
    public static class DAL
    {
        /// <summary>
        /// Get the most recent job posts, for the last X days
        /// </summary>
        /// <param name="lastXDays"></param>
        /// <returns></returns>
        public static IEnumerable<Job> LoadJobs(int lastXDays)
        {
            var data = Helpers.LoadJson();

            var jobs = from j in data
                       where Convert.ToDateTime(j["datePosted"].ToString()) > DateTime.Today.AddDays(-lastXDays)
                       select new Job
                       {
                           Id = (int)j["id"],
                           JobTitle = (string)j["jobTitle"],
                           Summary = (string)j["shortDescription"],
                           Location = (string)j["jobLocation"],
                           DateCreated = Convert.ToDateTime((string)j["datePosted"])
                       };
            return jobs;
        }

        public static Job GetJobById(int id)
        {
            var data = Helpers.LoadJson();

            var jobs = from j in data
                       where (int)j["id"] == id
                       select new Job
                       {
                           Id = (int)j["id"],
                           JobTitle = (string)j["jobTitle"],
                           Summary = (string)j["shortDescription"],
                           Location = (string)j["jobLocation"],
                           DateCreated = Convert.ToDateTime((string)j["datePosted"])
                       };
            return jobs.FirstOrDefault();
        }
    }
}
