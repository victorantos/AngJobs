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

namespace AngJobs.Controllers.Jobs
{
    public class JobsController : ApiController
    {
        [HttpGet]
        public object Get()
        {
            return new List<JobModel>{
                new JobModel{ Title = "Job title 1", Description = "Job description 1"},
                 new JobModel{ Title = "Job title 2", Description = "Job description 2"}
            };
        }

        private DBContext db = new DBContext();
        //HttpContext httpContext = new HttpContext(new Http

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

        [HttpPost]
        [Authorize]
        public HttpResponseMessage ApplyforJob(TodoItemViewModel item)
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
                    string userId = Request.GetOwinContext().Authentication.User.Identity.GetUserId();

                    var currentUser = UserManager.FindById(userId);
                    currentUser.jobApplications.Add(new JobApplication()
                    {
                        //TODO
                    });

                    UserManager.Update(currentUser);
                    return Request.CreateResponse(HttpStatusCode.Accepted);
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

            var user = db.Users.Where(u => u.firstName == "Test").FirstOrDefault();
        }

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
