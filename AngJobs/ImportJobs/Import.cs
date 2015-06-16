using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web;

namespace AngJobs.ImportJobs
{
  
    public class Import
    {
        public static List<HNJob> LoadHackerNewsFeed(DateTime? date = null)
        {
            if (!date.HasValue)
                date = DateTime.UtcNow;

            var list = new List<HNJob>();
         
            //https://raw.githubusercontent.com/gaganpreet/hn-hiring-mapped/gh-pages/src/web/data/2015-06.json
            var sourceUrl = "https://raw.githubusercontent.com/gaganpreet/hn-hiring-mapped/gh-pages/src/web/data/{0}.json";
            var webClient = new WebClient();
            var feedContent = webClient.DownloadString(string.Format(sourceUrl, date.Value.ToString("yyy-MM")));

            dynamic jObj = (JObject)Newtonsoft.Json.JsonConvert.DeserializeObject(feedContent);
            return list;
        }
    }
}