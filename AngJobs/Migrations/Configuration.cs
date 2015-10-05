namespace Angjobs.Migrations
{
    using Angjobs.Entities;
    using Angjobs.ImportJobs;
    using Microsoft.AspNet.Identity;
    using Microsoft.AspNet.Identity.EntityFramework;
    using StripeEntities;
    using System;
    using System.Collections.Generic;
    using System.Data.Entity;
    using System.Data.Entity.Core.Objects;
    using System.Data.Entity.Migrations;
    using System.Diagnostics;
    using System.Linq;
    using Microsoft.AspNet.Identity.Owin;

using System.Web;
    using Microsoft.Owin;
    using Angjobs.Models;

    public class Configuration : DbMigrationsConfiguration<Angjobs.Models.DBContext>
    {
        public Configuration()
        {
            AutomaticMigrationsEnabled = false;
            AutomaticMigrationDataLossAllowed = true;
            ContextKey = "Angjobs.Models.DBContext";
        }

        protected override void Seed(Angjobs.Models.DBContext context)
        {
            if (context.Clients.Count() == 0)
            {
                context.Clients.AddRange(BuildClientsList());
            }

            AddRolesAndUsers(context);

            AddSubscriptionPlan(context);

            AddHackerNewsJobs(context);

            context.SaveChanges();
        }

        private void AddRolesAndUsers(Models.DBContext context)
        {
            string admin = "Admin";
           
            var roleStore = new RoleStore<IdentityRole>(context);
            var roleManager = new RoleManager<IdentityRole>(roleStore);

            var userStore = new UserStore<User>(context);
            var userManager = new UserManager<User>(userStore);

            var adminUser = context.Users.FirstOrDefault(u => u.Email == "victorantos@gmail.com" && u.UserName == "VictorAntofica");
 
            if(!roleManager.RoleExists(admin))
            {
                roleManager.Create(new IdentityRole { Name = admin });
            }
            userManager.AddToRole(adminUser.Id, admin);
        }

        private void AddHackerNewsJobs(Models.DBContext context)
        {
            var anyJobLastMonth = context.JobPosts.FirstOrDefault(j => j.SourceReference.Contains("news.ycombinator")
                && DbFunctions.TruncateTime(j.SourcePostedDate).Value.Month == DbFunctions.TruncateTime(DateTime.UtcNow).Value.Month-1
                && DbFunctions.TruncateTime(j.SourcePostedDate).Value.Year == DbFunctions.TruncateTime(DateTime.UtcNow).Value.Year);
            if (anyJobLastMonth == null)
            {
                var lastMonthJobs = Import.LoadHackerNewsFeed(DateTime.UtcNow.AddMonths(-1));
                if (lastMonthJobs.Any())
                    context.JobPosts.AddRange(lastMonthJobs);
            }

            var anyJobThisMonth = context.JobPosts.FirstOrDefault(j => j.SourceReference.Contains("news.ycombinator")
              && DbFunctions.TruncateTime(j.SourcePostedDate).Value.Month == DbFunctions.TruncateTime(DateTime.UtcNow).Value.Month
              && DbFunctions.TruncateTime(j.SourcePostedDate).Value.Year == DbFunctions.TruncateTime(DateTime.UtcNow).Value.Year);
            if (anyJobThisMonth == null)
            {
                var thisMonthJobs = Import.LoadHackerNewsFeed();
                if (thisMonthJobs.Any())
                    context.JobPosts.AddRange(thisMonthJobs);
            }
        }

        private static void AddSubscriptionPlan(Angjobs.Models.DBContext context)
        {
            string paymentSystemId = "Up100PerMo";
            if (context.SubscriptionPlans.FirstOrDefault(p => p.PaymentSystemId == paymentSystemId) == null)
            {
                var plan = new SubscriptionPlan();
                plan.Description = "Up to 100 job applications - monthly plan";
                plan.PaymentSystemId = paymentSystemId;
                plan.Price = 3.99f;
                plan.Currency = "gbp";
                plan.State = SubscriptionPlan.SubscriptionState.Available;
                plan.Title = "Up to 100 job applications per month";
                plan.CreatedDateUtc = DateTime.UtcNow;
                plan.IsSoftDeleted = false;

                context.SubscriptionPlans.Add(plan);

                try
                {
                    StripeManager.CreatePlan(plan);
                }
                catch (Exception ex)
                {

                    Debug.WriteLine("Error:", ex.Message);
                }
              
            }
        }
        private static List<Client> BuildClientsList()
        {
            List<Client> ClientsList = new List<Client> 
            {
                new Client
                { Id = "angjobsApp", 
                    Secret= Helpers.GetHash("azieziuata2014."), 
                    Name="AngJobs web app", 
                    ApplicationType =  Models.ApplicationTypes.JavaScript, 
                    Active = true, 
                    RefreshTokenLifeTime = 7200, 

                    AllowedOrigin =
                                        #if DEBUG
                                         "http://localhost:33652"
                                        #else
                                          "https://angjobs.com"
                                        #endif
                },
                new Client
                { Id = "angjobsMobileApp", 
                    Secret=Helpers.GetHash("azieziuata2014."), 
                    Name="Sneos Mobile App", 
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
