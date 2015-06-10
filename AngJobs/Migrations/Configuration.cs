namespace AngJobs.Migrations
{
    using AngJobs.Models;
    using System;
    using System.Collections.Generic;
    using System.Data.Entity;
    using System.Data.Entity.Migrations;
    using System.Linq;
    using AngJobs.Helper;
    using System.IO;
    using System.Web;
    using System.Reflection;
    using System.Web.Hosting;

    internal sealed class Configuration : DbMigrationsConfiguration<AngJobs.Models.DBContext>
    {
        public Configuration()
        {
            AutomaticMigrationsEnabled = false;
        }

        protected override void Seed(AngJobs.Models.DBContext context)
        {
            //  This method will be called after migrating to the latest version.

            //  You can use the DbSet<T>.AddOrUpdate() helper extension method 
            //  to avoid creating duplicate seed data. E.g.
            //
            //    context.People.AddOrUpdate(
            //      p => p.FullName,
            //      new Person { FullName = "Andrew Peters" },
            //      new Person { FullName = "Brice Lambson" },
            //      new Person { FullName = "Rowan Miller" }
            //    );


            if (context.Clients.Count() == 0)
            {
                context.Clients.AddRange(BuildClientsList());
            }

            var recruitersSeedFile = MapPath("~/App_Data/recruiters.json");
            if (File.Exists(recruitersSeedFile))
                using (var streamReader = new StreamReader(recruitersSeedFile))
                {
                    string content = streamReader.ReadToEnd();
                    var list = Newtonsoft.Json.JsonConvert.DeserializeObject<List<string>>(content);
                    context.recruiters.AddOrUpdate(
                        r => r.Website,
                           list.Select(l => new Recruiter { Website = l }).ToArray()
                        );
                }

            //Make sure we have a variety of job types

            EnsureJobTypes(context);
        }

        private static void EnsureJobTypes(AngJobs.Models.DBContext context)
        {
            const string permanent = "permanent";
            const string contract = "contract";
            var perm = context.jobPosts.FirstOrDefault(jp => jp.JobType.Equals(permanent, StringComparison.InvariantCultureIgnoreCase));
            var contr = context.jobPosts.FirstOrDefault(jp => jp.JobType.Equals(contract, StringComparison.InvariantCultureIgnoreCase));

            if (perm == null)
            {
                var p = context.jobPosts.FirstOrDefault();
                p.JobType = permanent;
                context.SaveChanges();
            }
            if (contr == null)
            {
                var c = context.jobPosts.OrderBy(j=>j.Ip).FirstOrDefault();
                c.JobType = contract;
                context.SaveChanges();
            }
        }


        private string MapPath(string seedFile)
        {
            if (HttpContext.Current != null)
                return HostingEnvironment.MapPath(seedFile);

            var absolutePath = new Uri(Assembly.GetExecutingAssembly().CodeBase).AbsolutePath;
            var directoryName = Path.GetDirectoryName(absolutePath);
            var path = Path.Combine(directoryName, ".." + seedFile.TrimStart('~').Replace('/', '\\'));

            return path;
        }

        private static List<Client> BuildClientsList()
        {
            List<Client> ClientsList = new List<Client> 
            {
                new Client
                { Id = "angjobsApp", 
                    Secret= Helper.GetHash("angjobsSecret"), 
                    Name="AngJobs web app", 
                    ApplicationType =  Models.ApplicationTypes.JavaScript, 
                    Active = true, 
                    RefreshTokenLifeTime = 7200, 

                    AllowedOrigin =
                                        #if DEBUG
                                         "http://localhost:33651"
                                        #else
                                          "https://angjobs.com"
                                        #endif
                },
                new Client
                { Id = "angjobsMobileApp", 
                    Secret=Helper.GetHash("angjobsSecret."), 
                    Name="AngJobs Mobile App", 
                    ApplicationType =Models.ApplicationTypes.NativeConfidential, 
                    Active = true, 
                    RefreshTokenLifeTime = 14400, 
                    AllowedOrigin = "*"
                }
            };

            return ClientsList;
        }
    }
}
