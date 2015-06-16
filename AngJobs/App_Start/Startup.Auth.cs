using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using Microsoft.Owin;
using Microsoft.Owin.Security.Cookies;
using Microsoft.Owin.Security.OAuth;
using Owin;
using Angjobs.Providers;
using Angjobs.Models;
using Owin.Security.Providers.LinkedIn;
using Owin.Security.Providers.GooglePlus;
using Microsoft.Owin.Security.Facebook;
using Owin.Security.Providers.Stripe;
using System.Security.Claims;
using Owin.Security.Providers.GitHub;
using Owin.Security.Providers.StackExchange;
using Microsoft.Owin.Security.Twitter;
using System.Configuration;

namespace Angjobs
{
    public partial class Startup
    {
        public static OAuthBearerAuthenticationOptions OAuthBearerOptions { get; private set; }
        public static GooglePlusAuthenticationOptions googleAuthOptions { get; private set; }
        public static FacebookAuthenticationOptions facebookAuthOptions { get; private set; }
        public static StripeAuthenticationOptions stripeAuthOptions { get; private set; }
        public static LinkedInAuthenticationOptions linkedinAuthOptions { get; private set; }
        public static GitHubAuthenticationOptions githubAuthOptions { get; private set; }
        public static StackExchangeAuthenticationOptions stackexchangeAuthOptions { get; private set; }
        public static TwitterAuthenticationOptions twitterAuthOptions { get; private set; }

        public void ConfigureOAuth(IAppBuilder app)
        {
            app.CreatePerOwinContext(DBContext.Create);
            app.CreatePerOwinContext<ApplicationUserManager>(ApplicationUserManager.Create);

            //app.CreatePerOwinContext<ApplicationSignInManager>(ApplicationSignInManager.Create);

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

            //Configure Google External Login
            googleAuthOptions = new GooglePlusAuthenticationOptions()
            {
                ClientId = ConfigurationManager.AppSettings["GooglePlusClientId"],
                ClientSecret = ConfigurationManager.AppSettings["GooglePlusClientSecret"],
                Provider = new GoogleAuthProvider(),
                CallbackPath = new PathString("/signin-googleplus")
            };
            // TODO uncomment to use G+ auth
            app.UseGooglePlusAuthentication(googleAuthOptions);

            string stripeClientId = ConfigurationManager.AppSettings["StripeClientId"];
            string stripeClientSecret = ConfigurationManager.AppSettings["StripeClientSecret"];

            stripeAuthOptions = new StripeAuthenticationOptions()
            {
                ClientId = stripeClientId,
                ClientSecret = stripeClientSecret,
                Provider = new StripeAuthProvider()
                {
                    OnAuthenticated = async context =>
                    {
                        context.Identity.AddClaim(new Claim("ExternalAccessToken", context.AccessToken));
                        context.Identity.AddClaim(new Claim("urn:stripe:refreshToken", context.RefreshToken));
                    }
                },
                SignInAsAuthenticationType = Microsoft.AspNet.Identity.DefaultAuthenticationTypes.ExternalCookie
            };
            app.UseStripeAuthentication(stripeAuthOptions);



            string linkedinApiKey = ConfigurationManager.AppSettings["LinkedInApiKey"];
            string linkedinSecret = ConfigurationManager.AppSettings["LinkedInSecret"];

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


            string githubClientId = ConfigurationManager.AppSettings["GithubClientId"];
            string githubClientSecret = ConfigurationManager.AppSettings["GithubClientSecret"];

            githubAuthOptions = new GitHubAuthenticationOptions()
            {
                ClientId = githubClientId,
                ClientSecret = githubClientSecret,
                Provider = new GitHubAuthProvider
                {
                    OnAuthenticated = async context =>
                    {
                        context.Identity.AddClaim(new Claim("ExternalAccessToken", context.AccessToken));
                    }
                },
                SignInAsAuthenticationType = DefaultAuthenticationTypes.ExternalCookie
            };

            app.UseGitHubAuthentication(githubAuthOptions);

            string twitterConsumerKey = ConfigurationManager.AppSettings["TwitterConsumerKey"];
            string twitterConsumerSecret = ConfigurationManager.AppSettings["TwitterConsumerSecret"];

            twitterAuthOptions = new TwitterAuthenticationOptions()
            {
                ConsumerKey = githubClientId,
                ConsumerSecret = githubClientSecret,
                Provider = new TwitterAuthProvider
                {
                    OnAuthenticated = async context =>
                    {
                        context.Identity.AddClaim(new Claim("ExternalAccessToken", context.AccessToken));
                    }
                },
                SignInAsAuthenticationType = DefaultAuthenticationTypes.ExternalCookie
            };

            app.UseTwitterAuthentication(twitterAuthOptions);


            string stackexchangeClientId = ConfigurationManager.AppSettings["StackExchangeClientId"];
            string stackexchangeClientSecret = ConfigurationManager.AppSettings["StackExchangeClientSecret"];
            string stackexchangeKey = ConfigurationManager.AppSettings["StackExchangeKey"];

        #if DEBUG
            stackexchangeClientId = ConfigurationManager.AppSettings["StackExchangeClientIdDEBUG"];
            stackexchangeClientSecret = ConfigurationManager.AppSettings["StackExchangeClientSecretDEBUG"];
            stackexchangeKey = ConfigurationManager.AppSettings["StackExchangeKeyDEBUG"];
        #endif

            stackexchangeAuthOptions = new StackExchangeAuthenticationOptions()
            {
                ClientId = stackexchangeClientId,
                ClientSecret = stackexchangeClientSecret,
                Key = stackexchangeKey,
                Provider = new StackExchangeAuthProvider
                {
                    OnAuthenticated = async context =>
                    {
                        context.Identity.AddClaim(new Claim("ExternalAccessToken", context.AccessToken));
                    }
                },
                SignInAsAuthenticationType = DefaultAuthenticationTypes.ExternalCookie
            };

            app.UseStackExchangeAuthentication(stackexchangeAuthOptions);


            //Configure Facebook External Login
            //facebookAuthOptions = new FacebookAuthenticationOptions()
            //{
            //    AppId = "xxx",
            //    AppSecret = "xxx",
            //    Provider = new FacebookAuthProvider()
            //};
            //app.UseFacebookAuthentication(facebookAuthOptions);
        }


    }
}
