using Owin.Security.Providers.StackExchange;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;

namespace Angjobs.Providers
{
    public class StackExchangeAuthProvider : StackExchangeAuthenticationProvider
    {
        public void ApplyRedirect(StackExchangeAuthenticatedContext context)
        {
            context.Response.Redirect(context.Properties.RedirectUri);
        }

        public override Task Authenticated(StackExchangeAuthenticatedContext context)
        {
            context.Identity.AddClaim(new Claim("ExternalAccessToken", context.AccessToken));
            return Task.FromResult<object>(null);
        }

        public Task ReturnEndpoint(StackExchangeAuthenticatedContext context)
        {
            return Task.FromResult<object>(null);
        }
    }
}