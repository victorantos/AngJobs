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
            var jobs = db.jobPosts.Select(j => new JobModel { Id = j.Id, Title = j.JobTitle, Description = j.JobDescription });
            var sample = new List<JobModel>{
                new JobModel{ Title = "Job title 1", Description = "Job description 1"},
                 new JobModel{ Title = "Job title 2", Description = "Job description 2"}
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

            return job.Select(j => new JobModel { Id = j.Id, Title = j.JobTitle, Description = j.JobDescription }).SingleOrDefault();
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

        //[HttpGet]
        //[Authorize]
        //public List<JobApplication> GetUserJobApplications()
        //{
        //    string userId = Request.GetOwinContext().Authentication.User.Identity.GetUserId();

        //    var currentUser = UserManager.FindById(userId);
        //    return currentUser.jobApplications;
        //}

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

        //TODO move this to a diffrent controller
        //[HttpPost]
        //public HttpResponseMessage ApplyforJob(TodoItemViewModel item)
        //{
        //    var modelStateErrors = ModelState.Values.ToList();

        //    List<string> errors = new List<string>();

        //    foreach (var s in modelStateErrors)
        //        foreach (var e in s.Errors)
        //            if (e.ErrorMessage != null && e.ErrorMessage.Trim() != "")
        //                errors.Add(e.ErrorMessage);

        //    if (errors.Count == 0)
        //    {
        //        try
        //        {
        //            string userId = Request.GetOwinContext().Authentication.User.Identity.GetUserId();

        //            var currentUser = UserManager.FindById(userId);
        //            currentUser.jobApplications.Add(new JobApplication()
        //            {
        //                //TODO
        //            });

        //            UserManager.Update(currentUser);
        //            return Request.CreateResponse(HttpStatusCode.Accepted);
        //        }
        //        catch
        //        {
        //            return Request.CreateResponse(HttpStatusCode.InternalServerError);
        //        }
        //    }
        //    else
        //    {
        //        return Request.CreateResponse<List<string>>(HttpStatusCode.BadRequest, errors);
        //    }

        //    var user = db.Users.Where(u => u.firstName == "Test").FirstOrDefault();
        //}

        //[HttpPost]
        //[Authorize]
        //async public Task<HttpResponseMessage> CompleteTodoItem(int id)
        //{
        //    var item = db.todos.Where(t => t.id == id).FirstOrDefault();
        //    if (item != null)
        //    {
        //        item.completed = true;
        //        await db.SaveChangesAsync();
        //    }
        //    return Request.CreateResponse(HttpStatusCode.Accepted);
        //}

        //[HttpPost]
        //[Authorize]
        //async public Task<HttpResponseMessage> DeleteTodoItem(int id)
        //{
        //    var item = db.todos.Where(t => t.id == id).FirstOrDefault();
        //    if (item != null)
        //    {
        //        db.todos.Remove(item);
        //        await db.SaveChangesAsync();
        //    }
        //    return Request.CreateResponse(HttpStatusCode.Accepted);
        //}

    }
}
