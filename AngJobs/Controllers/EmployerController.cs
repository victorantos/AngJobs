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
            //TODO move it to helper and uset for GBOT
            IEnumerable<object> freelancers = Helpers.Freelancers.GetFreelancers();

            return Request.CreateResponse<object>(HttpStatusCode.OK, freelancers == null ? new string[0] : freelancers);
        }

    }
}
