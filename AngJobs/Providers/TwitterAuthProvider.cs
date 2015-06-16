using Microsoft.Owin.Security.Twitter;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;

namespace Angjobs.Providers
{
    public class TwitterAuthProvider : TwitterAuthenticationProvider
    {
        public void ApplyRedirect(TwitterAuthenticatedContext context)
        {
            context.Response.Redirect(context.Properties.RedirectUri);
        }

        public override Task Authenticated(TwitterAuthenticatedContext context)
        {
            context.Identity.AddClaim(new Claim("ExternalAccessToken", context.AccessToken));
            return Task.FromResult<object>(null);
        }

        public Task ReturnEndpoint(TwitterAuthenticatedContext context)
        {
            return Task.FromResult<object>(null);
        }
    }
}