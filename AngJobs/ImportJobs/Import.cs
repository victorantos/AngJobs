using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Angjobs.Models;
using System.Text.RegularExpressions;
using System.Net.Mail;
using System.Diagnostics;

namespace Angjobs.ImportJobs
{
    public class Import
    {
        public static List<JobPost> LoadHackerNewsFeed(DateTime? date = null)
        {
            //if (System.Diagnostics.Debugger.IsAttached == false)
            //    System.Diagnostics.Debugger.Launch();
            if (!date.HasValue)
                date = DateTime.UtcNow;

            var list = new List<JobPost>();

            //https://raw.githubusercontent.com/gaganpreet/hn-hiring-mapped/gh-pages/src/web/data/2015-06.json
            var sourceUrl = "https://raw.githubusercontent.com/gaganpreet/hn-hiring-mapped/gh-pages/src/web/data/{0}.json";
            var webClient = new WebClient();
            string feedContent = null;
            try
            {
               feedContent = webClient.DownloadString(string.Format(sourceUrl, date.Value.ToString("yyy-MM")));

            }
            catch (WebException ex)
            {
               //probably not found, the link does not exists yet
            }

            if (!string.IsNullOrEmpty(feedContent))
            {
                dynamic jObj = (JArray)Newtonsoft.Json.JsonConvert.DeserializeObject(feedContent);

                foreach (var item in jObj)
                {
                    string emails = TryParseEmails((string)item.full_html);
                    string website = TryParseWebsite(emails);
                    string companyName = TryParseCompany(emails);

                    string jobDescription = TryParseJobDescription((string)item.full_html);
                    string jobTitle = TryParseJobTitle(jobDescription);

                    if (!string.IsNullOrEmpty(emails) && !string.IsNullOrEmpty(jobTitle))
                    {
                        list.Add(new JobPost
                        {
                            Location = item.location, //item.address,
                            Country = item.country,
                            JobTitle = jobTitle,
                            JobDescription = jobDescription,
                            //VisasPossible = Boolean.Parse((string)item.h1b) ? "h1b" : null,
                            //Intern = Boolean.Parse((string)item.intern) ? true : (bool?)null,
                            CanTelecommute = Boolean.Parse((string)item.remote) ? true : (bool?)null,
                            SourceReference = item.url,
                            ContactName = item.user,
                            JobEmail = emails,
                            SourcePostedDate = date,
                            HiringCompanyWebsite = website,
                            HiringCompany = companyName,
                            //Lat = item.lat,
                            //Lon = item.lon
                        });
                    }
                }
            }
            return list;
        }

        private static string TryParseJobTitle(string jobDescription)
        {
          
            string jobTitle = null;

            if(!string.IsNullOrEmpty(jobDescription))
            {
               
                    var i = jobDescription.IndexOf("<p>");
                    if (i < 0)
                    {
                        i = jobDescription.IndexOf("---");
                    }
                    if (i < 0)
                    {
                        i = jobDescription.IndexOf("<a");
                        if( i < 0)
                         i = jobDescription.IndexOf("< a href");
                    }

                    if (i > 3)
                        jobTitle = jobDescription.Substring(0, i);
            }

            int maxLength = 256;
            return !string.IsNullOrEmpty(jobTitle) && jobTitle.Length > maxLength ? jobTitle.Substring(0, maxLength) : jobTitle;
        }

        private static string TryParseJobDescription(string html)
        {
           html = html.Replace("<font color=\"#000000\">", string.Empty)
               .Replace("<font color=\"#88888\">", string.Empty)
               .Replace("<font color=\"#5a5a5a\">", string.Empty)
               .Replace("</font>", string.Empty);

           return html;
        }

        private static string TryParseCompany(string emails)
        {
            string company = null;
            var website = TryParseWebsite(emails);

            if(!string.IsNullOrEmpty(website))
            {
                var i = website.LastIndexOf(".");
                company = website.Substring(0, i);
            }
            return company;
        }

        private static string TryParseWebsite(string emails)
        {
            string website = null;

            foreach (var item in emails.Split(new char[] {' '}, StringSplitOptions.RemoveEmptyEntries))
            {
                var host = item.Split('@')[1];
                if (!host.StartsWith("gmail", StringComparison.InvariantCultureIgnoreCase))
                {
                    website = host;
                    break;
                }
            }
            return website;
        }

        private static string TryParseEmails(string html)
        {
            //instantiate with this pattern 
            Regex emailRegex = new Regex(@"\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*",
                RegexOptions.IgnoreCase);
            //find items that matches with our pattern
            MatchCollection emailMatches = emailRegex.Matches(html);

            string emails = string.Empty;

            foreach (Match emailMatch in emailMatches)
            {
                if (!string.IsNullOrEmpty(emails))
                    emails += " ";

                emails += emailMatch.Value;
            }
            return emails;
        }
    }
}
