using AngJobs.CVs;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using System.Web.Http.Description;

namespace Angjobs.Controllers
{
    [ApiExplorerSettings(IgnoreApi = true)]
    [RoutePrefix("api/Cv")]
    public class CvController : ApiController
    {
        private ICvManager cvManager;

        public CvController()
            : this(new LocalCvManager(HttpRuntime.AppDomainAppPath + @"\App_Data\CV"))
        {
        }

        public CvController(ICvManager cvManager)
        {
            this.cvManager = cvManager;
        }

        // GET: api/Cv 
        public async Task<IHttpActionResult> Get()
        {
            var results = await cvManager.Get();
            return Ok(new { cvs = results });
        }

        // POST: api/Cv 
        public async Task<IHttpActionResult> Post()
        {
            // Check if the request contains multipart/form-data. 
            if (!Request.Content.IsMimeMultipartContent("form-data"))
            {
                return BadRequest("Unsupported media type");
            }

            try
            {
                var cvs = await cvManager.Add(Request);
                return Ok(new { Message = "Cvs uploaded ok", Cvs = cvs });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.GetBaseException().Message);
            }

        }
    }
}
