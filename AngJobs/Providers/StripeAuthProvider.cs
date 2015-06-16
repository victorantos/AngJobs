using Microsoft.AspNet.Identity.Owin;
using Microsoft.AspNet.Identity;
using Microsoft.Owin.Extensions;
using Microsoft.AspNet.Identity.EntityFramework;
using Owin.Security.Providers.Stripe;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;

namespace Angjobs.Providers
{
    public class StripeAuthProvider : StripeAuthenticationProvider
    {
        public override Task Authenticated(StripeAuthenticatedContext context)
        {
            base.OnAuthenticated(context);
            return Task.FromResult<object>(null); 
        }

        public override Task ReturnEndpoint(StripeReturnEndpointContext context)
        {
            return Task.FromResult<object>(null);
        }
    }
}