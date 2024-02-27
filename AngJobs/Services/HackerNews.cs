using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace AngJobs.Services;
using System.Text.Json;
using System.Dynamic;

public class HackerNews
{
    private const string sinceDate = "1675209600"; //feb2023

    private const string hnQueryUrl =
        $"https://hn.algolia.com/api/v1/search_by_date?&tags=ask_hn,author_whoishiring&query=%22who%20is%20hiring?%22&numericFilters=created_at_i%3E{sinceDate}";
   

    public static async Task<ExpandoObject> GetWhoIsHiring()
    {
        string jsonText = string.Empty;
        using (var httpClient = new HttpClient())
        {
             jsonText =  await httpClient.GetStringAsync(hnQueryUrl); 
        }
        return JsonSerializer.Deserialize<ExpandoObject>(jsonText);
    }
}