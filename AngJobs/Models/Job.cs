using System.Collections.Generic;
using System.Linq;
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
        dynamic posts = await HackerNews.GetWhoIsHiring();

        var d = posts[3].hits;
        var jobs = new List<Job>();
        
        // foreach (var post in posts)
        // {
        //   jobs.Add(new Job(post.title, post.Text));
        // }

        return jobs;
    }
}