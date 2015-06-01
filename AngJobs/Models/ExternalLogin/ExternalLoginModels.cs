using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace AngJobs.Models
{
    public class ExternalLoginViewModel
    {
        public string Name { get; set; }

        public string Url { get; set; }

        public string State { get; set; }
    }

    public class RegisterExternalBindingModel
    {
        [Required]
        public string UserName { get; set; }

        public string Email { get; set; }

        [Required]
        public string Provider { get; set; }

        [Required]
        public string ExternalAccessToken { get; set; }

    }

    public class ParsedExternalAccessToken
    {
        public string user_id { get; set; }
        public string app_id { get; set; }
        public string email { get; set; }

        public UserProfile userProfile { get; set; }
        //public GitHubUserProfile githubUserProfile { get;set;}
        //public TwitterUserProfile twitterUserProfile { get; set; }
        //public StackExchangeUserProfile stackexchangeUserProfile { get; set; }
    }
}