using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Net.Http;
using System.IO;
using Angjobs.Models;

namespace AngJobs.CVs
{
    public class LocalCvManager : ICvManager
    {
        private string workingFolder { get; set; }

        public LocalCvManager()
        {
        }

        public LocalCvManager(string workingFolder)
        {
            this.workingFolder = workingFolder;
            CheckTargetDirectory();
        }

        public async Task<IEnumerable<CvViewModel>> Get()
        {
            List<CvViewModel> cvs = new List<CvViewModel>();

            DirectoryInfo photoFolder = new DirectoryInfo(this.workingFolder);
            var db = new DBContext();
            var cvList = new List<CvViewModel>();

            await Task.Factory.StartNew(() =>
            {
                cvs = photoFolder.EnumerateFiles()
                                            .Where(fi => new[] { ".doc", ".pdf", ".docx", ".txt", ".rtf", ".odt" }.Contains(fi.Extension.ToLower()))
                                            .Select(fi => new CvViewModel
                                            {
                                                Name = fi.Name,                                                
                                                Created = fi.CreationTime,
                                                Modified = fi.LastWriteTime,
                                                Size = fi.Length / 1024
                                            })
                                            .ToList();
               
                foreach (var item in cvs)
	            {
                    // TODO check if Resume is deleted
                    var resume = db.CVs.FirstOrDefault(f => f.Name.Equals(item.Name, StringComparison.InvariantCultureIgnoreCase));
                    if (resume!= null)
                    {
                        item.Id = resume.Guid;
                        cvList.Add(item);
                    }
	            }
            });

            return cvList;
        }

        public async Task<CvActionResult> Delete(string fileName)
        {                         
            try
            {
                var filePath = Directory.GetFiles(this.workingFolder, fileName)
                                .FirstOrDefault();

                await Task.Factory.StartNew(() =>
                {
                    File.Delete(filePath);
                });

                return new CvActionResult { Successful = true, Message = fileName + "deleted successfully" };
            }
            catch (Exception ex)
            {
                return new CvActionResult { Successful = false, Message = "error deleting fileName " + ex.GetBaseException().Message };
            }            
        }

        public async Task<IEnumerable<CvViewModel>> Add(HttpRequestMessage request)
        {
            var provider = new CvMultipartFormDataStreamProvider(this.workingFolder);
            
            await request.Content.ReadAsMultipartAsync(provider);
   
            var cvs = new List<CvViewModel>();
            var db = new DBContext();
            foreach(var file in provider.FileData)
            {
                var fileInfo = new FileInfo(file.LocalFileName);

                var cv = new CV
                {
                    Name = fileInfo.Name,
                    Created = fileInfo.CreationTime,
                    Modified = fileInfo.LastWriteTime,
                    Size = fileInfo.Length / 1024
                };
                db.CVs.Add(cv);
               
                db.SaveChanges();

                cvs.Add(new CvViewModel
                {
                    Id = cv.Guid,
                    Name = fileInfo.Name,
                    Created = fileInfo.CreationTime,
                    Modified = fileInfo.LastWriteTime,
                    Size = fileInfo.Length /1024
                });
            }

            return cvs;            
        }

        public bool FileExists(string fileName)
        {
            var file = Directory.GetFiles(this.workingFolder, fileName)
                                .FirstOrDefault();

            return file != null;
        }

        private void CheckTargetDirectory()
        {            
            if (!Directory.Exists(this.workingFolder))
            {
                throw new ArgumentException("the destination path " + this.workingFolder + " could not be found");
            }
        }
    }
}