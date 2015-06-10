using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Web;

using System.Data.Entity;
using System.Data.Entity.Migrations;
using System.IO;

namespace AngJobs.Models
{
    public class User : IdentityUser
    {
        public async Task<ClaimsIdentity> GenerateUserIdentityAsync(UserManager<User> manager, string authenticationType)
        {
            // Note the authenticationType must match the one defined in CookieAuthenticationOptions.AuthenticationType
            var userIdentity = await manager.CreateIdentityAsync(this, authenticationType);
            // Add custom user claims here
            return userIdentity;
        }

        public string firstName { get; set; }

        public virtual List<JobApplication> jobApplications { get; set; }
    }

    public class todoItem
    {
        [Key]
        public int id { get; set; }
        public string task { get; set; }
        public bool completed { get; set; }
    }

    public class DBContext : IdentityDbContext<User>
    {
        public DBContext()
            : base("DefaultConnection")
        {

        }
        //Override default table names
        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }

        public static DBContext Create()
        {
            return new DBContext();
        }

        public DbSet<JobApplication> jobApplications { get; set; }
        public DbSet<JobPost> jobPosts { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }

        public DbSet<Recruiter> recruiters{ get; set; }
    }

    //This function will ensure the database is created and seeded with any default data.
    public class DBInitializer : CreateDatabaseIfNotExists<DBContext>
    {
        protected override void Seed(DBContext context)
        {
            //Create an seed data you wish in the database.
            context.jobPosts.AddOrUpdate(
           p => p.JobTitle,
           new JobPost
           {
               JobTitle = "Senior Front End/JavaScript Developer - £60k - ReactJS",
               JobDescription = "My customer started his business when he was 15 from home and it has since become the world leader in their field. Still running the company from the top and with a recent investment from one of the worlds largest .coms he is looking to expand the business even further and is so doubling the team his London based team.",
               IsOnFrontPage = true,
               JobType = "permanent"
           },
           new JobPost
           {
               JobTitle = "UI Developer - AngularJS - Javascript - JQuery HTML5 - CSS3 - Typescript - ASP.NET - Warrington",
               JobDescription = "UI Developer with AngularJS, JavaScript, JQuery, HTML5, CSS3, experience is sought for six month contract in Warrington. Typescript and ASP.NET experience is desired but not essential.",
               IsOnFrontPage = true,
               JobType = "contract"

           },
           new JobPost
           {
               JobTitle = "Technical Lead - Startup - London",
               JobDescription = "Full Stack Technical Lead - Startup - London - £75000 - 95000 per annum, + Equity",
               SourceReference = "hn",
               JobType = "permanent"
           }
         );
        }
    }
}

