using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Web;

namespace AngJobs.CVs
{
    public class CvMultipartFormDataStreamProvider : MultipartFormDataStreamProvider
    {
    
        public CvMultipartFormDataStreamProvider(string path) : base(path)    
        {
        }

        //below only allows images and pdf files to be uploaded.
        public override Stream GetStream(System.Net.Http.HttpContent parent, System.Net.Http.Headers.HttpContentHeaders headers)
        {

            // following line handles other form fields other than files.
            if (String.IsNullOrEmpty(headers.ContentDisposition.FileName)) return base.GetStream(parent, headers);

            // restrict what filetypes can be uploaded
            List<string> extensions = new List<string> { "png", "gif", 
                "jpg", "jpeg", "tiff", "pdf", "tif", "bmp","doc","docx","ods","xls","odt","csv","txt","rtf" };
            var filename = headers.ContentDisposition.FileName.Replace("\"", string.Empty); // correct for chrome.

            //make sure it has an extension
            if (filename.IndexOf('.') < 0)
            {
                return Stream.Null;
            }

            //get the extension
            var extension = filename.Split('.').Last();

            //Return stream if match otherwise return null stream.
            return extensions.Contains(extension) ? base.GetStream(parent, headers) : Stream.Null;

        }

        public override string GetLocalFileName(System.Net.Http.Headers.HttpContentHeaders headers)
        {
            //Make the file name URL safe and then use it & is the only disallowed url character allowed in a windows filename
            var name = !string.IsNullOrWhiteSpace(headers.ContentDisposition.FileName) ? headers.ContentDisposition.FileName : "NoName";
            return name.Trim(new char[] { '"' })
                        .Replace("&", "and");                        
        }
    }
}