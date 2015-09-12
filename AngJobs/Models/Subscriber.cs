using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;

namespace Angjobs.Models
{
    public class Subscriber
    {
        public Subscriber()
        {
            this.DateCreated = DateTime.UtcNow;
        }

        public int Id { get;set; }
        [MaxLength(256)]
        [Required] 
        public string Email { get; set; }
        [MaxLength(256)]
        public string Reason { get; set; }

        public DateTime DateCreated { get; set; }

        [MaxLength(32)]
        public string Ip { get; set; }
    }
}
