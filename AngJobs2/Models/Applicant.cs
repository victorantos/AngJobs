using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AngJobs.Models
{
    public class Applicant
    {
        public Applicant()
        {
            this.DateCreated = DateTime.UtcNow;
        }
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Resume { get; set; }

        public string Ip { get; set; }

        public DateTime DateCreated { get; set; }
    }
}
