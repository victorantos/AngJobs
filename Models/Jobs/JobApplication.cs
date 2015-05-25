using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;

namespace AngJobs.Models
{
    public class JobApplication
    {
        public JobApplication()
        {
            this.DateCreated = DateTime.UtcNow;
        }

        public int Id { get; set; }
        [MaxLength(256)]
        public string ApplicantEmail { get; set; }

        public string ApplicantMessage { get; set; }
        public bool? IsDeleted { get; set; }
        [MaxLength(256)]
        public string CreatedBy { get; set; }
        [MaxLength(20)]
        public string Ip { get; set; }
        public DateTime DateCreated { get; set; }

        public virtual JobPost JobPost { get; set; }
    }
}
