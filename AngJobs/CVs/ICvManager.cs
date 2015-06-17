using Angjobs.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
 

namespace AngJobs.CVs
{
    public interface ICvManager
    {
        Task<IEnumerable<CvViewModel>> Get();
        Task<CvActionResult> Delete(string fileName);
        Task<IEnumerable<CvViewModel>> Add(HttpRequestMessage request);
        bool FileExists(string fileName);
    }
}
