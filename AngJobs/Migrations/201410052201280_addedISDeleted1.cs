namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedISDeleted1 : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobPosts", "Location", c => c.String());
        }
        
        public override void Down()
        {
            DropColumn("dbo.JobPosts", "Location");
        }
    }
}
