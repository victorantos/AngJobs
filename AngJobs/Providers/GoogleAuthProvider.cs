using Owin.Security.Providers.GooglePlus;
using Owin.Security.Providers.GooglePlus.Provider;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;

namespace Angjobs.Providers
{
    public class GoogleAuthProvider : GooglePlusAuthenticationProvider
    {
        public void ApplyRedirect(GooglePlusAuthenticatedContext context)
        {
            context.Response.Redirect(context.Properties.RedirectUri);
        }

        public override Task Authenticated(GooglePlusAuthenticatedContext context)
        {
            context.Identity.AddClaim(new Claim("ExternalAccessToken", context.AccessToken));
            return Task.FromResult<object>(null);
        }

        public Task ReturnEndpoint(GooglePlusAuthenticatedContext context)
        {
            return Task.FromResult<object>(null);
        }
    }
}