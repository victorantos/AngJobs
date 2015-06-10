namespace AngJobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedJobType : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobPosts", "JobType", c => c.String(maxLength: 64));
        }
        
        public override void Down()
        {
            DropColumn("dbo.JobPosts", "JobType");
        }
    }
}
