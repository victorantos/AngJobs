namespace AngJobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedIsfrontpagejob : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobPosts", "IsOnFrontPage", c => c.Boolean());
        }
        
        public override void Down()
        {
            DropColumn("dbo.JobPosts", "IsOnFrontPage");
        }
    }
}
