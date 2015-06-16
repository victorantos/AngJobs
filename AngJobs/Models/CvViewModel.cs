using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Angjobs.Models
{
    public class CvViewModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public DateTime Created { get; set; }
        public DateTime Modified { get; set; }
        public long Size { get; set; }
    }
}