using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.IO;

namespace AngJobs
{
    public static class Helpers
    {
        public static JArray LoadJson()
        {
            object data = null;
            using (StreamReader r = File.OpenText("./data/jobs.json"))
            {
                string json = r.ReadToEnd();
                data = JsonConvert.DeserializeObject(json);
            }
            return JArray.FromObject(data);
        }
    }
}
