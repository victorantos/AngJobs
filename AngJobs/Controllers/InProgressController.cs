using Angjobs.Models;
using Angjobs.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Description;

namespace Angjobs.Controllers
{
    [ApiExplorerSettings(IgnoreApi = true)]
    public class InProgressController : ApiController
    {
        [HttpPost]
        public async Task<HttpResponseMessage> Save(Subscriber subscriber)
        {
            var util = new RegexUtilities();

            if (util.IsValidEmail(subscriber.Email))
            {
                var db = new DBContext();
                db.Subscribers.Add(new Subscriber
                {
                    Email = subscriber.Email,
                    Reason = "IT Consultants search",
                    Ip = Request.GetOwinContext().Request.RemoteIpAddress
                });
                await db.SaveChangesAsync();
                return Request.CreateResponse<object>(HttpStatusCode.OK, new { saved = true });
            }
            else
                return Request.CreateResponse<object>(HttpStatusCode.BadRequest, new { saved = false });
        }
    }
}
