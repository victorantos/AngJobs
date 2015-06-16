using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Angjobs.Models 
{
    public class CV
    {
        public CV()
        {
            this.DateCreated = DateTime.UtcNow;
            this.Guid = Guid.NewGuid();
        }
        public int Id { get; set; }
        public string Name { get; set; }
        public DateTime Created { get; set; }
        public DateTime Modified { get; set; }
        public long Size { get; set; }

        [MaxLength(64)]
        public string CreatedBy { get; set; }
        public DateTime DateCreated { get; set; }
        public Guid Guid { get; set; }
    }
}
