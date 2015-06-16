namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedSourceref : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobPosts", "SourceReference", c => c.String());
            AddColumn("dbo.JobPosts", "SourcePostedDate", c => c.DateTime());
        }
        
        public override void Down()
        {
            DropColumn("dbo.JobPosts", "SourcePostedDate");
            DropColumn("dbo.JobPosts", "SourceReference");
        }
    }
}
