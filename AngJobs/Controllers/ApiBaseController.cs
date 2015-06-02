using AngJobs.Models;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using System.Web.Http.Description;

namespace AngJobs
{

    [ApiExplorerSettings(IgnoreApi = true)]
    public class ApiBaseController : ApiController
    {
        protected DBContext db;

        public ApiBaseController()
        {
            db = HttpContext.Current.GetOwinContext().Get<DBContext>();
        }

        protected void CheckForAnonymousActions()
        {
            var guidCookie = HttpContext.Current.Request.Cookies["guid"];
            var existingUser = UserManager.FindById<Models.User, string>(guidCookie.Value);
            // if anonymous user
            if (existingUser == null)
            {
                // associate any previous job posts or job applications to the new user
                // TODO
            }
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
    }
}
