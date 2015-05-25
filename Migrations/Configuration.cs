namespace AngJobs.Migrations
{
    using AngJobs.Models;
    using System;
    using System.Data.Entity;
    using System.Data.Entity.Migrations;
    using System.Linq;

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


            context.jobPosts.AddOrUpdate(
              p => p.JobTitle,
              new JobPost { JobTitle = "Senior Front End/JavaScript Developer - £60k - ReactJS",
                            JobDescription="My customer started his business when he was 15 from home and it has since become the world leader in their field. Still running the company from the top and with a recent investment from one of the worlds largest .coms he is looking to expand the business even further and is so doubling the team his London based team.",
                            IsOnFrontPage=true
              },
              new JobPost { JobTitle = "UI Developer - AngularJS - Javascript - JQuery HTML5 - CSS3 - Typescript - ASP.NET - Warrington",
                            JobDescription = "UI Developer with AngularJS, JavaScript, JQuery, HTML5, CSS3, experience is sought for six month contract in Warrington. Typescript and ASP.NET experience is desired but not essential.",
                            IsOnFrontPage = true
              },
              new JobPost { JobTitle = "Technical Lead - Startup - London",
                            JobDescription = "Full Stack Technical Lead - Startup - London - £75000 - 95000 per annum, + Equity",

              }
            );
        }
    }
}
