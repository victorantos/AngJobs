using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using System.Web.Http.ModelBinding;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using Microsoft.AspNet.Identity.Owin;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.Cookies;
using Microsoft.Owin.Security.OAuth;
using Angjobs.Models;
using Angjobs.Providers;
using Angjobs.Results;
using Newtonsoft.Json.Linq;
using System.Linq;
using Angjobs.Models.GitHub;
using Angjobs.Models.Twitter;
using Angjobs.Models.StackExchange;
using System.Net;
using System.IO.Compression;
using System.IO;
using System.Text;

namespace Angjobs.Controllers
{
    [RoutePrefix("api/Account")]
    public class AccountController : ApiBaseController
    {
        const string LinkedIn = "LinkedIn";
        const string GitHub = "GitHub";
        const string Twitter = "Twitter";
        const string StackExchange = "StackExchange";
        const string Facebook = "Facebook";
        const string GooglePlus = "GooglePlus";
        const string Stripe = "Stripe";
        const string ClientName = "AngJobs";

        private AuthRepository _repo = null;

        public AccountController()
        {
            _repo = new AuthRepository();
        }

        // POST api/Account/Register
        [AllowAnonymous]
        [Route("Register")]
        public async Task<IHttpActionResult> Register(UserModel userModel)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            IdentityResult result = await _repo.RegisterUser(userModel);

            IHttpActionResult errorResult = GetErrorResult(result);

            if (errorResult != null)
            {
                return errorResult;
            }

            return Ok();
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _repo.Dispose();
            }

            base.Dispose(disposing);
        }

        private IHttpActionResult GetErrorResult(IdentityResult result)
        {
            if (result == null)
            {
                return InternalServerError();
            }

            if (!result.Succeeded)
            {
                if (result.Errors != null)
                {
                    foreach (string error in result.Errors)
                    {
                        ModelState.AddModelError("", error);
                    }
                }

                if (ModelState.IsValid)
                {
                    // No ModelState errors are available to send, so just return an empty BadRequest.
                    return BadRequest();
                }

                return BadRequest(ModelState);
            }

            return null;
        }

        private IAuthenticationManager Authentication
        {
            get { return Request.GetOwinContext().Authentication; }
        }

        // GET api/Account/ExternalLogin
        [OverrideAuthentication]
        [HostAuthentication(DefaultAuthenticationTypes.ExternalCookie)]
        [AllowAnonymous]
        [Route("ExternalLogin", Name = "ExternalLogin")]
        public async Task<IHttpActionResult> GetExternalLogin(string provider, string error = null)
        {
            string redirectUri = string.Empty;

            if (error != null)
            {
                return BadRequest(Uri.EscapeDataString(error));
            }

            if (!User.Identity.IsAuthenticated)
            {
                return new ChallengeResult(provider, this);
            }

            var redirectUriValidationResult = ValidateClientAndRedirectUri(this.Request, ref redirectUri);

            if (!string.IsNullOrWhiteSpace(redirectUriValidationResult))
            {
                return BadRequest(redirectUriValidationResult);
            }

            ExternalLoginData externalLogin = ExternalLoginData.FromIdentity(User.Identity as ClaimsIdentity);

            if (externalLogin == null)
            {
                return InternalServerError();
            }

            if (externalLogin.LoginProvider != provider)
            {
                Authentication.SignOut(DefaultAuthenticationTypes.ExternalCookie);
                return new ChallengeResult(provider, this);
            }

            IdentityUser user = await _repo.FindAsync(new UserLoginInfo(externalLogin.LoginProvider, externalLogin.ProviderKey));

            bool hasRegistered = user != null;

            redirectUri = string.Format("{0}#external_access_token={1}&provider={2}&haslocalaccount={3}&external_user_name={4}",
                                            redirectUri,
                                            externalLogin.ExternalAccessToken,
                                            externalLogin.LoginProvider,
                                            hasRegistered.ToString(),
                                            externalLogin.UserName);

            await StoreAuthTokenClaims(user);

            return Redirect(redirectUri);

        }

        private string ValidateClientAndRedirectUri(HttpRequestMessage request, ref string redirectUriOutput)
        {
            Uri redirectUri;

            var redirectUriString = GetQueryString(Request, "redirect_uri");

            if (string.IsNullOrWhiteSpace(redirectUriString))
            {
                return "redirect_uri is required";
            }

            bool validUri = Uri.TryCreate(redirectUriString, UriKind.Absolute, out redirectUri);

            if (!validUri)
            {
                return "redirect_uri is invalid";
            }

            var clientId = GetQueryString(Request, "client_id");

            if (string.IsNullOrWhiteSpace(clientId))
            {
                return "client_Id is required";
            }

            var client = _repo.FindClient(clientId);

            if (client == null)
            {
                return string.Format("Client_id '{0}' is not registered in the system.", clientId);
            }

            if (!string.Equals(client.AllowedOrigin.Replace("http://", string.Empty).Replace("https://", string.Empty),
                redirectUri.GetLeftPart(UriPartial.Authority).Replace("http://", string.Empty).Replace("https://", string.Empty), 
                StringComparison.OrdinalIgnoreCase))
            {
                return string.Format("The given URL is not allowed by Client_id '{0}' configuration.", clientId);
            }

            redirectUriOutput = redirectUri.AbsoluteUri;

            return string.Empty;

        }

        private string GetQueryString(HttpRequestMessage request, string key)
        {
            var queryStrings = request.GetQueryNameValuePairs();

            if (queryStrings == null) return null;

            var match = queryStrings.FirstOrDefault(keyValue => string.Compare(keyValue.Key, key, true) == 0);

            if (string.IsNullOrEmpty(match.Value)) return null;

            return match.Value;
        }

        private class ExternalLoginData
        {
            public string LoginProvider { get; set; }
            public string ProviderKey { get; set; }
            public string UserName { get; set; }
            public string ExternalAccessToken { get; set; }

            public static ExternalLoginData FromIdentity(ClaimsIdentity identity)
            {
                if (identity == null)
                {
                    return null;
                }

                Claim providerKeyClaim = identity.FindFirst(ClaimTypes.NameIdentifier);


                if (providerKeyClaim == null || String.IsNullOrEmpty(providerKeyClaim.Issuer) || String.IsNullOrEmpty(providerKeyClaim.Value))
                {
                    return null;
                }

                if (providerKeyClaim.Issuer == ClaimsIdentity.DefaultIssuer)
                {
                    return null;
                }

                string userId = string.Empty;

                if (providerKeyClaim.Issuer.Equals(Stripe, StringComparison.InvariantCultureIgnoreCase))
                    userId = identity.FindFirst("urn:stripe:account:id").Value;
                else
                    userId = providerKeyClaim.Value;

                if (String.IsNullOrEmpty(userId))
                    return null;
                return new ExternalLoginData
                {
                    LoginProvider = providerKeyClaim.Issuer,
                    ProviderKey = userId,
                    UserName = identity.FindFirstValue(ClaimTypes.Name),
                    ExternalAccessToken = identity.FindFirstValue("ExternalAccessToken"),
                };
            }
        }

        private async Task<ParsedExternalAccessToken> VerifyExternalAccessToken(string provider, string accessToken)
        {
            ParsedExternalAccessToken parsedToken = null;

            var verifyTokenEndPoint = "";

            switch (provider)
            {
                case LinkedIn:
                   // verifyTokenEndPoint = string.Format("https://api.linkedin.com/v1/companies/universal-name=victor:(id,name,ticker,description)?oauth2_access_token={0}", accessToken);
                    verifyTokenEndPoint = string.Format("https://api.linkedin.com/v1/people/~:(id,first-name,last-name,formatted-name,email-address,positions,headline,location,public-profile-url)?oauth2_access_token={0}", accessToken);
                    break;
                case GitHub:
                    verifyTokenEndPoint = string.Format("https://api.github.com/user?access_token={0}", accessToken);
                    break;
                case Twitter:
                    verifyTokenEndPoint = string.Format("https://api.twitter.com/1.1/users/show.json?access_token={0}", accessToken);
                    break;
                case StackExchange:
                    verifyTokenEndPoint = string.Format("https://api.stackexchange.com/2.2/me?order=desc&sort=reputation&site=stackoverflow&access_token={0}&key={1}", accessToken, Startup.stackexchangeAuthOptions.Key);
                    break;
                case Facebook:
                    //You can get it from here: https://developers.facebook.com/tools/accesstoken/
                    //More about debug_tokn here: http://stackoverflow.com/questions/16641083/how-does-one-get-the-app-access-token-for-debug-token-inspection-on-facebook
                    var appToken = "xxxxx";
                    verifyTokenEndPoint = string.Format("https://graph.facebook.com/debug_token?input_token={0}&access_token={1}", accessToken, appToken);
                    break;
                case GooglePlus:
                    verifyTokenEndPoint = string.Format("https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={0}", accessToken);
                    break;
                case Stripe:
                    const string UserInfoEndpoint = "https://api.stripe.com/v1/account";
                    HttpRequestMessage userRequest;
                    var httpClient = getWebClient(accessToken, UserInfoEndpoint, out userRequest);

                    HttpResponseMessage graphResponse = await httpClient.SendAsync(userRequest);
                    graphResponse.EnsureSuccessStatusCode();
                    var content = await graphResponse.Content.ReadAsStringAsync();
                    dynamic jObj = (JObject)Newtonsoft.Json.JsonConvert.DeserializeObject(content);
                    parsedToken = new ParsedExternalAccessToken();

                    parsedToken.user_id = jObj["id"];
                    //parsedToken.email = jObj["email"];

                    return parsedToken;
                default:
                    break;
            }

            var client = new HttpClient();

            if (provider == StackExchange)
            {
                var handler = new HttpClientHandler();
                if (handler.SupportsAutomaticDecompression)
                    handler.AutomaticDecompression = DecompressionMethods.GZip |
                                                     DecompressionMethods.Deflate;
                client = new HttpClient(handler);
            }

            var uri = new Uri(verifyTokenEndPoint);

            if (provider.Equals(LinkedIn, StringComparison.InvariantCultureIgnoreCase))
                client.DefaultRequestHeaders.Add("x-li-format", "json");
            if (provider.Equals(GitHub, StringComparison.InvariantCultureIgnoreCase))
                client.DefaultRequestHeaders.Add("User-Agent", ClientName);
            
            var response = await client.GetAsync(uri);

            if (response.IsSuccessStatusCode)
            {
                string content = await response.Content.ReadAsStringAsync();

               

                dynamic jObj = (JObject)Newtonsoft.Json.JsonConvert.DeserializeObject(content);
                JObject profile = jObj as JObject;
                parsedToken = new ParsedExternalAccessToken();

                switch (provider)
                {
                    case LinkedIn:
                        parsedToken.user_id = jObj["id"];
                        parsedToken.userProfile = profile.ToObject<UserProfile>();
                        parsedToken.email = parsedToken.userProfile.emailAddress;
                    //if (!string.Equals(Startup.linkedinAuthOptions.ClientId, parsedToken.app_id, StringComparison.OrdinalIgnoreCase))
                    //{
                    //    return null;
                    //}
                        break;
                    case GitHub:
                        parsedToken.user_id = jObj["id"];
                        parsedToken.githubUserProfile = profile.ToObject<GitHubUserProfile>();
                        parsedToken.email = parsedToken.githubUserProfile.email;
                        break;
                    case Twitter:
                        parsedToken.user_id = jObj["id"];
                        parsedToken.twitterUserProfile = profile.ToObject<TwitterUserProfile>();
                        parsedToken.email = parsedToken.twitterUserProfile.email;
                        break;
                    case StackExchange:
                        parsedToken.stackexchangeUserProfile = profile.ToObject<Angjobs.Models.StackExchange.RootObject>().items[0];
                        parsedToken.user_id = parsedToken.stackexchangeUserProfile.user_id.ToString();
                        break;
                    case "Facebook":
                        parsedToken.user_id = jObj["data"]["user_id"];
                        parsedToken.app_id = jObj["data"]["app_id"];

                        if (!string.Equals(Startup.facebookAuthOptions.AppId, parsedToken.app_id, StringComparison.OrdinalIgnoreCase))
                        {
                            return null;
                        }
                        break;
                    case "GooglePlus":
                        parsedToken.user_id = jObj["user_id"];
                        parsedToken.app_id = jObj["audience"];
                        //parsedToken.email = jObj["email"];
                        if (!string.Equals(Startup.googleAuthOptions.ClientId, parsedToken.app_id, StringComparison.OrdinalIgnoreCase))
                        {
                            return null;
                        }
                        break;
                    default:
                        break;
                }
            }

            return parsedToken;
        }
         
        private static HttpClient getWebClient(string accessToken, string UserInfoEndpoint, out HttpRequestMessage userRequest)
        {
            userRequest = new HttpRequestMessage(HttpMethod.Get, UserInfoEndpoint);
            userRequest.Headers.Add("User-Agent", "OWIN OAuth Provider");
            userRequest.Headers.Add("Authorization", "bearer " + Uri.EscapeDataString(accessToken) + "");
            return new HttpClient();
        }

        /// <summary>
        /// responsible to issue local access token which can be used to access our secure back-end API end points, 
        /// the response for this token need to match the response we obtain when we call the end point “/token”
        /// </summary>
        /// <param name="userName"></param>
        /// <returns></returns>
        private JObject GenerateLocalAccessTokenResponse(string userName)
        {
            var tokenExpiration = TimeSpan.FromDays(1);

            ClaimsIdentity identity = new ClaimsIdentity(OAuthDefaults.AuthenticationType);

            identity.AddClaim(new Claim(ClaimTypes.Name, userName));
            identity.AddClaim(new Claim("role", "user"));

            var props = new AuthenticationProperties()
            {
                IssuedUtc = DateTime.UtcNow,
                ExpiresUtc = DateTime.UtcNow.Add(tokenExpiration),
            };

            var ticket = new AuthenticationTicket(identity, props);

            var accessToken = Startup.OAuthBearerOptions.AccessTokenFormat.Protect(ticket);

            JObject tokenResponse = new JObject(
                                        new JProperty("userName", userName),
                                        new JProperty("access_token", accessToken),
                                        new JProperty("token_type", "bearer"),
                                        new JProperty("expires_in", tokenExpiration.TotalSeconds.ToString()),
                                        new JProperty(".issued", ticket.Properties.IssuedUtc.ToString()),
                                        new JProperty(".expires", ticket.Properties.ExpiresUtc.ToString())
        );
            return tokenResponse;
        }

        // POST api/Account/RegisterExternal
        [AllowAnonymous]
        [Route("RegisterExternal")]
        public async Task<IHttpActionResult> RegisterExternal(RegisterExternalBindingModel model)
        {

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var verifiedAccessToken = await VerifyExternalAccessToken(model.Provider, model.ExternalAccessToken);
            if (verifiedAccessToken == null)
            {
                return BadRequest("Invalid Provider or External Access Token");
            }

            var user = await _repo.FindAsync(new UserLoginInfo(model.Provider, verifiedAccessToken.user_id));

            bool hasRegistered = user != null;

            if (hasRegistered)
            {
                return BadRequest("External user is already registered");
            }
      
            user = new User() { UserName = model.UserName, Email = model.Email ?? verifiedAccessToken.email };

            IdentityResult result = await _repo.CreateAsync(user);
            if (!result.Succeeded)
            {
                return GetErrorResult(result);
            }

            var info = new ExternalLoginInfo()
            {
                DefaultUserName = model.UserName,
                Login = new UserLoginInfo(model.Provider, verifiedAccessToken.user_id)
            };

            result = await _repo.AddLoginAsync(user.Id, info.Login);
            if (!result.Succeeded)
            {
                return GetErrorResult(result);
            }

            //generate access token response
            var accessTokenResponse = GenerateLocalAccessTokenResponse(model.UserName);

            // TODO no auth cookie is here so claimsIdentity is null
            await StoreAuthTokenClaims(user);

            loadUserProfile(model.Provider, verifiedAccessToken, accessTokenResponse);


            return Ok(accessTokenResponse);
        }

        [AllowAnonymous]
        [HttpGet]
        [Route("ObtainLocalAccessToken")]
        public async Task<IHttpActionResult> ObtainLocalAccessToken(string provider, string externalAccessToken)
        {
            if (string.IsNullOrWhiteSpace(provider) || string.IsNullOrWhiteSpace(externalAccessToken))
            {
                return BadRequest("Provider or external access token is not sent");
            }

            var verifiedAccessToken = await VerifyExternalAccessToken(provider, externalAccessToken);
            if (verifiedAccessToken == null)
            {
                return BadRequest("Invalid Provider or External Access Token");
            }

            var user = await _repo.FindAsync(new UserLoginInfo(provider, verifiedAccessToken.user_id));

            bool hasRegistered = user != null;

            if (!hasRegistered)
            {
                return BadRequest("External user is not registered");
            }

            //generate access token response
            var accessTokenResponse = GenerateLocalAccessTokenResponse(user.UserName);

            loadUserProfile(provider, verifiedAccessToken, accessTokenResponse);


            return Ok(accessTokenResponse);
        }

        private static void loadUserProfile(string provider, ParsedExternalAccessToken verifiedAccessToken, JObject accessTokenResponse)
        {
            if (provider == LinkedIn)
            {
                accessTokenResponse.Add("userProfile", JToken.FromObject(verifiedAccessToken.userProfile));
            }
            if (provider == GitHub)
            {
                accessTokenResponse.Add("githubUserProfile", JToken.FromObject(verifiedAccessToken.githubUserProfile));
            }
            if (provider == StackExchange)
            {
                accessTokenResponse.Add("stackexchangeUserProfile", JToken.FromObject(verifiedAccessToken.stackexchangeUserProfile));
            }
            if (provider == Twitter)
            {
                accessTokenResponse.Add("twitterUserProfile", JToken.FromObject(verifiedAccessToken.twitterUserProfile));
            }
        }

        private IAuthenticationManager AuthenticationManager
        {
            get
            {
                return HttpContext.Current.GetOwinContext().Authentication;
            }
        }

        private async Task StoreAuthTokenClaims(IdentityUser user)
        {
            var claimsIdentity = await AuthenticationManager.GetExternalIdentityAsync(DefaultAuthenticationTypes.ExternalCookie);

            if (claimsIdentity != null && user != null)
            {
                // Retrieve the existing claims
                var currentClaims = await _repo.GetClaimsAsync(user.Id);

                // Get the list of access token related claims from the identity
                var tokenClaims = claimsIdentity.Claims.Where(c => c.Type.Equals("ExternalAccessToken")
                    || c.Type.StartsWith("urn:stripe:refreshToken"));

                // Save the access token related claims
                foreach (var tokenClaim in tokenClaims)
                {
                    if (currentClaims.FirstOrDefault(c => c.Type == tokenClaim.Type) == null)
                    {
                        await _repo.AddClaimAsync(user.Id, tokenClaim);
                    }
                }
            }

        }
    }
}
