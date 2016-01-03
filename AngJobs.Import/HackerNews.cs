using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;

namespace AngJobs.Import
{
    public class HackerNews
    {
        public const string apiUrl = "https://hacker-news.firebaseio.com/v0/item/{0}.json?print=pretty";

        public FileInfo destFile = null;

        /// <summary>
        /// returns the file path that contains freelancers
        /// </summary>
        /// <returns></returns>
        public async Task GetAngularFreelancers()
        {
            int? postId = GetPostId();
            if (!postId.HasValue)
                return;
             
            string endpoint = string.Format(apiUrl, postId);
            var webClient = new WebClient();
            string content = webClient.DownloadString(endpoint);
            var comments = ((JObject)Newtonsoft.Json.JsonConvert.DeserializeObject(content))["kids"];
            var title = ((JObject)Newtonsoft.Json.JsonConvert.DeserializeObject(content))["title"];

            var fileName = GenerateDestFileName(title);
            destFile = new FileInfo(fileName);
            if (!destFile.Exists)
            {
                var sw = destFile.CreateText();
                sw.Close();

            }

            foreach (var item in comments)
            {
               // await WriteTextAsync(destFile.FullName, ",\r\n");
                await ExtractAndSaveFreelancer(item, destFile);
            }
        }

        private string GenerateDestFileName(JToken title)
        {
            string destFile = title.ToString();
            var index1 = destFile.IndexOf('(');
            var index2 = destFile.IndexOf(')', index1);

            destFile = destFile.Substring(index1 + 1, index2 - index1-1);

            return destFile.Replace(" ", string.Empty) + ".json";
        }

        private async Task ExtractAndSaveFreelancer(JToken item, FileInfo destFile)
        {
            var postId = item.ToString();

            string endpoint = String.Format(apiUrl, postId);
            var webClient = new WebClient();
            var content = await webClient.DownloadStringTaskAsync(new Uri(endpoint));
            ProcessHNPost(content);
        }

        private async void ProcessHNPost(string content)
        {

            var text = ((JObject)Newtonsoft.Json.JsonConvert.DeserializeObject(content))["text"];
            var by = ((JObject)Newtonsoft.Json.JsonConvert.DeserializeObject(content))["by"];
            var time = ((JObject)Newtonsoft.Json.JsonConvert.DeserializeObject(content))["time"];

            //todo save to file
            if (destFile != null && destFile.Exists)
            {
                await WriteTextAsync(destFile.FullName, JObject.FromObject(new { by = by, text = text, time = time }).ToString()+ ",\r\n");
            }
        }

        private static int? GetPostId()
        {
            int? id = null;
            string filePath = "hn-links.txt";
            string postIdFormat = "id=";
            // Read the hn-links.txt file, take the first line(link) to parse

            IEnumerable<string> lines = File.ReadLines(filePath);
            if (lines.Any())
            {
                var line = lines.First();
                var str = line.Substring(line.IndexOf(postIdFormat) + postIdFormat.Length);
                int res = -1;
                if (int.TryParse(str, out res))
                    id = res;
            }

            return id;
        }

        private async Task WriteTextAsync(string filePath, string text)
        {
            byte[] encodedText = Encoding.Unicode.GetBytes(text);
        
            using (var sourceStream = new FileStream(filePath,
                FileMode.Append, FileAccess.Write, FileShare.ReadWrite,
                bufferSize: 4096, useAsync: true))
            {
                await sourceStream.WriteAsync(encodedText, 0, encodedText.Length);
            };
        }
    }
}
