using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Web;

namespace Angjobs.Models
{
    public class JobApplication
    {
        public JobApplication()
        {
            this.DateCreated = DateTime.UtcNow;
        }

        public int Id { get; set; }
        public string ApplicantEmail { get; set; }
        public string ApplicantSkills { get; set; }
        public string ApplicantExperience { get; set; }
        public string ApplicantMessage { get; set; }
       
        public bool? IsDeleted { get; set; }
        public string CreatedBy { get; set; }
        public string Ip { get; set; }
        public DateTime DateCreated { get; set; } 
        public DateTime? DateSent { get; set; }

        [JsonIgnore] 
        [IgnoreDataMember] 
        public virtual User User { get; set; }
        [JsonIgnore]
        [IgnoreDataMember] 
        public virtual JobPost JobPost { get; set; }

        [JsonIgnore]
        [IgnoreDataMember]
        public virtual CV CV { get; set; }
    }
}