using Angjobs.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Microsoft.AspNet.Identity.Owin;
using System.Collections.Specialized;
using Angjobs.Helpers;

namespace Angjobs.Controllers
{
    public class MainController : Controller
    {
        // GET: Main
        public ActionResult Index()
        {
            string escaped_fragment = Request.QueryString["_escaped_fragment_"];

            ViewBag.Title = "AngJobs | AngularJs jobs for web developers";
            if (escaped_fragment == null)
            {
                //add meta for gbot
                //<meta name="fragment" content="!">
                ViewBag.ShowFragmentMeta = true;
                return View();
            }
            else
            {
                var db = Request.GetOwinContext().Get<DBContext>();
                var jobdetails = "jobdetails";
                var daily = "daily";
                var daily_day = "day";
                var jobs = "jobs";
                var home = "home";
                var inbox = "inbox";
                var about = "about";
                var testimonials = "testimonials";
                var seeking = "employer/seeking";

                const string permanent = "permanent";
                const string fulltime = "full-time";

                var googlebotView = "~/Views/GoogleBot/Index.cshtml";

                var pDetailsIndex = escaped_fragment.IndexOf(jobdetails, StringComparison.InvariantCultureIgnoreCase);
                var pJobsIndex = escaped_fragment.IndexOf(jobs + "/", StringComparison.InvariantCultureIgnoreCase);
                var pDailyIndex = escaped_fragment.IndexOf(daily, StringComparison.InvariantCultureIgnoreCase);
                var pAboutIndex = escaped_fragment.IndexOf(about, StringComparison.InvariantCultureIgnoreCase);
                var pSeekingIndex = escaped_fragment.IndexOf(seeking, StringComparison.InvariantCultureIgnoreCase);

                var pTestimonialsIndex = escaped_fragment.IndexOf(testimonials, StringComparison.InvariantCultureIgnoreCase);
              

                if (pDetailsIndex > 0)
                {
                    var jobId = int.Parse(escaped_fragment.Substring(pDetailsIndex + 1 + jobdetails.Length));
                    var jobPost = db.JobPosts.Find(jobId);
                    if(jobPost == null || (jobPost.IsDeleted ?? false))
                         throw new HttpException(404, "Job not found");

                    var data = new JobPostViewModel(jobPost);
                    var pageTitle = data.jobTitle + " - AngularJs job";
                    return View(googlebotView, new GoogleBotPage { page = jobdetails, data = data, pageTitle = pageTitle });
                }
                else if (pDailyIndex > 0)
                {
                    //checked if any params
                    DateTime day = DateTime.Today;
                    var thisPage = daily;
                    object thisData = JobsCacheManager.ListDailyJobPostsShortDescription;
                    int jIndex = pDailyIndex + 1 + daily.Length;
                    if (jIndex < escaped_fragment.Length && DateTime.TryParse(escaped_fragment.Substring(jIndex), out day))
                    {
                        thisPage = daily_day;
                        thisData = new { day = day, list =  (thisData as OrderedDictionary)[day]}.ToExpando();
                    }

                    return View(googlebotView, new GoogleBotPage { page = thisPage, data =  thisData });
                }
                else if (pAboutIndex > 0)
                {
                    return View(googlebotView, new GoogleBotPage { page = about, data =  null });
                }
                else if (pTestimonialsIndex > 0)
                {
                    return View(googlebotView, new GoogleBotPage { page = testimonials, data = null });
                }
                else if (pSeekingIndex > 0)
                {
                    var freelancers = Helpers.Freelancers.GetFreelancers();
                    return View(googlebotView, new GoogleBotPage { page = seeking, data = freelancers });
                }

                string jobType = pJobsIndex > 0 ? escaped_fragment.Substring(pJobsIndex + 1 + jobs.Length) : string.Empty;
 
                if (!string.IsNullOrEmpty(jobType) &&  jobType != inbox  )
                {
                    switch (jobType)
                    {
                        case permanent:
                            return GetBotPage(db, googlebotView, home, jobType, fulltime);
                        case fulltime:
                            return GetBotPage(db, googlebotView, home, jobType, permanent);
                        default:
                            return View(googlebotView, new GoogleBotPage { page = home, data = JobsCacheManager.ListJobPostsShortDescription});
                    }
                }
                else
                {
                    return View(googlebotView, new GoogleBotPage { page = home, data = JobsCacheManager.ListJobPostsShortDescription});
                }
            }
        }

        const int maxJobs = 115;
        private ActionResult GetBotPage(DBContext db, string googlebotView, string page, string jobType, string jobType2)
        {
            return View(googlebotView,
                new GoogleBotPage
                {
                    page = page,
                    data = Helpers.Common.GetAllJobPostsShortDescription(db, maxJobs)
            
            //db.JobPosts.Where(j => !(j.IsDeleted ?? false) 
            //            && (j.JobType.Equals(jobType, StringComparison.InvariantCultureIgnoreCase)
            //            || j.JobType.Equals(jobType2, StringComparison.InvariantCultureIgnoreCase))
               // )
               });
        }

       
    }
}