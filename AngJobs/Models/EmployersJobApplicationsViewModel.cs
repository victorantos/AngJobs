using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Angjobs.Models
{
    public class EmployersJobApplicationsViewModel
    {
        public EmployersJobApplicationsViewModel()
        {
        }
        public EmployersJobApplicationsViewModel(JobApplication entity)
        { 
                id = entity.Id;
                // currently it includes both name and email
                applicant = entity.ApplicantEmail;
                dateCreated = entity.DateCreated;
                jobTitle = entity.JobPost.JobTitle;
                salaryNote = entity.JobPost.SalaryNote;
                jobPostId = entity.JobPost.Id;
        }

        public int id { get; set; }
        public string applicant { get; set; }
        public string jobTitle { get; set; }
        public string salaryNote { get; set; }
        public int jobPostId { get; set; }
        public DateTime? dateCreated { get; set; }
    }
}
