namespace Angjobs.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class addedTelecomm : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.JobPosts", "CanTelecommute", c => c.Boolean());
        }
        
        public override void Down()
        {
            DropColumn("dbo.JobPosts", "CanTelecommute");
        }
    }
}
