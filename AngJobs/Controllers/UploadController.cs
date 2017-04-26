using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using Microsoft.AspNetCore.Hosting;

namespace AngJobs.Controllers
{
    [Produces("application/json")]
    [Route("api/Upload")]
    public class UploadController : Controller
    {
        private readonly IHostingEnvironment _hostingEnvironment;

        public UploadController(IHostingEnvironment hostingEnvironment)
        {
            _hostingEnvironment = hostingEnvironment;
        }

        [HttpPost]
        public async Task<ActionResult> Post(IFormFile file)
        {
            try
            {
                if (file != null && file.Length > 0)
                {
                    var savePath = Path.Combine(_hostingEnvironment.ContentRootPath, @"data\uploads", file.FileName);

                    using (var fileStream = new FileStream(savePath, FileMode.Create))
                    {
                        await file.CopyToAsync(fileStream);
                    }

                    return Created(savePath, file);
                }
                return BadRequest();
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }

        }
    }
}