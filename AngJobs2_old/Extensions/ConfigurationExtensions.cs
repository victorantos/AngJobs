using Microsoft.Extensions.Configuration;

namespace AngJobs
{
    public static class ConfigurationExtensions
    {
        /// <summary>
        /// Shorthand for GetSection("ConnectionStrings")[name].
        /// </summary>
        /// <param name="configuration">The configuration.</param>
        /// <param name="name">The connection string key.</param>
        /// <returns></returns>
        public static string GetJobsApiUrls(this IConfiguration configuration, string name)
        {
            return configuration?.GetSection("JobsApiUrls")?[name];
        }
    }

}