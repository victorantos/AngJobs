namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class Initial : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.Clients",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        Secret = c.String(nullable: false),
                        Name = c.String(nullable: false, maxLength: 100),
                        ApplicationType = c.Int(nullable: false),
                        Active = c.Boolean(nullable: false),
                        RefreshTokenLifeTime = c.Int(nullable: false),
                        AllowedOrigin = c.String(maxLength: 100),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.CVs",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Name = c.String(),
                        Created = c.DateTime(nullable: false),
                        Modified = c.DateTime(nullable: false),
                        Size = c.Long(nullable: false),
                        CreatedBy = c.String(maxLength: 64),
                        DateCreated = c.DateTime(nullable: false),
                        Guid = c.Guid(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.JobApplications",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        ApplicantEmail = c.String(),
                        ApplicantSkills = c.String(),
                        ApplicantExperience = c.String(),
                        ApplicantMessage = c.String(),
                        IsDeleted = c.Boolean(),
                        CreatedBy = c.String(),
                        Ip = c.String(),
                        DateCreated = c.DateTime(nullable: false),
                        DateSent = c.DateTime(),
                        CV_Id = c.Int(),
                        User_Id = c.String(maxLength: 128),
                        JobPost_Id = c.Int(),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.CVs", t => t.CV_Id)
                .ForeignKey("dbo.Users", t => t.User_Id)
                .ForeignKey("dbo.JobPosts", t => t.JobPost_Id)
                .Index(t => t.CV_Id)
                .Index(t => t.User_Id)
                .Index(t => t.JobPost_Id);
            
            CreateTable(
                "dbo.JobPosts",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        JobTitle = c.String(maxLength: 256),
                        JobType = c.String(maxLength: 128),
                        JobDuration = c.String(maxLength: 256),
                        JobStart = c.String(maxLength: 256),
                        JobDescription = c.String(),
                        JobShortDescription = c.String(),
                        JobEmail = c.String(maxLength: 256),
                        Location = c.String(maxLength: 256),
                        Country = c.String(maxLength: 256),
                        HiringCompany = c.String(maxLength: 256),
                        Tagline = c.String(maxLength: 256),
                        HiringCompanyWebsite = c.String(maxLength: 256),
                        HiringCompanyLogo = c.String(maxLength: 256),
                        ContactName = c.String(maxLength: 256),
                        RecruiterName = c.String(maxLength: 256),
                        Fax = c.String(maxLength: 64),
                        Tel = c.String(maxLength: 64),
                        SalaryMin = c.Int(nullable: false),
                        SalaryMax = c.Int(nullable: false),
                        SalaryType = c.String(maxLength: 64),
                        Currency = c.Int(nullable: false),
                        SalaryNote = c.String(maxLength: 512),
                        CanTelecommute = c.Boolean(),
                        IsHot = c.Boolean(),
                        ExpiresOn = c.DateTime(),
                        IsDeleted = c.Boolean(),
                        CreatedBy = c.String(),
                        Ip = c.String(),
                        DateCreated = c.DateTime(nullable: false),
                        VisasPossible = c.String(maxLength: 32),
                        Intern = c.Boolean(),
                        Lat = c.Decimal(precision: 18, scale: 2),
                        Lon = c.Decimal(precision: 18, scale: 2),
                        SourceReference = c.String(maxLength: 512),
                        SourcePostedDate = c.DateTime(),
                        Owner_Id = c.String(maxLength: 128),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Users", t => t.Owner_Id)
                .Index(t => t.Owner_Id);
            
            CreateTable(
                "dbo.Users",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        Email = c.String(maxLength: 256),
                        EmailConfirmed = c.Boolean(nullable: false),
                        PasswordHash = c.String(),
                        SecurityStamp = c.String(),
                        PhoneNumber = c.String(),
                        PhoneNumberConfirmed = c.Boolean(nullable: false),
                        TwoFactorEnabled = c.Boolean(nullable: false),
                        LockoutEndDateUtc = c.DateTime(),
                        LockoutEnabled = c.Boolean(nullable: false),
                        AccessFailedCount = c.Int(nullable: false),
                        UserName = c.String(nullable: false, maxLength: 256),
                        phone = c.String(),
                        firstName = c.String(),
                        lastname = c.String(),
                        PaymentSystemId = c.String(),
                        Discriminator = c.String(nullable: false, maxLength: 128),
                    })
                .PrimaryKey(t => t.Id)
                .Index(t => t.UserName, unique: true, name: "UserNameIndex");
            
            CreateTable(
                "dbo.AspNetUserClaims",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        UserId = c.String(),
                        ClaimType = c.String(),
                        ClaimValue = c.String(),
                        IdentityUser_Id = c.String(maxLength: 128),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.Users", t => t.IdentityUser_Id)
                .Index(t => t.IdentityUser_Id);
            
            CreateTable(
                "dbo.AspNetUserLogins",
                c => new
                    {
                        LoginProvider = c.String(nullable: false, maxLength: 128),
                        ProviderKey = c.String(nullable: false, maxLength: 128),
                        UserId = c.String(nullable: false, maxLength: 128),
                        IdentityUser_Id = c.String(maxLength: 128),
                    })
                .PrimaryKey(t => new { t.LoginProvider, t.ProviderKey, t.UserId })
                .ForeignKey("dbo.Users", t => t.IdentityUser_Id)
                .Index(t => t.IdentityUser_Id);
            
            CreateTable(
                "dbo.UserRoles",
                c => new
                    {
                        UserId = c.String(nullable: false, maxLength: 128),
                        RoleId = c.String(nullable: false, maxLength: 128),
                        IdentityUser_Id = c.String(maxLength: 128),
                    })
                .PrimaryKey(t => new { t.UserId, t.RoleId })
                .ForeignKey("dbo.Roles", t => t.RoleId, cascadeDelete: true)
                .ForeignKey("dbo.Users", t => t.IdentityUser_Id)
                .Index(t => t.RoleId)
                .Index(t => t.IdentityUser_Id);
            
            CreateTable(
                "dbo.RefreshTokens",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        Subject = c.String(nullable: false, maxLength: 50),
                        ClientId = c.String(nullable: false, maxLength: 50),
                        IssuedUtc = c.DateTime(nullable: false),
                        ExpiresUtc = c.DateTime(nullable: false),
                        ProtectedTicket = c.String(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.Roles",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        Name = c.String(nullable: false, maxLength: 256),
                    })
                .PrimaryKey(t => t.Id)
                .Index(t => t.Name, unique: true, name: "RoleNameIndex");
            
            CreateTable(
                "dbo.Subscribers",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Email = c.String(nullable: false, maxLength: 256),
                        Reason = c.String(maxLength: 256),
                        DateCreated = c.DateTime(nullable: false),
                        Ip = c.String(maxLength: 32),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.SubscriptionPlans",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        Title = c.String(nullable: false),
                        PaymentSystemId = c.String(),
                        Note = c.String(),
                        Currency = c.String(),
                        Description = c.String(),
                        TrialDays = c.Int(nullable: false),
                        Price = c.Single(nullable: false),
                        State = c.Int(nullable: false),
                        CreatedDateUtc = c.DateTime(),
                        IsSoftDeleted = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => t.Id);
            
            CreateTable(
                "dbo.Subscriptions",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        ActiveUntil = c.DateTime(),
                        Notes = c.String(),
                        PaymentSystemId = c.String(),
                        PlanId = c.Int(nullable: false),
                        CreatedDateUtc = c.DateTime(),
                        IsSoftDeleted = c.Boolean(nullable: false),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.SubscriptionPlans", t => t.PlanId, cascadeDelete: true)
                .Index(t => t.PlanId);
            
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.UserRoles", "IdentityUser_Id", "dbo.Users");
            DropForeignKey("dbo.AspNetUserLogins", "IdentityUser_Id", "dbo.Users");
            DropForeignKey("dbo.AspNetUserClaims", "IdentityUser_Id", "dbo.Users");
            DropForeignKey("dbo.Subscriptions", "PlanId", "dbo.SubscriptionPlans");
            DropForeignKey("dbo.UserRoles", "RoleId", "dbo.Roles");
            DropForeignKey("dbo.JobApplications", "JobPost_Id", "dbo.JobPosts");
            DropForeignKey("dbo.JobPosts", "Owner_Id", "dbo.Users");
            DropForeignKey("dbo.JobApplications", "User_Id", "dbo.Users");
            DropForeignKey("dbo.JobApplications", "CV_Id", "dbo.CVs");
            DropIndex("dbo.Subscriptions", new[] { "PlanId" });
            DropIndex("dbo.Roles", "RoleNameIndex");
            DropIndex("dbo.UserRoles", new[] { "IdentityUser_Id" });
            DropIndex("dbo.UserRoles", new[] { "RoleId" });
            DropIndex("dbo.AspNetUserLogins", new[] { "IdentityUser_Id" });
            DropIndex("dbo.AspNetUserClaims", new[] { "IdentityUser_Id" });
            DropIndex("dbo.Users", "UserNameIndex");
            DropIndex("dbo.JobPosts", new[] { "Owner_Id" });
            DropIndex("dbo.JobApplications", new[] { "JobPost_Id" });
            DropIndex("dbo.JobApplications", new[] { "User_Id" });
            DropIndex("dbo.JobApplications", new[] { "CV_Id" });
            DropTable("dbo.Subscriptions");
            DropTable("dbo.SubscriptionPlans");
            DropTable("dbo.Subscribers");
            DropTable("dbo.Roles");
            DropTable("dbo.RefreshTokens");
            DropTable("dbo.UserRoles");
            DropTable("dbo.AspNetUserLogins");
            DropTable("dbo.AspNetUserClaims");
            DropTable("dbo.Users");
            DropTable("dbo.JobPosts");
            DropTable("dbo.JobApplications");
            DropTable("dbo.CVs");
            DropTable("dbo.Clients");
        }
    }
}
