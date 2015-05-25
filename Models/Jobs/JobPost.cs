using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;

namespace AngJobs.Models
{
    public class JobPost
    {
        public JobPost()
        {
            this.DateCreated = DateTime.UtcNow;
        }

        public int Id { get; set; }
        public string JobTitle { get; set; }
        public string JobDescription { get; set; }
        public bool? IsDeleted { get; set; }
        [MaxLength(256)]
        public string CreatedBy { get; set; }
        [MaxLength(20)]
        public string Ip { get; set; }
        public DateTime DateCreated { get; set; }
    }
}
