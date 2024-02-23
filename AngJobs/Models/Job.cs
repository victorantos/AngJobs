using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using HackerNews.Reader;

namespace AngJobs.Models;

public class Job(string title, string description)
{
    private static HackerNews.Reader.PostReader s_PostReader= new();
    
    public string Title { get; set; } = title;
    public string Description { get; set; } = description;

    public static IEnumerable<Job> SearchAsync(string searchTerm)
    {
        CancellationToken token = new CancellationToken();
        var query =  s_PostReader.GetTopJobs(token);

        foreach (var post in query)
        {
            yield return new Job(post.Title, post.Text);
        }
    }
}