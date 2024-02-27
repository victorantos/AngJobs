using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using AngJobs.Services;


namespace AngJobs.Models;

public class Job(string title, string description)
{
     
    public string Title { get; set; } = title;
    public string Description { get; set; } = description;

    public static async Task<IEnumerable<Job>> SearchAsync(string searchTerm)
    {
        dynamic json = await HackerNews.GetWhoIsHiring().ConfigureAwait(false);

        dynamic hits = json.hits;
        List<ExpandoObject> posts = JsonSerializer.Deserialize<List<ExpandoObject>>(hits);
        var jobs = new List<Job>();

        foreach (var t in posts)
        {
            jobs.Add(new Job(((dynamic)t).title.ToString(), (string)((dynamic)t).story_text.ToString()));
        }
        
            
        

        return jobs;
    }
}