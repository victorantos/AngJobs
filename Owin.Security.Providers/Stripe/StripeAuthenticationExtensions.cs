using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Owin.Security.Providers.Stripe
{
    public static class StripeAuthenticationExtensions
    {
        public static IAppBuilder UseStripeAuthentication(this IAppBuilder app,
            StripeAuthenticationOptions options)
        {
            if (app == null)
                throw new ArgumentNullException("app");
            if (options == null)
                throw new ArgumentNullException("options");

            app.Use(typeof(StripeAuthenticationMiddleware), app, options);

            return app;
        }

        public static IAppBuilder UseStripeAuthentication(this IAppBuilder app, string clientId, string clientSecret)
        {
            return app.UseStripeAuthentication(new StripeAuthenticationOptions
            {
                ClientId = clientId,
                ClientSecret = clientSecret
            });
        }
    }
}
