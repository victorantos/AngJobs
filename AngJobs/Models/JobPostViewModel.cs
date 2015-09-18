using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Angjobs.Models
{
    public class JobPostViewModel
    {
        public JobPostViewModel()
        {
        }
        public JobPostViewModel(JobPost entity)
        {
            var stackOverflow = "StackOverflow";
            string sr =  null;
            const string hn = "hn";
            if (entity.RecruiterName == stackOverflow)
                sr = entity.SourceReference;
            
            if (!string.IsNullOrEmpty(entity.SourceReference) && entity.SourceReference.Contains("news.ycomb"))
                sr = hn;

                id = entity.Id;
                jobTitle = entity.JobTitle;
                jobType = entity.JobType;
                jobDescription = entity.JobDescription;
                jobLocation = entity.Location;
                jobCountry = entity.Country;
                hiringCompany = entity.HiringCompany;
                hiringCompanyWebsite = entity.HiringCompanyWebsite;
                hiringCompanyLogo = entity.HiringCompanyLogo;
                tagline = entity.Tagline;
                salaryMin = entity.SalaryMin;
                salaryMax = entity.SalaryMax;
                salaryType = entity.SalaryType;
                currency = entity.Currency;
                salaryNote = entity.SalaryNote;
                expiresOn = entity.ExpiresOn;
                dateCreated = entity.SourcePostedDate ?? entity.DateCreated;
                datePosted = entity.SourcePostedDate;
                sourceReference =sr;
                if(sr == hn)
                {
                    srUrl = entity.SourceReference;
                }
                recruiterName = entity.RecruiterName != stackOverflow ? entity.RecruiterName : null;
                contactName = entity.ContactName;
                priority = string.IsNullOrEmpty(entity.Ip) ? (int?)null : 1;
                isHot = entity.IsHot;
        }

        public int id { get; set; }
        [Required(ErrorMessage = "The Job Title is Required.")]
        public string jobTitle { get; set; }
        public string jobType { get; set; }
        public string jobDescription { get; set; }
        public string shortDescription { get; set; }
        public string jobLocation { get; set; }
        public string jobCountry { get; set; }
        public string jobEmail { get; set; }
        public string hiringCompany { get; set; }
        public string hiringCompanyWebsite { get; set; }
        public string hiringCompanyLogo { get; set; }
        public string sourceReference { get; set; }
        // source ref URL
        public string srUrl { get; set; }
        public string recruiterName { get; set; }
        public string contactName { get; set; }
        public string tagline { get; set; }
        public int salaryMin { get; set; }
        public int salaryMax { get; set; }
        public string salaryType { get; set; }
        public CurrencyType currency { get; set; }
        public string salaryNote { get; set; }
        public DateTime? expiresOn { get; set; }
        public DateTime? dateCreated { get; set; }
        public DateTime? datePosted { get; set; }
        public int? priority { get; set; }
        public bool? isHot { get; set; }

        public JobPost ToEntity()
        {
            return new JobPost
            {
                JobTitle = jobTitle,
                JobType = jobType,
                JobDescription = jobDescription,
                Location = Helpers.UppercaseFirst(jobLocation),
                Country = jobCountry,
                JobEmail = jobEmail,
                HiringCompany = hiringCompany,
                HiringCompanyWebsite = Helpers.EnsureValidUrl(hiringCompanyWebsite),
                Tagline = tagline,
                SalaryMin = salaryMin,
                SalaryMax = salaryMax,
                SalaryType = salaryType,
                Currency = currency,
                ExpiresOn = expiresOn,
                Ip = HttpContext.Current.Request.UserHostAddress
            };
        }

        public string GetSalary()
        {
            var salary = "";
            var salaryMin = this.salaryMin;
            var salaryMax = this.salaryMax;
            var currencyCode = getCurrencyCode(this.currency);

            if (salaryMax != 0 && salaryMin != 0)
                salary += salaryMin + " - " + currencyCode + salaryMax;
            else
            {
                if (salaryMin != 0)
                    salary += salaryMin;
                if (salaryMax != 0)
                    salary += salaryMax;
            }
            if (!string.IsNullOrEmpty(this.salaryType))
                salary += " per " + this.salaryType;

            if (!string.IsNullOrEmpty(salary))
                salary.Insert(0, currencyCode);
            return salary;
        }

        private string getCurrencyCode(CurrencyType currencyType)
        {
            string code = "£";
            switch (currencyType)
            {
                case CurrencyType.Pound:
                    code = "£";
                    break;
                case CurrencyType.Euro:
                    code = "euro";
                    break;
                case CurrencyType.Usd:
                    code = "$";
                    break;
                default:
                    break;
            }
            return code;
        }
    }
}