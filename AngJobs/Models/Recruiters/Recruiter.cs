using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace AngJobs.Models
{
    public class Recruiter
    {
        public Recruiter()
        {
            this.DateAdded = DateTime.UtcNow;
        }

        public int Id { get; set; }

        [MaxLength(256)]
        public string Website { get; set; }

        public DateTime DateAdded { get; set; }
    }
}