using Owin.Security.Providers.LinkedIn;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;

namespace AngJobs.Providers
{
    public class LinkedInAuthProvider : LinkedInAuthenticationProvider
    {
        public void ApplyRedirect(LinkedInAuthenticatedContext context)
        {
            context.Response.Redirect(context.Properties.RedirectUri);
        }

        public override Task Authenticated(LinkedInAuthenticatedContext context)
        {
            context.Identity.AddClaim(new Claim("ExternalAccessToken", context.AccessToken));
            return Task.FromResult<object>(null);
        }

        public Task ReturnEndpoint(LinkedInAuthenticatedContext context)
        {
            return Task.FromResult<object>(null);
        }
    }
}