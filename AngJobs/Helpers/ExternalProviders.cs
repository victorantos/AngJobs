using Angjobs.Models;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using Microsoft.AspNet.Identity.Owin;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;

namespace Angjobs.Helpers
{
    public static class ExternalProviders
    {
        public static async Task<ParsedExternalAccessToken> LoadStackExchangeUserProfile(string userId)
        {
            var _userManager = HttpContext.Current.Request.GetOwinContext().GetUserManager<ApplicationUserManager>();
            string accessToken = null;

            var claims = await _userManager.GetClaimsAsync(userId);

            foreach (var item in claims)
            {
                if (item.Type == "ExternalAccessToken")
                {
                    accessToken = item.Value;
                    break;
                }
            }

            var parsedToken = new ParsedExternalAccessToken();
            var verifyTokenEndPoint = string.Format("https://api.stackexchange.com/2.2/me?order=desc&sort=reputation&site=stackoverflow&access_token={0}&key={1}", accessToken, Startup.stackexchangeAuthOptions.Key);
            var client = new HttpClient();
            var handler = new HttpClientHandler();

            if (handler.SupportsAutomaticDecompression)
                handler.AutomaticDecompression = DecompressionMethods.GZip |
                                                 DecompressionMethods.Deflate;
            client = new HttpClient(handler);


            var uri = new Uri(verifyTokenEndPoint);

            var response = await client.GetAsync(uri);

            if (response.IsSuccessStatusCode)
            {
                string content = await response.Content.ReadAsStringAsync();
                dynamic jObj = (JObject)Newtonsoft.Json.JsonConvert.DeserializeObject(content);
                JObject profile = jObj as JObject;

                parsedToken.stackexchangeUserProfile = profile.ToObject<Models.StackExchange.RootObject>().items[0];
                parsedToken.user_id = parsedToken.stackexchangeUserProfile.user_id.ToString();
            }

            return parsedToken;
        }
       
    }

    public class ExternalLoginData
    {
        const string Stripe = "Stripe";
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
}