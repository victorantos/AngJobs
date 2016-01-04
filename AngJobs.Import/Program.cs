using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AngJobs.Import
{
    class Program
    {
        static void Main(string[] args)
        {
            var hn = new HackerNews();

            Task.WaitAll(hn.GetAngularFreelancers());

        }
    }
}
