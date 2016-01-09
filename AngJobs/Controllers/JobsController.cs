using Angjobs.Models;
using System;
using System.Collections.Generic;
using Microsoft.AspNet.Identity.Owin;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using System.Threading.Tasks;
using System.Collections.Specialized;
using System.Web;
using System.Web.Http.Description;
using System.IO;
using System.Collections;

namespace Angjobs.Controllers
{
    [ApiExplorerSettings(IgnoreApi = false)]
    public class JobsController : ApiBaseController
    {
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
                        entity.Owner = currentUser;
                        // make sure any anonymous posts are associated to the user
                        CheckForAnonymousActions();
                        entity.CreatedBy = currentUser.Id;
                    }
                    else
                        entity.CreatedBy = Guid.NewGuid().ToString();

                    db.JobPosts.Add(entity);
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

        [ApiExplorerSettings(IgnoreApi = false)]
        [HttpGet]
        public HttpResponseMessage GetJobDetails(int id)
        {
            JobPostViewModel job = null;
            try
            {
                job = JobsCacheManager.ListJobPosts.Find(j => j.id == id);
                if (job == null)
                {
                    // get it from database
                    var jobPost = db.JobPosts.Where(j => !(j.IsDeleted ?? false) && j.Id == id).SingleOrDefault();
                    if (jobPost != null)
                        job = new JobPostViewModel(jobPost);
                }
            }
            catch (Exception ex)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError, ex);
            }

            if (job == null)
                return Request.CreateResponse(HttpStatusCode.NotFound);
            else if (job.expiresOn.HasValue && job.expiresOn.Value < DateTime.UtcNow)
                return Request.CreateResponse(HttpStatusCode.Gone);

            return Request.CreateResponse<JobPostViewModel>(HttpStatusCode.OK, job);
        }

        [HttpGet]
        public HttpResponseMessage GetJobsByRecruiter(string id = null)
        {
            if (User.Identity.IsAuthenticated)
                id = User.Identity.GetUserId();
            else if (string.IsNullOrEmpty(id))
                return Request.CreateResponse<object>(HttpStatusCode.OK, new string[0]);

            var recruiter = JobsCacheManager.ListRecruiterJobPosts.FirstOrDefault(r => r.Id == id);
            if (recruiter == null)
            {
                var jobs = db.JobPosts.Where(j => !(j.IsDeleted ?? false) && j.CreatedBy == id).ToList().Select(j => new JobPostViewModel(j)).OrderByDescending(j => j.dateCreated).ToList();
                foreach (var item in jobs)
                {
                    item.shortDescription = Helpers.ShortenDescription(item.jobDescription);
                    item.jobDescription = null;
                }

                recruiter = new JobsCacheManager.RecruiterJobPosts { Id = id, Jobs = jobs };
                JobsCacheManager.ListRecruiterJobPosts.Enqueue(recruiter);
            }

            return Request.CreateResponse<IEnumerable<JobPostViewModel>>(HttpStatusCode.OK, recruiter.Jobs);
        }

        [HttpGet]
        public HttpResponseMessage GetDailyJobApplicationsForRecruiter(string id = null)
        {
            var recruiter = JobsCacheManager.ListRecruiterDailyJobApplications.FirstOrDefault(r => r.Id == id);
            if (recruiter == null)
            {
                var jobApplications = JobsCacheManager.GetDailyJobApplications(id);

                recruiter = new JobsCacheManager.RecruiterDailyJobApplications { Id = id, Jobs = jobApplications };

                JobsCacheManager.ListRecruiterDailyJobApplications.Enqueue(recruiter);
            }

            return Request.CreateResponse<OrderedDictionary>(HttpStatusCode.OK, recruiter.Jobs);
        }

        [HttpGet]
        public HttpResponseMessage GetTodaysJobApplicationsForRecruiter(string id = null)
        {
            var recruiter = JobsCacheManager.ListRecruiterDailyJobApplications.FirstOrDefault(r => r.Id == id);
            if (recruiter == null)
            {
                var jobApplications = JobsCacheManager.GetDailyJobApplications(id);

                recruiter = new JobsCacheManager.RecruiterDailyJobApplications { Id = id, Jobs = jobApplications };

                JobsCacheManager.ListRecruiterDailyJobApplications.Enqueue(recruiter);
            }

            object todaysJobApplications = null;
            if (recruiter.Jobs.Count > 0)
                todaysJobApplications = recruiter.Jobs[0];
            return Request.CreateResponse<object>(HttpStatusCode.OK, todaysJobApplications == null ? new string[0] : todaysJobApplications);
        }

        [HttpGet]
        public HttpResponseMessage GetJobApplication(int id)
        {
            var ja = db.JobApplications.Find(id);
            return Request.CreateResponse<object>(HttpStatusCode.OK, new JobApplicationViewModel(ja));
        }

        [ApiExplorerSettings(IgnoreApi = false)]
        [HttpGet]
        public IEnumerable<JobPostViewModel> GetJobsList()
        {
            return JobsCacheManager.ListJobPostsShortDescription;
        }

        [ApiExplorerSettings(IgnoreApi = false)]
        [HttpGet]
        public IEnumerable<JobPostViewModel> GetHackerNewsJobs()
        {
            return JobsCacheManager.ListJobPostsFromHN;
        }

        [HttpGet]
        public OrderedDictionary GetDailyJobs()
        {
            var allJobs = JobsCacheManager.ListDailyJobPostsShortDescription;
            int i = allJobs.Count;
            var list = new SortedList<DateTime, object>();

            foreach (var item in allJobs)
            {
                var entry = (DictionaryEntry)item;
                var val = from j in (List<JobPostViewModel>)entry.Value
                          select new
                          {
                              id = j.id,
                              jobTitle = j.jobTitle,
                              jobType = j.jobType,
                              salaryMin = j.salaryMin,
                              salaryMax = j.salaryMax,
                              salaryNote = j.salaryNote
                          };
                list.Add((DateTime)entry.Key, val);
            }

            var r = new OrderedDictionary();
            foreach (var item in list.Reverse())
                r.Add(item.Key, item.Value);

            return r;
        }

        [HttpGet]
        public object GetDailyJobs(DateTime? day)
        {
            if (day.HasValue && day.Value.Year > 2013 && day.Value.Year < DateTime.UtcNow.Year + 2)
            {
                return JobsCacheManager.ListDailyJobPostsShortDescription[day.Value];
            }
            else
                return null;

        }
        [ApiExplorerSettings(IgnoreApi = false)]
        [HttpGet]
        public object GetHotJobs(int maxJobs = 10)
        {
            var list = JobsCacheManager.GetHotJobPostsShortDescription(maxJobs);
            if (list == null)
                return new List<object>();
            return list;
        }

        [ApiExplorerSettings(IgnoreApi = false)]
        [HttpPost]
        public HttpResponseMessage ApplyForJob(JobApplicationViewModel item)
        {
            var modelStateErrors = ModelState.Values.ToList();

            List<string> errors = new List<string>();

            foreach (var s in modelStateErrors)
                foreach (var e in s.Errors)
                    if (e.ErrorMessage != null && e.ErrorMessage.Trim() != "")
                        errors.Add(e.ErrorMessage);

            var currentUser = User.Identity.IsAuthenticated ? UserManager.FindByName(User.Identity.Name) : null;
            var entity = item.ToEntity();

            // check is limit of applys per day reached
            if (IsJobApplicationsLimitReached(currentUser, entity))
                errors.Add("Jobs applications limit reached for today.");

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

                    db.JobApplications.Add(entity);
                    db.SaveChanges();

                    if (currentUser != null)
                    {
                        string cvFolder = HttpRuntime.AppDomainAppPath + @"\App_Data\CV";
                        Helper.NotifyRecruiter(entity, cvFolder);
                    }
                    else
                    {
                        Helper.NotifyAdmin(entity);
                    }

                    // clear recruiter's jobapplications cache
                    JobsCacheManager.ListRecruiterDailyJobApplications.Clear();

                    return Request.CreateResponse(HttpStatusCode.Created, entity);
                }
                catch (Exception ex)
                {
                    // TODO log errors
                    return Request.CreateResponse(HttpStatusCode.InternalServerError, ex.ToString());
                }
            }
            else
            {
                return Request.CreateResponse<List<string>>(HttpStatusCode.BadRequest, errors);
            }
        }

        private bool IsJobApplicationsLimitReached(Models.User user, JobApplication entity)
        {
            // tODO restrict anonymous users as well
            if (user == null)
                return false;
            var sameApplications = user.jobApplications.Where(ja => ja.JobPost.Id == entity.JobPost.Id);

            // check if already applied for this same job
            var isAllowed = true;
            if (sameApplications.Count() > 1)
                isAllowed = false;

            // check if reached a limit of job applications per day
            var todaysApplications = user.jobApplications.Where(ja => ja.DateCreated.DayOfYear == DateTime.UtcNow.DayOfYear && ja.DateCreated.Year == DateTime.UtcNow.Year);
            if (todaysApplications.Count() > 30)
                isAllowed = false;

            return !isAllowed;
        }
    }
}
