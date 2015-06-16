namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class alterFieldSize3 : DbMigration
    {
        public override void Up()
        {
            AlterColumn("dbo.JobPosts", "JobType", c => c.String(maxLength: 128));
            AlterColumn("dbo.JobPosts", "HiringCompanyLogo", c => c.String(maxLength: 256));
            AlterColumn("dbo.JobPosts", "ContactName", c => c.String(maxLength: 256));
            AlterColumn("dbo.JobPosts", "RecruiterName", c => c.String(maxLength: 256));
            AlterColumn("dbo.JobPosts", "Fax", c => c.String(maxLength: 64));
            AlterColumn("dbo.JobPosts", "Tel", c => c.String(maxLength: 64));
            AlterColumn("dbo.JobPosts", "SalaryType", c => c.String(maxLength: 64));
            AlterColumn("dbo.JobPosts", "SalaryNote", c => c.String(maxLength: 512));
            AlterColumn("dbo.JobPosts", "SourceReference", c => c.String(maxLength: 512));
        }
        
        public override void Down()
        {
            AlterColumn("dbo.JobPosts", "SourceReference", c => c.String());
            AlterColumn("dbo.JobPosts", "SalaryNote", c => c.String());
            AlterColumn("dbo.JobPosts", "SalaryType", c => c.String());
            AlterColumn("dbo.JobPosts", "Tel", c => c.String());
            AlterColumn("dbo.JobPosts", "Fax", c => c.String());
            AlterColumn("dbo.JobPosts", "RecruiterName", c => c.String());
            AlterColumn("dbo.JobPosts", "ContactName", c => c.String());
            AlterColumn("dbo.JobPosts", "HiringCompanyLogo", c => c.String());
            AlterColumn("dbo.JobPosts", "JobType", c => c.String(maxLength: 64));
        }
    }
}
