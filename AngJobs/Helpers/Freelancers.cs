using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Web;

namespace Angjobs.Helpers
{
    public static class Freelancers
    {
        public static IEnumerable<ExpandoObject> GetFreelancers()
        {
            IEnumerable<ExpandoObject> freelancers = null;
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

            return freelancers;
        }

        private static IEnumerable<ExpandoObject> ParseSeekWorkFile(dynamic jObj)
        {
            foreach (var item in jObj)
            {
                yield return new
                {
                    by = item["by"],
                    text = item["text"],
                    time = item["time"]
                }.ToExpando();
            }
        }
    }
}