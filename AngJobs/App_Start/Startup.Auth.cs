using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using Microsoft.Owin;
using Microsoft.Owin.Security.Cookies;
using Microsoft.Owin.Security.OAuth;
using Owin;
using AngJobs.Providers;
using AngJobs.Models;
using Owin.Security.Providers.LinkedIn;
using System.Security.Claims;

namespace AngJobs
{
    public partial class Startup
    {
        public static OAuthBearerAuthenticationOptions OAuthBearerOptions { get; private set; }
        public static OAuthAuthorizationServerOptions OAuthOptions { get; private set; }
        public static LinkedInAuthenticationOptions linkedinAuthOptions { get; private set; }

        public static string PublicClientId { get; private set; }

        // For more information on configuring authentication, please visit http://go.microsoft.com/fwlink/?LinkId=301864
        public void ConfigureAuth(IAppBuilder app)
        {
            // Configure the db context and user manager to use a single instance per request
            app.CreatePerOwinContext(DBContext.Create);
            app.CreatePerOwinContext<ApplicationUserManager>(ApplicationUserManager.Create);


            //use a cookie to temporarily store information about a user logging in with a third party login provider
            app.UseExternalSignInCookie(Microsoft.AspNet.Identity.DefaultAuthenticationTypes.ExternalCookie);
            OAuthBearerOptions = new OAuthBearerAuthenticationOptions();

            OAuthAuthorizationServerOptions OAuthServerOptions = new OAuthAuthorizationServerOptions()
            {
                AllowInsecureHttp = true,
                TokenEndpointPath = new PathString("/token"),
                AccessTokenExpireTimeSpan = TimeSpan.FromDays(1),
                Provider = new SimpleAuthorizationServerProvider(),
                RefreshTokenProvider = new SimpleRefreshTokenProvider()
            };

            // Token Generation
            app.UseOAuthAuthorizationServer(OAuthServerOptions);
            app.UseOAuthBearerAuthentication(OAuthBearerOptions);

            //LinkedIn Provider settings
            string linkedinApiKey = "77k9ivpe1fh8yt";
            string linkedinSecret = "BXtEMLhlqNoGxaOA";

            linkedinAuthOptions = new LinkedInAuthenticationOptions()
            {
                ClientId = linkedinApiKey,
                ClientSecret = linkedinSecret,
                Provider = new LinkedInAuthProvider
                {
                    OnAuthenticated = async context =>
                    {
                        context.Identity.AddClaim(new Claim("ExternalAccessToken", context.AccessToken));
                    }
                },
                SignInAsAuthenticationType = DefaultAuthenticationTypes.ExternalCookie
            };
            app.UseLinkedInAuthentication(linkedinAuthOptions);

        }
    }
}
