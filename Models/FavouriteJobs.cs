using System;
using System.Collections.Generic;
namespace AngJobs.Models
{
    public class FavouriteJobs
    {
        public Guid Id{ get; set; }
        public List<int> JobIds = new List<int>();
    }
}
