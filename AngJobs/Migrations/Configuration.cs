namespace AngJobs.Migrations
{
    using AngJobs.Models;
    using System;
    using System.Collections.Generic;
    using System.Data.Entity;
    using System.Data.Entity.Migrations;
    using System.Linq;
    using AngJobs.Helper;

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
