using Angjobs.Models;
using System;
using System.Collections.Generic;
using Microsoft.AspNet.Identity.Owin;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using System.Threading.Tasks;
using System.Collections.Specialized;
using System.Web;
using System.Web.Http.Description;
using System.IO;
using System.Collections;
using System.Globalization;
using Newtonsoft.Json.Linq;

namespace Angjobs.Controllers
{
    [ApiExplorerSettings(IgnoreApi = true)]
    public class EmployerController : ApiBaseController
    {
        [HttpGet]
        public HttpResponseMessage GetSeekingWork()
        {
            IEnumerable<object> freelancers = null;
            const string fileNameFormat = "MMMMyyyy";
            var seekingWorkFolder = new DirectoryInfo(HttpContext.Current.Server.MapPath("~/App_Data/SeekingWork/"));
            string seekingWorkFileName = DateTime.UtcNow.ToString(fileNameFormat, CultureInfo.InvariantCulture) + ".json";
            string prevSeekingWorkFileName = DateTime.UtcNow.AddMonths(-1).ToString(fileNameFormat, CultureInfo.InvariantCulture) + ".json";

            var seekingWorkFilePath = Path.Combine(seekingWorkFolder.FullName, seekingWorkFileName);

            if (!File.Exists(seekingWorkFilePath))
                seekingWorkFilePath = Path.Combine(seekingWorkFolder.FullName, prevSeekingWorkFileName);

            if (File.Exists(seekingWorkFilePath))
            {
                var content = File.ReadAllText(seekingWorkFilePath);
                dynamic jObj = (JArray)Newtonsoft.Json.JsonConvert.DeserializeObject(content);
                freelancers = ParseSeekWorkFile(jObj);
            }

            return Request.CreateResponse<object>(HttpStatusCode.OK, freelancers == null ? new string[0] : freelancers);
        }

        private IEnumerable<object> ParseSeekWorkFile(dynamic jObj)
        {
            foreach (var item in jObj)
            {
                yield return new
                {
                    by = item["by"],
                    text = item["text"],
                    time = item["time"]
                };
            }
        } 
    }
}
