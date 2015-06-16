using Owin.Security.Providers.GitHub;
using Owin.Security.Providers.LinkedIn;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;

namespace Angjobs.Providers
{
    public class GitHubAuthProvider : GitHubAuthenticationProvider
    {
        public void ApplyRedirect(GitHubAuthenticatedContext context)
        {
            context.Response.Redirect(context.Properties.RedirectUri);
        }

        public override Task Authenticated(GitHubAuthenticatedContext context)
        {
            context.Identity.AddClaim(new Claim("ExternalAccessToken", context.AccessToken));
            return Task.FromResult<object>(null);
        }

        public Task ReturnEndpoint(GitHubAuthenticatedContext context)
        {
            return Task.FromResult<object>(null);
        }
    }
}