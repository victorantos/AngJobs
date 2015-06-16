using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Angjobs.Models
{
    public class JobPost
    {
        public JobPost()
        {
            this.DateCreated = DateTime.UtcNow;
        }

        public int Id { get; set; }
        [MaxLength(256)]
        public string JobTitle { get; set; }
        [MaxLength(128)]
        public string JobType { get; set; }

        [MaxLength(256)]
        public string JobDuration { get; set; }
        [MaxLength(256)]
        public string JobStart { get; set; }
        public string JobDescription { get; set; }
        public string JobShortDescription { get; set; }
        [MaxLength(256)]
        public string JobEmail { get; set; }
        [MaxLength(256)]
        public string Location { get; set; }
        [MaxLength(256)]
        public string Country { get; set; }
        [MaxLength(256)]
        public string HiringCompany { get; set; }
        [MaxLength(256)]
        public string Tagline { get; set; }
        [MaxLength(256)]
        public string HiringCompanyWebsite { get; set; }

        [MaxLength(256)]
        public string HiringCompanyLogo { get; set; }
        [MaxLength(256)]
        public string ContactName { get; set; }
        [MaxLength(256)]
        public string RecruiterName { get; set; }
        [MaxLength(64)]
        public string Fax { get; set; }
        [MaxLength(64)]
        public string Tel { get; set; }

        public int SalaryMin { get; set; }
        public int SalaryMax { get; set; }
        [MaxLength(64)]
        public string SalaryType { get; set; }
        public CurrencyType Currency { get; set; }

        [MaxLength(512)]
        public string SalaryNote { get; set; }

        public bool? CanTelecommute { get; set; }
        public bool? IsHot { get; set; }
        public DateTime? ExpiresOn { get; set; }

        public bool? IsDeleted { get; set; }
        public string CreatedBy { get; set; }
        public string Ip { get; set; }
        public DateTime DateCreated { get; set; }
        [MaxLength(32)]
        public string VisasPossible { get; set; }
        public bool? Intern { get; set; }

        public decimal? Lat { get; set; }
        public decimal? Lon { get; set; } 

        [MaxLength(512)]
        public string SourceReference { get; set; }
        public DateTime? SourcePostedDate { get; set; }

        public virtual Models.User Owner { get; set; }
    }
}