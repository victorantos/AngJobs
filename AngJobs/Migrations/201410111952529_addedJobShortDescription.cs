namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedJobShortDescription : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobPosts", "JobDuration", c => c.String());
            AddColumn("dbo.JobPosts", "JobStart", c => c.String());
            AddColumn("dbo.JobPosts", "JobShortDescription", c => c.String());
            AddColumn("dbo.JobPosts", "ContactName", c => c.String());
            AddColumn("dbo.JobPosts", "RecruiterName", c => c.String());
            AddColumn("dbo.JobPosts", "Fax", c => c.String());
            AddColumn("dbo.JobPosts", "Tel", c => c.String());
            AddColumn("dbo.JobPosts", "SalaryNote", c => c.String());
        }
        
        public override void Down()
        {
            DropColumn("dbo.JobPosts", "SalaryNote");
            DropColumn("dbo.JobPosts", "Tel");
            DropColumn("dbo.JobPosts", "Fax");
            DropColumn("dbo.JobPosts", "RecruiterName");
            DropColumn("dbo.JobPosts", "ContactName");
            DropColumn("dbo.JobPosts", "JobShortDescription");
            DropColumn("dbo.JobPosts", "JobStart");
            DropColumn("dbo.JobPosts", "JobDuration");
        }
    }
}
