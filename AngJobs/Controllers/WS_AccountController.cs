using AngJobs.Models;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace AngJobs.Controllers
{
    public class WS_AccountController : ApiController
    {
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

        //Based on the OWIN authentication, finds the current authenticated username.        
        public string GetCurrentUserName()
        {
            return Request.GetOwinContext().Authentication.User.Identity.Name;
        }

        //Based on the OWIN authentication, tells if the user is authenticated.
        //UNTESTED
        public bool GetIsLoggedIn()
        {
            return Request.GetOwinContext().Authentication.User.Identity.IsAuthenticated;
        }

        //Get the userID from the Request context, and pass the ID into the usermanager to get the current user roles.
        //UNTESTED
        async public Task<IEnumerable<string>> GetCurrentUserRoles()
        {
            return await UserManager.GetRolesAsync(Request.GetOwinContext().Authentication.User.Identity.GetUserId());
        }
    }
}
