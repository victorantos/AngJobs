using AngJobs.Models;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Microsoft.AspNet.Identity.Owin;
using System.Web.Http.Description;

namespace AngJobs.Controllers.Jobs
{
    public class JobsController : ApiController
    {
        private DBContext db = new DBContext();

        [HttpGet]
        public object Get()
        {
            var jobs = db.jobPosts.Select(j => new JobPostViewModel
            {
                id = j.Id,
                jobTitle = j.JobTitle,
                jobDescription = j.JobDescription,
                sourceReference = j.SourceReference
            });
            var sample = new List<JobPostViewModel>{
                new JobPostViewModel{ jobTitle = "Job title 1", jobDescription = "Job description 1"},
                 new JobPostViewModel{ jobTitle = "Job title 2", jobDescription = "Job description 2"}
            };

            if (jobs.Any())
                return jobs;
            else
                return sample;
        }

        [HttpGet]
        public object Get(int jobId)
        {
            var job = db.jobPosts.Where(c => c.Id == jobId);

            return job.Select(j => new JobPostViewModel { id = j.Id, jobTitle = j.JobTitle, jobDescription = j.JobDescription }).SingleOrDefault();
        }

        public RoleManager<IdentityRole> RoleManager { get; private set; }

        private ApplicationUserManager _userManager;
        public ApplicationUserManager UserManager
        {
            get
            {
                return _userManager ?? Request.GetOwinContext().GetUserManager<ApplicationUserManager>();
            }
            private set
            {
                _userManager = value;
            }
        }

        [ApiExplorerSettings(IgnoreApi = false)]
        [HttpPost]
        public HttpResponseMessage PostJob(JobPostViewModel item)
        {
            var modelStateErrors = ModelState.Values.ToList();

            List<string> errors = new List<string>();

            foreach (var s in modelStateErrors)
                foreach (var e in s.Errors)
                    if (e.ErrorMessage != null && e.ErrorMessage.Trim() != "")
                        errors.Add(e.ErrorMessage);

            if (errors.Count == 0)
            {
                try
                {
                    var entity = item.ToEntity();
                    if (User.Identity.IsAuthenticated)
                    {
                        var currentUser = UserManager.FindByName(User.Identity.Name);
                        //entity.Owner = currentUser;
                        // make sure any anonymous posts are associated to the user
                       // TODO CheckForAnonymousActions();
                        entity.CreatedBy = currentUser.Id;
                    }
                    else
                        entity.CreatedBy = Guid.NewGuid().ToString();

                    db.jobPosts.Add(entity);
                    db.SaveChanges();

                    return Request.CreateResponse(HttpStatusCode.Created, entity);
                }
                catch
                {
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);
                }
            }
            else
            {
                return Request.CreateResponse<List<string>>(HttpStatusCode.BadRequest, errors);
            }
        }
    }
}
