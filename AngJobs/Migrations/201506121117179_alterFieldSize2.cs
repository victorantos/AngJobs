namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class alterFieldSize2 : DbMigration
    {
        public override void Up()
        {
            AlterColumn("dbo.JobPosts", "JobStart", c => c.String(maxLength: 256));
            AlterColumn("dbo.JobPosts", "JobEmail", c => c.String(maxLength: 256));
            AlterColumn("dbo.JobPosts", "Location", c => c.String(maxLength: 256));
            AlterColumn("dbo.JobPosts", "Country", c => c.String(maxLength: 256));
            AlterColumn("dbo.JobPosts", "HiringCompany", c => c.String(maxLength: 256));
            AlterColumn("dbo.JobPosts", "Tagline", c => c.String(maxLength: 256));
            AlterColumn("dbo.JobPosts", "HiringCompanyWebsite", c => c.String(maxLength: 256));
        }
        
        public override void Down()
        {
            AlterColumn("dbo.JobPosts", "HiringCompanyWebsite", c => c.String());
            AlterColumn("dbo.JobPosts", "Tagline", c => c.String());
            AlterColumn("dbo.JobPosts", "HiringCompany", c => c.String());
            AlterColumn("dbo.JobPosts", "Country", c => c.String());
            AlterColumn("dbo.JobPosts", "Location", c => c.String());
            AlterColumn("dbo.JobPosts", "JobEmail", c => c.String());
            AlterColumn("dbo.JobPosts", "JobStart", c => c.String());
        }
    }
}
