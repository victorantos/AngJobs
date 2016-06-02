namespace Angjobs.Migrations
{
    using Entities;
    using System;
    using System.Collections.Generic;
    using System.Data.Entity;
    using System.Data.Entity.Migrations;
    using System.Linq;

    internal sealed class Configuration : DbMigrationsConfiguration<Angjobs.Models.DBContext>
    {
        public Configuration()
        {
            AutomaticMigrationsEnabled = true;
        }

        protected override void Seed(Angjobs.Models.DBContext context)
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
            //

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
                    Secret= Helpers.Common.GetHash("angjobsSecret"),
                    Name="AngJobs web app",
                    ApplicationType =  Models.ApplicationTypes.JavaScript,
                    Active = true,
                    RefreshTokenLifeTime = 7200,

                    AllowedOrigin =
                                        #if DEBUG
                                         "http://localhost:33652"
                                        #else
                                          "http://angjobs.com"
                                        #endif
                },
                new Client
                { Id = "angjobsMobileApp",
                    Secret=Helpers.Common.GetHash("angjobsSecret."),
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
