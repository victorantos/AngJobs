namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedtagline : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobPosts", "Tagline", c => c.String());
        }
        
        public override void Down()
        {
            DropColumn("dbo.JobPosts", "Tagline");
        }
    }
}
