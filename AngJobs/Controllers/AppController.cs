using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace AngJobs.Controllers
{
    /// <summary>
    /// Create an ActionResult and PartialView for each angular partial view you want to attatch to a route in the angular app.js file.
    /// </summary>
    public class AppController : Controller
    {
        public ActionResult Register()
        {
            return PartialView();
        }
        public ActionResult SignIn()
        {
            return PartialView();
        }
        public ActionResult Home()
        {
            return PartialView();
        }
        public ActionResult Inbox()
        {
            return PartialView();
        }
        public ActionResult Contract()
        {
            return PartialView();
        }
        public ActionResult Permanent()
        {
            return PartialView();
        }
        public ActionResult Employers()
        {
            return PartialView();
        }
        public ActionResult Developers()
        {
            return PartialView();
        }
        public ActionResult About()
        {
            return PartialView();
        }
        public ActionResult PostJob()
        {
            return PartialView();
        }
        public ActionResult JobDetails()
        {
            return PartialView();
        }
        public ActionResult JobApplyLinkedIn()
        {
            return PartialView();
        }
        public ActionResult Jobs()
        {
            return PartialView();
        }
    }
}