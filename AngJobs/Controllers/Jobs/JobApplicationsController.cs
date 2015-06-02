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
using System.Web;

namespace AngJobs.Controllers   
{
    public class JobApplicationsController : ApiBaseController
    {
        private DBContext db = new DBContext();

        [HttpGet]
        [Authorize]
        public List<JobApplication> GetUserJobApplications()
        {
            string userId = Request.GetOwinContext().Authentication.User.Identity.GetUserId();

            var currentUser = UserManager.FindById(userId);
            return currentUser.jobApplications;
        }

        [HttpPost]
        public HttpResponseMessage Apply(JobApplicationViewModel item)
        {
            var modelStateErrors = ModelState.Values.ToList();

            List<string> errors = new List<string>();

            foreach (var s in modelStateErrors)
                foreach (var e in s.Errors)
                    if (e.ErrorMessage != null && e.ErrorMessage.Trim() != "")
                        errors.Add(e.ErrorMessage);

            var currentUser = User.Identity.IsAuthenticated ? UserManager.FindByName(User.Identity.Name) : null;
            var entity = item.ToEntity();

            //TODO check is limit of applys per day reached
          //  if (IsJobApplicationsLimitReached(currentUser, entity))
          //      errors.Add("Jobs applications limit reached for today.");

            if (errors.Count == 0)
            {
                try
                {
                    if (User.Identity.IsAuthenticated)
                    {
                        entity.User = currentUser;
                        // make sure any anonymous posts are associated to the user
                        CheckForAnonymousActions();
                        entity.CreatedBy = currentUser.Id;
                    }
                    else
                        entity.CreatedBy = Guid.NewGuid().ToString();

                    db.jobApplications.Add(entity);
                    db.SaveChanges();

                    //if (currentUser != null)
                    //{
                    //    string cvFolder = HttpRuntime.AppDomainAppPath + @"\App_Data\CV";
                    //    Helper.NotifyRecruiter(entity, cvFolder);
                    //}

                    //TODO clear recruiter's jobapplications cache
                  //  JobsCacheManager.ListRecruiterDailyJobApplications.Clear();

                    return Request.CreateResponse(HttpStatusCode.Created, entity);
                }
                catch (Exception ex)
                {
                    // TODO log errors
                    return Request.CreateResponse(HttpStatusCode.InternalServerError);
                }
            }
            else
            {
                return Request.CreateResponse<List<string>>(HttpStatusCode.BadRequest, errors);
            }
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

    }
}
