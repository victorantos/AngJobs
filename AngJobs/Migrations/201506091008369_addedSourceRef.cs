namespace AngJobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedSourceRef : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobPosts", "JobLocation", c => c.String(maxLength: 64));
            AddColumn("dbo.JobPosts", "SourceReference", c => c.String(maxLength: 64));
            AlterColumn("dbo.JobPosts", "JobTitle", c => c.String(maxLength: 256));
        }
        
        public override void Down()
        {
            AlterColumn("dbo.JobPosts", "JobTitle", c => c.String());
            DropColumn("dbo.JobPosts", "SourceReference");
            DropColumn("dbo.JobPosts", "JobLocation");
        }
    }
}
